<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuración de base de datos (Ajustar según tu entorno real o incluir db.php)
define('DB_HOST', 'localhost');
define('DB_NAME', 'reformas_db');
define('DB_USER', 'root');
define('DB_PASS', '');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// --- GET: Obtener Obra, Gastos y Jornadas ---
if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    
    if ($id) {
        // 1. Datos de la obra
        $stmt = $pdo->prepare("
            SELECT o.*, c.nombre as cliente_nombre 
            FROM obras o 
            JOIN clientes c ON o.cliente_id = c.id 
            WHERE o.id = ?
        ");
        $stmt->execute([$id]);
        $obra = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($obra) {
            // 2. Gastos Generales
            $stmtGastos = $pdo->prepare("SELECT * FROM gastos WHERE obra_id = ? ORDER BY fecha DESC, id DESC");
            $stmtGastos->execute([$id]);
            $obra['gastos'] = $stmtGastos->fetchAll(PDO::FETCH_ASSOC);

            // 3. Jornadas (Mano de Obra)
            $stmtJornadas = $pdo->prepare("
                SELECT oj.*, t.nombre as trabajador_nombre 
                FROM obra_jornadas oj
                JOIN trabajadores t ON oj.trabajador_id = t.id
                WHERE oj.obra_id = ?
                ORDER BY oj.fecha DESC, oj.id DESC
            ");
            $stmtJornadas->execute([$id]);
            $obra['jornadas'] = $stmtJornadas->fetchAll(PDO::FETCH_ASSOC);

            // Calcular totales
            $totalGastos = 0;
            foreach ($obra['gastos'] as $g) $totalGastos += $g['importe'];

            $totalManoObra = 0;
            foreach ($obra['jornadas'] as $j) $totalManoObra += $j['total'];

            // Actualizar gastado en la tabla obras (opcional, pero bueno para consistencia)
            $totalGlobal = $totalGastos + $totalManoObra;
            $pdo->prepare("UPDATE obras SET gastado = ? WHERE id = ?")->execute([$totalGlobal, $id]);
            $obra['gastado'] = $totalGlobal;

            echo json_encode($obra);
        } else {
            http_response_code(404);
            echo json_encode(["error" => "Obra no encontrada"]);
        }
    } else {
        // Listado de obras
        $stmt = $pdo->query("
            SELECT o.*, c.nombre as cliente_nombre 
            FROM obras o 
            JOIN clientes c ON o.cliente_id = c.id 
            ORDER BY o.created_at DESC
        ");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
}

// --- POST: Crear Gasto o Jornada ---
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Verificar si es Jornada o Gasto normal
    if (isset($data['tipo_registro']) && $data['tipo_registro'] === 'jornada') {
        // === CREAR JORNADA ===
        try {
            // Obtener precios del trabajador
            $stmtT = $pdo->prepare("SELECT * FROM trabajadores WHERE id = ?");
            $stmtT->execute([$data['trabajador_id']]);
            $trabajador = $stmtT->fetch(PDO::FETCH_ASSOC);

            if (!$trabajador) throw new Exception("Trabajador no encontrado");

            $precioUnitario = 0;
            $cantidad = floatval($data['cantidad']);
            $tipo = $data['tipo']; // dia, sabado, hora
            $fecha = !empty($data['fecha']) ? $data['fecha'] : date('Y-m-d');

            // Asegurar valores numéricos para evitar errores de cálculo
            $pDia = floatval($trabajador['precio_dia'] ?? 0);
            $pHora = floatval($trabajador['precio_hora'] ?? 0);
            $pSabado = floatval($trabajador['precio_sabado'] ?? 0);

            if ($tipo === 'dia') $precioUnitario = $pDia ?: ($pHora * 8);
            elseif ($tipo === 'sabado') $precioUnitario = $pSabado;
            elseif ($tipo === 'hora') $precioUnitario = $pHora;
            
            // Si no hay precio definido, usar 0 o lanzar error. Aquí usamos 0.
            $total = $cantidad * $precioUnitario;

            $stmt = $pdo->prepare("
                INSERT INTO obra_jornadas (obra_id, trabajador_id, fecha, tipo, cantidad, precio_unitario, total)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['obra_id'], 
                $data['trabajador_id'], 
                $fecha, 
                $tipo, 
                $cantidad, 
                $precioUnitario, 
                $total
            ]);

            echo json_encode(["message" => "Jornada añadida", "id" => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(["error" => $e->getMessage()]);
        }

    } else {
        // === CREAR GASTO GENERAL ===
        $esExtra = !empty($data['es_extra']) ? 1 : 0;
        $stmt = $pdo->prepare("INSERT INTO gastos (obra_id, importe, concepto, fecha, es_extra) VALUES (?, ?, ?, NOW(), ?)");
        $stmt->execute([$data['obra_id'], $data['importe'], $data['concepto'], $esExtra]);
        echo json_encode(["message" => "Gasto creado", "id" => $pdo->lastInsertId()]);
    }
}

// --- PUT: Actualizar Gasto (Solo implementado para gastos generales por ahora) ---
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (isset($data['gasto_id'])) {
        $stmt = $pdo->prepare("UPDATE gastos SET importe = ?, concepto = ? WHERE id = ?");
        $stmt->execute([$data['importe'], $data['concepto'], $data['gasto_id']]);
        echo json_encode(["message" => "Gasto actualizado"]);
    }
}

// --- DELETE: Eliminar Gasto o Jornada ---
elseif ($method === 'DELETE') {
    if (isset($_GET['gasto_id'])) {
        $stmt = $pdo->prepare("DELETE FROM gastos WHERE id = ?");
        $stmt->execute([$_GET['gasto_id']]);
        echo json_encode(["message" => "Gasto eliminado"]);
    } 
    elseif (isset($_GET['jornada_id'])) {
        $stmt = $pdo->prepare("DELETE FROM obra_jornadas WHERE id = ?");
        $stmt->execute([$_GET['jornada_id']]);
        echo json_encode(["message" => "Jornada eliminada"]);
    }
}
?>