<?php

// Configuración de cookies segura
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.use_strict_mode', 1);

if (PHP_VERSION_ID >= 70300) { // SameSite para PHP 7.3+
    session_set_cookie_params(['samesite' => 'Strict', 'secure' => true, 'httponly' => true]);
} else {
    session_set_cookie_params(0, '/; SameSite=Strict', '', true, true);
}

session_start();

$tiempoInactividad = 1800; // 30 min de timeout
if (isset($_SESSION['ultimo_acceso']) && (time() - $_SESSION['ultimo_acceso'] > $tiempoInactividad)) {
    session_unset();
    session_destroy();
    http_response_code(401);
    echo json_encode(['error' => 'Sesión expirada por inactividad.']);
    exit;
}
$_SESSION['ultimo_acceso'] = time(); // Refrescar acceso

if (!isset($_SESSION['usuario_id'])) { // Validar sesión activa
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado. Se requiere iniciar sesión.']);
    exit;
}

function requerirRol($rol) { // Validar permisos de rol
    if (!isset($_SESSION['rol'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Acceso denegado. Permisos insuficientes para esta acción.']);
        exit;
    }

    if ($_SESSION['rol'] === 'superusuario') return; // Acceso total para superusuario

    if ($_SESSION['rol'] !== $rol) { // Verificar rol específico
        http_response_code(403);
        echo json_encode(['error' => 'Acceso denegado. Permisos insuficientes para esta acción.']);
        exit;
    }
}
