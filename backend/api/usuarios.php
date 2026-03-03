<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php'; // Required for auth check
require_once __DIR__ . '/../config/database.php';

// Solo el superusuario puede acceder a este panel
requerirRol('superusuario');

$conexion = obtenerConexionBD();
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    if ($metodo === 'GET') {
        $consulta = $conexion->query("SELECT id, username, rol, activo, created_at FROM usuarios ORDER BY id DESC");
        echo json_encode($consulta->fetchAll(PDO::FETCH_ASSOC));
    } 
    elseif ($metodo === 'POST') {
        $datos = json_decode(file_get_contents('php://input'), true);
        
        $nombreUsuario = $datos['username'] ?? '';
        $password = $datos['password'] ?? '';
        $rol = $datos['rol'] ?? 'usuario';
        $activo = isset($datos['activo']) ? (int)$datos['activo'] : 1;

        if (empty($nombreUsuario) || empty($password)) {
            http_response_code(400);
            echo json_encode(['error' => 'Usuario y contraseña son obligatorios']);
            exit;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $consulta = $conexion->prepare("INSERT INTO usuarios (username, password, rol, activo) VALUES (?, ?, ?, ?)");
        $consulta->execute([$nombreUsuario, $hash, $rol, $activo]);
        
        echo json_encode(['mensaje' => 'Usuario creado exitosamente', 'id' => $conexion->lastInsertId()]);
    } 
    elseif ($metodo === 'PUT') {
        $datos = json_decode(file_get_contents('php://input'), true);
        $id = $datos['id'] ?? 0;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de usuario no proporcionado']);
            exit;
        }

        // Se pueden actualizar el password, rol y activo
        $actualizaciones = [];
        $parametros = [];

        if (isset($datos['password']) && !empty($datos['password'])) {
            $actualizaciones[] = "password = ?";
            $parametros[] = password_hash($datos['password'], PASSWORD_DEFAULT);
        }
        if (isset($datos['username']) && !empty($datos['username'])) {
            $actualizaciones[] = "username = ?";
            $parametros[] = $datos['username'];
        }
        if (isset($datos['rol'])) {
            // No permitir que un usuario se cambie su propio rol (para no quitarse el superusuario)
            if ($id != $_SESSION['usuario_id']) {
                $actualizaciones[] = "rol = ?";
                $parametros[] = $datos['rol'];
            }
        }
        if (isset($datos['activo'])) {
            // No permitir que un usuario se desactive a sí mismo
            if ($id != $_SESSION['usuario_id']) {
                $actualizaciones[] = "activo = ?";
                $parametros[] = (int)$datos['activo'];
            }
        }

        if (empty($actualizaciones)) {
            http_response_code(400);
            echo json_encode(['error' => 'No hay datos para actualizar']);
            exit;
        }

        $sql = "UPDATE usuarios SET " . implode(", ", $actualizaciones) . " WHERE id = ?";
        $parametros[] = $id;

        $consulta = $conexion->prepare($sql);
        $consulta->execute($parametros);

        echo json_encode(['mensaje' => 'Usuario actualizado exitosamente']);
    } 
    else {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
    }
} catch (PDOException $e) {
    // Manejo de error de entrada duplicada (1062) para nombre de usuario único
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'El nombre de usuario ya existe']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error de base de datos']);
    }
}
