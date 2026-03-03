<?php
require_once __DIR__ . '/../config/cors.php';
session_start();

$_SESSION = array();
if (ini_get("session.use_cookies")) {
    $parametros = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $parametros["path"], $parametros["domain"],
        $parametros["secure"], $parametros["httponly"]
    );
}

session_destroy();
echo json_encode(['mensaje' => 'Sesión cerrada exitosamente']);
