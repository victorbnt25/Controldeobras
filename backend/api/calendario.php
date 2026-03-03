<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    require_once __DIR__ . '/../config/cors.php';
    require_once __DIR__ . '/../config/auth.php';
    require_once __DIR__ . '/../config/database.php';
    $conexion = obtenerConexionBD();
    requerirRol('usuario');
    $usuario_id = $_SESSION['usuario_id'];
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error crítico: ' . $e->getMessage()]);
    exit;
}

// 0. Auto-migración (Crear tabla planificacion_obras si no existe)
$checkTabla = $conexion->prepare("
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'planificacion_obras'
");
$checkTabla->execute();
if ((int)$checkTabla->fetchColumn() === 0) {
    $conexion->exec("
        CREATE TABLE planificacion_obras (
            id INT AUTO_INCREMENT PRIMARY KEY,
            obra_id INT NOT NULL,
            fecha DATE NOT NULL,
            usuario_id INT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    ");
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    try {
        $eventos = [];

        // 1. Añadir Planificaciones Específicas Diarias
        $consultaPlan = $conexion->prepare("
            SELECT po.id, po.fecha, o.titulo, o.numero_obra 
            FROM planificacion_obras po
            JOIN obras o ON po.obra_id = o.id
            WHERE po.usuario_id = ?
        ");
        $consultaPlan->execute([$usuario_id]);
        while ($plan = $consultaPlan->fetch(PDO::FETCH_ASSOC)) {
            $tituloObra = $plan['titulo'] ? $plan['titulo'] : $plan['numero_obra'];
            $eventos[] = [
                'id' => 'plan_' . $plan['id'],
                'db_id' => $plan['id'],
                'title' => 'Obra: ' . $tituloObra,
                'start' => $plan['fecha'],
                'end' => $plan['fecha'],
                'allDay' => true,
                'type' => 'planificacion',
                'color' => '#1f3a8a' // Azul oscuro para obra planificada
            ];
        }

        /* 
        // 2. Añadir Jornadas de Trabajadores
        $consultaJornadas = $conexion->prepare("
            SELECT oj.id, oj.fecha, oj.cantidad as horas, t.nombre as trabajador, IFNULL(o.titulo, o.numero_obra) as obra
            FROM obra_jornadas oj 
            JOIN obras o ON oj.obra_id = o.id 
            JOIN trabajadores t ON oj.trabajador_id = t.id 
            WHERE o.usuario_id = ?
        ");
        $consultaJornadas->execute([$usuario_id]);
        while ($jornada = $consultaJornadas->fetch(PDO::FETCH_ASSOC)) {
            $eventos[] = [
                'id' => 'jornada_' . $jornada['id'],
                'db_id' => $jornada['id'],
                'title' => $jornada['trabajador'] . (trim($jornada['obra']) ? (' (' . $jornada['obra'] . ')') : ''),
                'start' => $jornada['fecha'],
                'end' => $jornada['fecha'],
                'allDay' => true,
                'type' => 'jornada',
                'color' => '#16a34a' // Verde para operarios/jornadas
            ];
        } 
        */

        echo json_encode($eventos);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($metodo === 'POST') {
    try {
        $datos = json_decode(file_get_contents('php://input'), true);
        
        $obras_ids = $datos['obras_ids'] ?? [];
        $fecha_inicio = $datos['fecha_inicio'] ?? '';
        $fecha_fin = $datos['fecha_fin'] ?? '';

        if (empty($obras_ids) || empty($fecha_inicio) || empty($fecha_fin)) {
            http_response_code(400);
            echo json_encode(['error' => 'Faltan obras o fechas']);
            exit;
        }

        if (!is_array($obras_ids)) $obras_ids = [$obras_ids];

        // Validar obras del usuario
        $obrasValidasIds = [];
        $inQuery = implode(',', array_fill(0, count($obras_ids), '?'));
        $checkObras = $conexion->prepare("SELECT id FROM obras WHERE id IN ($inQuery) AND usuario_id = ?");
        $paramsCheck = array_merge($obras_ids, [$usuario_id]);
        $checkObras->execute($paramsCheck);
        while($row = $checkObras->fetch(PDO::FETCH_ASSOC)) {
            $obrasValidasIds[] = $row['id'];
        }

        $conexion->beginTransaction();

        $checkPlan = $conexion->prepare("SELECT id FROM planificacion_obras WHERE obra_id = ? AND fecha = ? AND usuario_id = ?");
        $ins = $conexion->prepare("INSERT INTO planificacion_obras (obra_id, fecha, usuario_id) VALUES (?, ?, ?)");

        $fechaActual = new DateTime($fecha_inicio);
        $fechaFinDt = new DateTime($fecha_fin);
        
        while ($fechaActual <= $fechaFinDt) {
            $fechaStr = $fechaActual->format('Y-m-d');
            
            foreach ($obrasValidasIds as $obra_id) {
                $checkPlan->execute([$obra_id, $fechaStr, $usuario_id]);
                if (!$checkPlan->fetch()) {
                    $ins->execute([$obra_id, $fechaStr, $usuario_id]);
                }
            }
            $fechaActual->modify('+1 day');
        }

        $conexion->commit();
        echo json_encode(['ok' => true]);
    } catch (Throwable $e) {
        if ($conexion && $conexion->inTransaction()) {
            $conexion->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} elseif ($metodo === 'DELETE') {
    try {
        $id = $_GET['id'] ?? 0;
        $del = $conexion->prepare("DELETE FROM planificacion_obras WHERE id = ? AND usuario_id = ?");
        $del->execute([$id, $usuario_id]);
        echo json_encode(['ok' => true]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?>
