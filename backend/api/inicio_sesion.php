<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

// Configuración de Cookies seguras para login
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(['samesite' => 'Strict', 'secure' => true, 'httponly' => true]);
} else {
    session_set_cookie_params(0, '/; SameSite=Strict', '', true, true);
}

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    // Generic error
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// RATE LIMITING BÁSICO (Bloqueo por IP/Sesión tras 5 intentos)
$max_intentos = 5;
$tiempo_bloqueo = 300; // 5 minutos

if (isset($_SESSION['login_intentos']) && $_SESSION['login_intentos'] >= $max_intentos) {
    if (time() - $_SESSION['ultimo_intento_fallido'] < $tiempo_bloqueo) {
        http_response_code(429); // Too Many Requests
        echo json_encode(['error' => 'Demasiados intentos. Inténtalo de nuevo más tarde.']);
        exit;
    } else {
        // Reset tras pasar el tiempo
        $_SESSION['login_intentos'] = 0;
    }
}

$datos = json_decode(file_get_contents('php://input'), true);
// Sanitización básica del input username
$nombreUsuario = trim($datos['username'] ?? '');
$password = $datos['password'] ?? '';

if (empty($nombreUsuario) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Credenciales inválidas']); // NO revelar qué faltaba
    exit;
}

$conexion = obtenerConexionBD();
// SQL INJECTION PERMITIDO PREVENIDO MEDIANTE PDO PREPARED STATEMENTS
$consulta = $conexion->prepare("SELECT id, username, password, rol, activo FROM usuarios WHERE username = ? LIMIT 1");
$consulta->execute([$nombreUsuario]);
$usuario = $consulta->fetch(PDO::FETCH_ASSOC);

// VERIFICACIÓN CON PASSWORD_VERIFY
if ($usuario && $usuario['activo'] == 1 && password_verify($password, $usuario['password'])) {
    
    // Login correcto -> Reset rate limiting
    $_SESSION['login_intentos'] = 0;

    // PREVENCIÓN DE FIJACIÓN DE SESIÓN (Regeneración FORZADA de ID)
    session_regenerate_id(true); 
    
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['username'] = $usuario['username'];
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['ultimo_acceso'] = time();
    
    // No enviar datos de la password
    echo json_encode([
        'mensaje' => 'Inicio de sesión exitoso',
        'usuario' => [
            'id' => $usuario['id'],
            'username' => $usuario['username'],
            'rol' => $usuario['rol']
        ]
    ]);
} else {
    // LOGIN FALLIDO -> Aumentar intentos
    $_SESSION['login_intentos'] = ($_SESSION['login_intentos'] ?? 0) + 1;
    $_SESSION['ultimo_intento_fallido'] = time();

    http_response_code(401);
    // DEBUG TEMPORAL - BORRAR DESPUÉS
    echo json_encode([
        'error' => 'Credenciales inválidas o acceso denegado.',
        'debug' => [
            'usuario_encontrado' => $usuario ? true : false,
            'activo' => $usuario['activo'] ?? 'N/A',
            'username_buscado' => $nombreUsuario,
            'hash_en_bd' => $usuario ? substr($usuario['password'], 0, 20) . '...' : 'N/A',
            'password_verify' => $usuario ? password_verify($password, $usuario['password']) : false
        ]
    ]);
}
