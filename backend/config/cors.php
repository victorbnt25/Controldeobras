<?php
// backend/config/cors.php
// DEBUG: die("CORS_LOADED");

$allowed_origins = [ // Dominios permitidos
    'http://localhost:3003', 
    'http://localhost:3004', 
    'http://localhost:3002',
    'https://decoreformab.totalh.com',
    'https://controldeobras.es'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Validar dominio (local o producción)
if (in_array($origin, $allowed_origins) || preg_match('/^https?:\/\/(localhost|.*\.totalh\.com|.*\.controldeobras\.es|controldeobras\.es)(:[0-9]+)?$/', $origin)) {    
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3003"); // Fallback
}


header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Auth-Token");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { // Manejo de preflight
    http_response_code(204);
    exit();
}

header("Content-Type: application/json; charset=UTF-8"); // Salida en JSON

