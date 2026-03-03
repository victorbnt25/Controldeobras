<?php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/database.php';

$conexion = obtenerConexionBD();
requerirRol('usuario');
$usuario_id = $_SESSION['usuario_id'];

switch ($_SERVER['REQUEST_METHOD']) {

    case 'GET':
        if (!isset($_GET['id'])) {
            // SOLO clientes del usuario y activos
            $consulta = $conexion->prepare(
                "SELECT * FROM clientes WHERE usuario_id = ? AND activo = 1 ORDER BY nombre ASC"
            );
            $consulta->execute([$usuario_id]);
            echo json_encode($consulta->fetchAll());
        } else {
            $consulta = $conexion->prepare(
                "SELECT * FROM clientes WHERE id = ? AND usuario_id = ?"
            );
            $consulta->execute([$_GET['id'], $usuario_id]);
            $cliente = $consulta->fetch();

            if (!$cliente) {
                http_response_code(404);
                echo json_encode(['error' => 'Cliente no encontrado']);
                exit;
            }

            echo json_encode($cliente);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents('php://input'), true);

        if (!$datos) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos inválidos']);
            exit;
        }

        $consulta = $conexion->prepare("
            INSERT INTO clientes
            (nombre, tipo, cif_dni, direccion, poblacion, ciudad, codigo_postal, telefono, email, notas, activo, usuario_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $consulta->execute([
            $datos['nombre'],
            $datos['tipo'] ?? 'empresa',
            $datos['cif_dni'] ?? '',
            $datos['direccion'],
            $datos['poblacion'],
            $datos['ciudad'] ?? '',
            $datos['codigo_postal'] ?? '',
            $datos['telefono'],
            $datos['email'] ?? '',
            $datos['notas'] ?? '',
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
            UPDATE clientes SET
                nombre=?, tipo=?, cif_dni=?, direccion=?, poblacion=?, ciudad=?,
                codigo_postal=?, telefono=?, email=?, notas=?, activo=?
            WHERE id=? AND usuario_id=?
        ");

        $consulta->execute([
            $datos['nombre'],
            $datos['tipo'],
            $datos['cif_dni'],
            $datos['direccion'],
            $datos['poblacion'],
            $datos['ciudad'] ?? '',
            $datos['codigo_postal'] ?? '',
            $datos['telefono'],
            $datos['email'] ?? '',
            $datos['notas'] ?? '',
            !empty($datos['activo']) ? 1 : 0,
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
            "UPDATE clientes SET activo = 0 WHERE id = ? AND usuario_id = ?"
        );
        $consulta->execute([$_GET['id'], $usuario_id]);

        echo json_encode([
            'ok' => true,
            'mensaje' => 'Cliente desactivado'
        ]);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}
