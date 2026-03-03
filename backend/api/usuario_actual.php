<?php
require_once __DIR__ . '/../config/cors.php';

// Configuración recomendada de cookies
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(['samesite' => 'Strict', 'secure' => true, 'httponly' => true]);
} else {
    session_set_cookie_params(0, '/; SameSite=Strict', '', true, true);
}

session_start();

if (!isset($_SESSION['usuario_id'])) {
    http_response_code(200);
    echo json_encode(['usuario' => null]);
    exit;
}

echo json_encode([
    'usuario' => [
        'id' => $_SESSION['usuario_id'],
        'username' => $_SESSION['username'],
        'rol' => $_SESSION['rol']
    ]
]);
