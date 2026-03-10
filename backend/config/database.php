<?php
// backend/config/database.php

// 0. SEGURIDAD EN PRODUCCIÓN: Nunca mostrar errores en pantalla, todo al log
ini_set('display_errors', 0);
ini_set('log_errors', 1);
$_logDir = __DIR__ . '/../logs';
if (!is_dir($_logDir)) { @mkdir($_logDir, 0755, true); }
ini_set('error_log', $_logDir . '/php_error.log');
error_reporting(E_ALL);

// Carga credenciales según entorno:
// - Producción: backend/config/db.production.php (NO está en el repo, créalo en el servidor)
// - Local/Docker: variables de entorno del docker-compose o valores por defecto
$_dbProdConfig = __DIR__ . '/db.production.php';
if (file_exists($_dbProdConfig)) {
    require_once $_dbProdConfig;
} else {
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
            // Desactiva la emulación de prepared statements. Fuerza statements nativos de MySQL para prevenir inyecciones SQL.
            PDO::ATTR_EMULATE_PREPARES => false,
            // Prevenir carga estática en ciertos contextos
            PDO::MYSQL_ATTR_FOUND_ROWS => true
        ];

        return new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            $opciones
        );
    } catch (PDOException $e) {
        // ERROR GENÉRICO EN PRODUCCIÓN: NUNCA MOSTRAR $e->getMessage() con credenciales
        error_log('Error de conexión a la BD: ' . $e->getMessage()); // Registro seguro interno en logs
        http_response_code(500);
        echo json_encode([
            'error' => 'Error interno del servidor. No se pudo conectar a la base de datos.'
        ]);
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
