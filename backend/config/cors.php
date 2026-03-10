<?php
// backend/config/cors.php
// DEBUG: die("CORS_LOADED");

// 1. Determinar el origen permitido
$allowed_origins = [
    'http://localhost:3003', 
    'http://localhost:3004', 
    'http://localhost:3002',
    'https://decoreformab.totalh.com',
    'https://controldeobras.es'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Permitir cualquier origen que termine en .totalh.com, .controldeobras.es o localhost
if (in_array($origin, $allowed_origins) || preg_match('/^https?:\/\/(localhost|.*\.totalh\.com|.*\.controldeobras\.es|controldeobras\.es)(:[0-9]+)?$/', $origin)) {    
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Fallback seguro
    header("Access-Control-Allow-Origin: http://localhost:3003");
}


// 2. Cabeceras comunes para CORS
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");

// 3. Manejo explícito de Preflight (OPTIONS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); // No Content es estándar para OPTIONS
    exit();
}

// 4. Content-Type por defecto para el resto de la API
header("Content-Type: application/json; charset=UTF-8");

