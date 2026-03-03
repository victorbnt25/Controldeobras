<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/database.php';

$conexion = obtenerConexionBD();
requerirRol('usuario');
$usuario_id = $_SESSION['usuario_id'];

try {
    switch ($_SERVER['REQUEST_METHOD']) {

        case 'GET':
            if (!isset($_GET['id'])) {
                $consulta = $conexion->prepare(
                    "SELECT * FROM plantillas WHERE usuario_id = ? AND activo = 1 ORDER BY descripcion ASC"
                );
                $consulta->execute([$usuario_id]);
                echo json_encode($consulta->fetchAll());
            } else {
                $consulta = $conexion->prepare(
                    "SELECT * FROM plantillas WHERE id = ? AND usuario_id = ?"
                );
                $consulta->execute([$_GET['id'], $usuario_id]);
                $plantilla = $consulta->fetch();

                if (!$plantilla) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Plantilla no encontrada']);
                    exit;
                }

                echo json_encode($plantilla);
            }
            break;

        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);

            if (!$datos || empty(trim($datos['descripcion']))) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos inválidos']);
                exit;
            }

            $consulta = $conexion->prepare("
                INSERT INTO plantillas
                (descripcion, cantidad, precio, activo, usuario_id)
                VALUES (?, ?, ?, ?, ?)
            ");

            $consulta->execute([
                $datos['descripcion'],
                $datos['cantidad'] ?? 1.00,
                $datos['precio'] ?? 0.00,
                1,
                $usuario_id
            ]);

            echo json_encode(['id' => $conexion->lastInsertId()]);
            break;

        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requerido']);
                exit;
            }

            $datos = json_decode(file_get_contents('php://input'), true);

            $consulta = $conexion->prepare("
                UPDATE plantillas SET
                    descripcion=?, cantidad=?, precio=?
                WHERE id=? AND usuario_id=?
            ");

            $consulta->execute([
                $datos['descripcion'],
                $datos['cantidad'] ?? 1.00,
                $datos['precio'] ?? 0.00,
                $_GET['id'],
                $usuario_id
            ]);

            echo json_encode(['ok' => true]);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requerido']);
                exit;
            }

            $consulta = $conexion->prepare(
                "UPDATE plantillas SET activo = 0 WHERE id = ? AND usuario_id = ?"
            );
            $consulta->execute([$_GET['id'], $usuario_id]);

            echo json_encode([
                'ok' => true,
                'mensaje' => 'Plantilla borrada'
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en el servidor: ' . $e->getMessage()]);
}
