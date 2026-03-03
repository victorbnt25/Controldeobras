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
                "SELECT * FROM proveedores WHERE id = ? AND usuario_id = ? AND activo = 1"
            );
            $proceso->execute([$_GET['id'], $usuario_id]);
            $proveedor = $proceso->fetch(PDO::FETCH_ASSOC);

            if (!$proveedor) {
                http_response_code(404);
                echo json_encode(['error' => 'Proveedor no encontrado']);
                exit;
            }

            echo json_encode($proveedor);
        } else {
            $proceso = $conexion->prepare(
                "SELECT * FROM proveedores WHERE usuario_id = ? AND activo = 1 ORDER BY nombre ASC"
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

        if (!is_array($datos) || empty($datos['nombre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos inválidos']);
            exit;
        }

        $proceso = $conexion->prepare("
            INSERT INTO proveedores
            (nombre, telefono, especialidad, cif, numero_cuenta, email, notas, activo, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        ");

        $proceso->execute([
            trim($datos['nombre']),
            $datos['telefono'] ?? '',
            $datos['especialidad'] ?? '',
            $datos['cif'] ?? '',
            $datos['numero_cuenta'] ?? '',
            $datos['email'] ?? '',
            $datos['notas'] ?? '',
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

        if (!is_array($datos) || empty($datos['nombre'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos inválidos']);
            exit;
        }

        $proceso = $conexion->prepare("
            UPDATE proveedores SET
                nombre = ?,
                telefono = ?,
                especialidad = ?,
                cif = ?,
                numero_cuenta = ?,
                email = ?,
                notas = ?,
                activo = ?
            WHERE id = ? AND usuario_id = ?
        ");

        $proceso->execute([
            trim($datos['nombre']),
            $datos['telefono'] ?? '',
            $datos['especialidad'] ?? '',
            $datos['cif'] ?? '',
            $datos['numero_cuenta'] ?? '',
            $datos['email'] ?? '',
            $datos['notas'] ?? '',
            !empty($datos['activo']) ? 1 : 0,
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
            "UPDATE proveedores SET activo = 0 WHERE id = ? AND usuario_id = ?"
        );
        $proceso->execute([$_GET['id'], $usuario_id]);

        echo json_encode(['ok' => true]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}
