<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);
// Aumentar límites para imágenes en Base64
ini_set('post_max_size', '20M');
ini_set('memory_limit', '256M');
ini_set('upload_max_filesize', '20M');

// Manejo de preflight CORS (importante para evitar errores en algunos navegadores)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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

$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        case 'GET':
            // Obtener la configuración específica del usuario
            $consulta = $conexion->prepare("SELECT * FROM configuracion WHERE usuario_id = ? LIMIT 1");
            $consulta->execute([$usuario_id]);
            $configuracion = $consulta->fetch(PDO::FETCH_ASSOC);
            
            if (!$configuracion) {
                // Si no existe, creamos una por defecto para este usuario para evitar errores
                $consultaIns = $conexion->prepare("INSERT INTO configuracion (nombre_empresa, usuario_id) VALUES ('Mi Empresa', ?)");
                $consultaIns->execute([$usuario_id]);
                $id = $conexion->lastInsertId();
                $configuracion = [
                    'id' => $id,
                    'nombre_empresa' => 'Mi Empresa',
                    'nombre_ceo' => '',
                    'cif_dni' => '',
                    'direccion' => '',
                    'poblacion' => '',
                    'telefono' => '',
                    'cuenta_bancaria' => '',
                    'email_empresa' => '',
                    'usuario_id' => $usuario_id
                ];
            }
            
            echo json_encode($configuracion);
            break;

        case 'POST':
        case 'PUT':
            // Actualizar configuración del usuario
            $datos = json_decode(file_get_contents("php://input"), true);
            
            if (!$datos) {
                $datos = [];
            }
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("JSON inválido recibido");
            }
            
            // Buscamos si ya tiene fila activa
            $consultaCheck = $conexion->prepare("SELECT id FROM configuracion WHERE usuario_id = ?");
            $consultaCheck->execute([$usuario_id]);
            $fila = $consultaCheck->fetch(PDO::FETCH_ASSOC);

            if ($fila) {
                $consultaAct = $conexion->prepare("
                    UPDATE configuracion 
                    SET nombre_empresa = ?, nombre_ceo = ?, cif_dni = ?, direccion = ?, poblacion = ?, telefono = ?, cuenta_bancaria = ?, email_empresa = ?, logo_url = ?
                    WHERE usuario_id = ?
                ");
                
                $consultaAct->execute([
                    $datos['nombre_empresa'] ?? '',
                    $datos['nombre_ceo'] ?? '',
                    $datos['cif_dni'] ?? '',
                    $datos['direccion'] ?? '',
                    $datos['poblacion'] ?? '',
                    $datos['telefono'] ?? '',
                    $datos['cuenta_bancaria'] ?? '',
                    $datos['email_empresa'] ?? '',
                    $datos['logo_url'] ?? null,
                    $usuario_id
                ]);
            } else {
                // Si por alguna razón no había fila, insertamos una nueva
                $consultaIns = $conexion->prepare("
                    INSERT INTO configuracion (nombre_empresa, nombre_ceo, cif_dni, direccion, poblacion, telefono, cuenta_bancaria, email_empresa, logo_url, usuario_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $consultaIns->execute([
                    $datos['nombre_empresa'] ?? '',
                    $datos['nombre_ceo'] ?? '',
                    $datos['cif_dni'] ?? '',
                    $datos['direccion'] ?? '',
                    $datos['poblacion'] ?? '',
                    $datos['telefono'] ?? '',
                    $datos['cuenta_bancaria'] ?? '',
                    $datos['email_empresa'] ?? '',
                    $datos['logo_url'] ?? null,
                    $usuario_id
                ]);
            }
            
            echo json_encode(['mensaje' => 'Configuración guardada correctamente']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>