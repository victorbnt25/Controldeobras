<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

// Configuración de cookies segura
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

if (isset($_SESSION['login_intentos']) && $_SESSION['login_intentos'] >= $max_intentos) { // Rate limit 5 intentos
    if (time() - $_SESSION['ultimo_intento_fallido'] < $tiempo_bloqueo) {
        http_response_code(429);
        echo json_encode(['error' => 'Demasiados intentos. Inténtalo de nuevo más tarde.']);
        exit;
    } else {
        $_SESSION['login_intentos'] = 0; // Reset por tiempo
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
$consulta = $conexion->prepare("SELECT id, username, password, rol, activo FROM usuarios WHERE username = ? LIMIT 1"); // Usar prepared statements
$consulta->execute([$nombreUsuario]);
$usuario = $consulta->fetch(PDO::FETCH_ASSOC);

if ($usuario && $usuario['activo'] == 1 && password_verify($password, $usuario['password'])) {
    $_SESSION['login_intentos'] = 0; // Login OK
    session_regenerate_id(true); // Evitar fijación de sesión
    
    $_SESSION['usuario_id'] = $usuario['id'];
    $_SESSION['username'] = $usuario['username'];
    $_SESSION['rol'] = $usuario['rol'];
    $_SESSION['ultimo_acceso'] = time();
    
    echo json_encode([
        'mensaje' => 'Inicio de sesión exitoso',
        'usuario' => [
            'id' => $usuario['id'],
            'username' => $usuario['username'],
            'rol' => $usuario['rol']
        ]
    ]);
} else { // Fallo en el login
    $_SESSION['login_intentos'] = ($_SESSION['login_intentos'] ?? 0) + 1;
    $_SESSION['ultimo_intento_fallido'] = time();
    http_response_code(401);
    echo json_encode(['error' => 'Usuario o contraseña incorrectos.']);
}
