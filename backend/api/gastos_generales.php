<?php
// backend/api/gastos_generales.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/database.php';

// Solo usuarios logueados pueden acceder
requerirRol('usuario');

$metodo = $_SERVER['REQUEST_METHOD'];
$pdo = obtenerConexionBD();
$usuario_id = $_SESSION['usuario_id'];

if ($metodo === 'GET') {
    $year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));
    $month = isset($_GET['month']) ? intval($_GET['month']) : intval(date('n'));

    try {
        $stmt = $pdo->prepare("
            SELECT 
                g.id,
                g.cliente_id,
                g.obra_id,
                g.proveedor_id,
                g.concepto,
                g.fecha,
                g.importe_base,
                g.iva_porcentaje,
                c.nombre as cliente_nombre, 
                o.titulo as obra_nombre, 
                p.nombre as proveedor_nombre,
                ROUND(g.importe_base * (g.iva_porcentaje / 100), 2) as cantidad_iva,
                ROUND(g.importe_base + (g.importe_base * (g.iva_porcentaje / 100)), 2) as importe_total
            FROM gastos_generales g
            LEFT JOIN clientes c ON g.cliente_id = c.id
            LEFT JOIN obras o ON g.obra_id = o.id
            LEFT JOIN proveedores p ON g.proveedor_id = p.id
            WHERE g.usuario_id = ? 
              AND YEAR(g.fecha) = ? 
              AND MONTH(g.fecha) = ?
            ORDER BY g.fecha DESC, g.id DESC
        ");
        $stmt->execute([$usuario_id, $year, $month]);
        enviarRespuesta($stmt->fetchAll());
    } catch (PDOException $e) {
        error_log('Error GET Gastos Generales: ' . $e->getMessage());
        manejarError("Error al obtener los gastos generales.", 500);
    }
} 
elseif ($metodo === 'POST') {
    $entrada = file_get_contents("php://input");
    $datos = json_decode($entrada, true);
    if (!$datos) {
        manejarError("No se recibieron datos válidos.");
    }

    $cliente_id = !empty($datos['cliente_id']) ? $datos['cliente_id'] : null;
    $obra_id = !empty($datos['obra_id']) ? $datos['obra_id'] : null;
    $proveedor_id = !empty($datos['proveedor_id']) ? $datos['proveedor_id'] : null;
    $concepto = trim($datos['concepto'] ?? '');
    $fecha = $datos['fecha'] ?? '';
    $importe_base = floatval($datos['importe_base'] ?? 0);
    $iva_porcentaje = floatval($datos['iva_porcentaje'] ?? 0);

    // Validar Requeridos
    if (!$cliente_id) manejarError("Por favor, selecciona un Cliente válido del desplegable.");
    if (empty($concepto)) manejarError("El concepto detallado es obligatorio.");
    if (empty($fecha)) manejarError("La fecha es obligatoria.");
    if ($importe_base < 0) manejarError("El importe base no puede ser negativo.");
    if ($iva_porcentaje < 0 || $iva_porcentaje > 100) manejarError("El porcentaje de IVA es inválido.");

    try {
        // Validación de pertenencia al usuario_id
        $stmtVal = $pdo->prepare("SELECT id FROM clientes WHERE id = ? AND usuario_id = ?");
        $stmtVal->execute([$cliente_id, $usuario_id]);
        if (!$stmtVal->fetch()) manejarError("Cliente no válido o no autorizado.");

        if ($obra_id) {
            $stmtVal = $pdo->prepare("SELECT id FROM obras WHERE id = ? AND usuario_id = ?");
            $stmtVal->execute([$obra_id, $usuario_id]);
            if (!$stmtVal->fetch()) manejarError("Obra no válida o no autorizada.");
        }

        if ($proveedor_id) {
            $stmtVal = $pdo->prepare("SELECT id FROM proveedores WHERE id = ? AND usuario_id = ?");
            $stmtVal->execute([$proveedor_id, $usuario_id]);
            if (!$stmtVal->fetch()) manejarError("Proveedor no válido o no autorizado.");
        }

        $stmt = $pdo->prepare("
            INSERT INTO gastos_generales 
            (usuario_id, cliente_id, obra_id, proveedor_id, concepto, fecha, importe_base, iva_porcentaje) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $usuario_id,
            $cliente_id,
            $obra_id,
            $proveedor_id,
            $concepto,
            $fecha,
            $importe_base,
            $iva_porcentaje
        ]);
        
        $gasto_id = $pdo->lastInsertId();

        enviarRespuesta([
            'mensaje' => 'Gasto registrado correctamente',
            'id' => $gasto_id,
            'es_vinculado_obra' => ($obra_id !== null && $obra_id !== '')
        ]);
        
    } catch (PDOException $e) {
        error_log('Error POST Gastos Generales: ' . $e->getMessage());
        manejarError("Error al registrar el gasto general.", 500);
    }
} 
elseif ($metodo === 'PUT') {
    $entrada = file_get_contents("php://input");
    $datos = json_decode($entrada, true);
    
    // Obtener ID por variable GET (?id=X) o dentro del propio JSON
    $idGasto = isset($_GET['id']) ? intval($_GET['id']) : (isset($datos['id']) ? intval($datos['id']) : 0);

    if (!$idGasto || !$datos) {
        manejarError("Datos inválidos o ID del gasto no especificado.");
    }

    $cliente_id = !empty($datos['cliente_id']) ? $datos['cliente_id'] : null;
    $obra_id = !empty($datos['obra_id']) ? $datos['obra_id'] : null;
    $proveedor_id = !empty($datos['proveedor_id']) ? $datos['proveedor_id'] : null;
    $concepto = trim($datos['concepto'] ?? '');
    $fecha = $datos['fecha'] ?? '';
    $importe_base = floatval($datos['importe_base'] ?? 0);
    $iva_porcentaje = floatval($datos['iva_porcentaje'] ?? 0);

    if (!$cliente_id) manejarError("Por favor, selecciona un Cliente válido del desplegable.");
    if (empty($concepto)) manejarError("El concepto detallado es obligatorio.");
    if (empty($fecha)) manejarError("La fecha es obligatoria.");
    if ($importe_base < 0) manejarError("El importe base no puede ser negativo.");
    if ($iva_porcentaje < 0 || $iva_porcentaje > 100) manejarError("El porcentaje de IVA es inválido.");

    try {
        // Verificar que el gasto pertenece al usuario
        $stmtGasto = $pdo->prepare("SELECT id FROM gastos_generales WHERE id = ? AND usuario_id = ?");
        $stmtGasto->execute([$idGasto, $usuario_id]);
        if (!$stmtGasto->fetch()) manejarError("El gasto no existe o no tienes permiso para editarlo.");

        // Validaciones relacionales cruzadas
        $stmtVal = $pdo->prepare("SELECT id FROM clientes WHERE id = ? AND usuario_id = ?");
        $stmtVal->execute([$cliente_id, $usuario_id]);
        if (!$stmtVal->fetch()) manejarError("Cliente no válido o no autorizado.");

        if ($obra_id) {
            $stmtVal = $pdo->prepare("SELECT id FROM obras WHERE id = ? AND usuario_id = ?");
            $stmtVal->execute([$obra_id, $usuario_id]);
            if (!$stmtVal->fetch()) manejarError("Obra no válida o no autorizada.");
        }

        if ($proveedor_id) {
            $stmtVal = $pdo->prepare("SELECT id FROM proveedores WHERE id = ? AND usuario_id = ?");
            $stmtVal->execute([$proveedor_id, $usuario_id]);
            if (!$stmtVal->fetch()) manejarError("Proveedor no válido o no autorizado.");
        }

        $stmt = $pdo->prepare("
            UPDATE gastos_generales SET 
                cliente_id = ?, 
                obra_id = ?, 
                proveedor_id = ?, 
                concepto = ?, 
                fecha = ?, 
                importe_base = ?, 
                iva_porcentaje = ? 
            WHERE id = ? AND usuario_id = ?
        ");
        
        $stmt->execute([
            $cliente_id,
            $obra_id,
            $proveedor_id,
            $concepto,
            $fecha,
            $importe_base,
            $iva_porcentaje,
            $idGasto,
            $usuario_id
        ]);

        enviarRespuesta(['mensaje' => 'Gasto actualizado correctamente']);
        
    } catch (PDOException $e) {
        error_log('Error PUT Gastos Generales: ' . $e->getMessage());
        manejarError("Error al actualizar el gasto general.", 500);
    }
} 
elseif ($metodo === 'DELETE') {
    $idGasto = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$idGasto) {
        manejarError("ID del gasto no especificado.");
    }

    try {
        $stmtDel = $pdo->prepare("DELETE FROM gastos_generales WHERE id = ? AND usuario_id = ?");
        $stmtDel->execute([$idGasto, $usuario_id]);

        if ($stmtDel->rowCount() > 0) {
            enviarRespuesta(['mensaje' => 'Gasto eliminado correctamente']);
        } else {
            manejarError("No se ha podido eliminar el gasto o no tienes permisos.");
        }
    } catch (PDOException $e) {
        error_log('Error DELETE Gastos Generales: ' . $e->getMessage());
        manejarError("Error al eliminar el gasto general.", 500);
    }
}
else {
    http_response_code(405);
}
