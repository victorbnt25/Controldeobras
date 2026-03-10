<?php
// backend/config/database.php

// Config de errores para producción
ini_set('display_errors', 0);
ini_set('log_errors', 1);
$_logDir = __DIR__ . '/../logs';
if (!is_dir($_logDir)) { @mkdir($_logDir, 0755, true); }
ini_set('error_log', $_logDir . '/php_error.log');
error_reporting(E_ALL);

$_dbProdConfig = __DIR__ . '/db.production.php';
if (file_exists($_dbProdConfig)) { // Cargar configuración de producción
    require_once $_dbProdConfig;
} else { // Valores locales (Docker)
    define('DB_HOST', getenv('DB_HOST') ?: 'mysql');
    define('DB_NAME', getenv('DB_NAME') ?: 'reformas_db');
    define('DB_USER', getenv('DB_USER') ?: 'root');
    define('DB_PASS', getenv('DB_PASS') ?: 'root');
}

function obtenerConexionBD() {
    try {
        $opciones = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false, // Usar prepared statements nativos
            PDO::MYSQL_ATTR_FOUND_ROWS => true
        ];

        return new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            $opciones
        );
    } catch (PDOException $e) {
        error_log('Error BD: ' . $e->getMessage()); // Log interno del fallo
        http_response_code(500);
        echo json_encode(['error' => 'Error de conexión a la base de datos.']);
        exit;
    }
}

function enviarRespuesta($datos, $estado = 200) {
    http_response_code($estado);
    echo json_encode($datos);
    exit;
}

function manejarError($mensaje, $estado = 400) {
    enviarRespuesta(['error' => $mensaje], $estado);
}
