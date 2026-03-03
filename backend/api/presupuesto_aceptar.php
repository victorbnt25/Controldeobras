<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$conexion = obtenerConexionBD();
requerirRol('usuario');
$usuario_id = $_SESSION['usuario_id'];
$datos = json_decode(file_get_contents('php://input'), true);

if (empty($datos['presupuesto_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de presupuesto requerido']);
    exit;
}

$presupuestoId = (int)$datos['presupuesto_id'];

try {
    $conexion->beginTransaction();

    // 1. Obtener presupuesto
    $consulta = $conexion->prepare("
        SELECT *
        FROM presupuestos
        WHERE id = ? AND usuario_id = ?
        FOR UPDATE
    ");
    $consulta->execute([$presupuestoId, $usuario_id]);
    $presupuesto = $consulta->fetch(PDO::FETCH_ASSOC);

    if (!$presupuesto) {
        throw new Exception('Presupuesto no encontrado o no le pertenece');
    }

    // 2. Comprobar si ya existe obra
    $consultaCheck = $conexion->prepare("
        SELECT id, numero_obra
        FROM obras
        WHERE presupuesto_id = ? AND usuario_id = ?
    ");
    $consultaCheck->execute([$presupuestoId, $usuario_id]);
    $obraExistente = $consultaCheck->fetch(PDO::FETCH_ASSOC);

    if ($obraExistente) {
        $conexion->commit();
        echo json_encode([
            'ok' => true,
            'mensaje' => 'La obra ya estaba creada',
            'obra_id' => $obraExistente['id'],
            'numero_obra' => $obraExistente['numero_obra']
        ]);
        exit;
    }

    // 3. Cambiar estado si no está aceptado
    if ($presupuesto['estado'] !== 'aceptado') {
        $consultaAct = $conexion->prepare("
            UPDATE presupuestos 
            SET estado = 'aceptado'
            WHERE id = ? AND usuario_id = ?
        ");
        $consultaAct->execute([$presupuestoId, $usuario_id]);
    }

    // 4. Generar número obra
    $anio = date('Y');

    $consultaCorr = $conexion->prepare("
        SELECT COUNT(*) + 1 AS correlativo
        FROM obras
        WHERE YEAR(created_at) = ? AND usuario_id = ?
    ");
    $consultaCorr->execute([$anio, $usuario_id]);
    $fila = $consultaCorr->fetch(PDO::FETCH_ASSOC);

    $correlativo = str_pad($fila['correlativo'], 3, '0', STR_PAD_LEFT);
    $numeroObra = "OB-" . $anio . "-" . $correlativo;

    // 5. Crear obra
    $consultaIns = $conexion->prepare("
        INSERT INTO obras
        (presupuesto_id, cliente_id, numero_obra, titulo, descripcion, presupuesto_total, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $consultaIns->execute([
        $presupuestoId,
        $presupuesto['cliente_id'],
        $numeroObra,
        $presupuesto['descripcion_general'],
        $presupuesto['descripcion_general'],
        $presupuesto['total_presupuesto'],
        $usuario_id
    ]);

    $obraId = $conexion->lastInsertId();

    $conexion->commit();

    echo json_encode([
        'ok' => true,
        'mensaje' => 'Presupuesto aceptado y obra creada correctamente',
        'obra_id' => $obraId,
        'numero_obra' => $numeroObra
    ]);

} catch (Exception $e) {
    if ($conexion && $conexion->inTransaction()) $conexion->rollBack();
    http_response_code(400);
    echo json_encode([
        'error' => $e->getMessage()
    ]);
}
