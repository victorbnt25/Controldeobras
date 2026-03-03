<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$conexion = obtenerConexionBD();
requerirRol('usuario');
$usuario_id = $_SESSION['usuario_id'];
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {

    /* =======================
       GET - OBTENER
    ======================= */
    case 'GET':
        if (isset($_GET['id'])) {
            $proceso = $conexion->prepare(
                "SELECT * FROM trabajadores WHERE id = ? AND usuario_id = ? AND activo = 1"
            );
            $proceso->execute([$_GET['id'], $usuario_id]);
            $trabajador = $proceso->fetch(PDO::FETCH_ASSOC);

            if (!$trabajador) {
                http_response_code(404);
                echo json_encode(['error' => 'Trabajador no encontrado']);
                exit;
            }

            echo json_encode($trabajador);
        } else {
            $proceso = $conexion->prepare(
                "SELECT * FROM trabajadores WHERE usuario_id = ? AND activo = 1 ORDER BY nombre ASC"
            );
            $proceso->execute([$usuario_id]);
            echo json_encode($proceso->fetchAll(PDO::FETCH_ASSOC));
        }
        break;

    /* =======================
       POST → CREAR
    ======================= */
   case 'POST':
    $datos = json_decode(file_get_contents('php://input'), true);

    if (!is_array($datos)) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        exit;
    }

    $nombre = trim($datos['nombre'] ?? '');
    $telefono = trim($datos['telefono'] ?? '');
    $tipo = strtolower(trim($datos['tipo'] ?? ''));

    if (!in_array($tipo, ['fijo', 'eventual'], true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Tipo inválido']);
        exit;
    }

    if (
        $nombre === '' ||
        (!isset($datos['precio_hora']) && !isset($datos['precioHora'])) ||
        (!isset($datos['precio_sabado']) && !isset($datos['precioSabado']))
    ) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos incompletos']);
        exit;
    }

    // Normalizar decimales
    $precioDia = isset($datos['precio_dia']) && $datos['precio_dia'] !== ''
        ? (float)str_replace(',', '.', $datos['precio_dia'])
        : null;

    $precioHora = (float)str_replace(',', '.', $datos['precio_hora'] ?? $datos['precioHora']);
    $precioSabado = (float)str_replace(',', '.', $datos['precio_sabado'] ?? $datos['precioSabado']);

    $proceso = $conexion->prepare("
        INSERT INTO trabajadores
        (nombre, telefono, tipo, precio_dia, precio_hora, precio_sabado, activo, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    ");

    $proceso->execute([
        $nombre,
        $telefono,
        $tipo,
        $precioDia,
        $precioHora,
        $precioSabado,
        $usuario_id
    ]);

    echo json_encode([
        'ok' => true,
        'id' => $conexion->lastInsertId()
    ]);
    break;

    /* =======================
       PUT → EDITAR
    ======================= */
    case 'PUT':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
            exit;
        }

        $datos = json_decode(file_get_contents('php://input'), true);

        if (
            empty($datos['nombre']) ||
            empty($datos['tipo']) ||
            !isset($datos['precio_hora']) ||
            !isset($datos['precio_sabado'])
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
            exit;
        }

        $proceso = $conexion->prepare("
            UPDATE trabajadores SET
                nombre = ?,
                telefono = ?,
                tipo = ?,
                precio_dia = ?,
                precio_hora = ?,
                precio_sabado = ?
            WHERE id = ? AND usuario_id = ?
        ");

        // Normalizar decimales para precio_dia (igual que en POST)
        $precioDia = isset($datos['precio_dia']) && $datos['precio_dia'] !== ''
            ? (float)str_replace(',', '.', $datos['precio_dia'])
            : null;

        $proceso->execute([
            $datos['nombre'],
            $datos['telefono'] ?? '',
            strtolower($datos['tipo']),
            $precioDia,
            (float)str_replace(',', '.', $datos['precio_hora']),
            (float)str_replace(',', '.', $datos['precio_sabado']),
            $_GET['id'],
            $usuario_id
        ]);

        echo json_encode(['ok' => true]);
        break;

    /* =======================
       DELETE → BAJA LÓGICA
    ======================= */
    case 'DELETE':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID requerido']);
            exit;
        }

        $proceso = $conexion->prepare(
            "UPDATE trabajadores SET activo = 0 WHERE id = ? AND usuario_id = ?"
        );
        $proceso->execute([$_GET['id'], $usuario_id]);

        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}
