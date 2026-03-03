<?php

// 1. Configuración Segura de Cookies de Sesión (ANTES de session_start)
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.use_strict_mode', 1);
// SameSite compatible con PHP 7.0+ (ini_set de samesite solo funciona en PHP 7.3+)
if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params(['samesite' => 'Strict', 'secure' => true, 'httponly' => true]);
} else {
    session_set_cookie_params(0, '/; SameSite=Strict', '', true, true);
}

session_start();

// 2. Timeout automático por inactividad (30 minutos)
$tiempoInactividad = 1800; // 30 min en segundos
if (isset($_SESSION['ultimo_acceso']) && (time() - $_SESSION['ultimo_acceso'] > $tiempoInactividad)) {
    session_unset();
    session_destroy();
    http_response_code(401);
    echo json_encode(['error' => 'Sesión expirada por inactividad.']);
    exit;
}
$_SESSION['ultimo_acceso'] = time(); // Actualizar último acceso

// 3. Bloquear si no hay sesión ('usuario_id' no está establecido)
if (!isset($_SESSION['usuario_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado. Se requiere iniciar sesión.']);
    exit;
}

/**
 * Función para obligar un rol específico y asegurar que no hay suplantación (Control de Autorización)
 */
function requerirRol($rol) {
    if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== $rol) {
        http_response_code(403);
        echo json_encode(['error' => 'Acceso denegado. Permisos insuficientes para esta acción.']);
        exit;
    }
}
