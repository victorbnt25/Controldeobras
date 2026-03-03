<?php

// api/correlativos.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/database.php';

$conexion = obtenerConexionBD();
requerirRol('usuario');
$usuario_id = $_SESSION['usuario_id'];

$tipo = $_GET['tipo'] ?? 'presupuesto'; 
$añoLargo = date('Y');
$añoCorto = date('y'); 

if ($tipo === 'factura') {
    $tabla = 'facturas';
    $columna = 'numero_factura';
} else {
    $tabla = 'presupuestos';
    $columna = 'numero_presupuesto';
}

// Buscamos el último registro que siga el formato xxx/yy para este año
$consulta = $conexion->prepare("SELECT $columna FROM $tabla WHERE usuario_id = ? AND $columna LIKE ? ORDER BY id DESC LIMIT 1");
$consulta->execute([$usuario_id, "%/$añoCorto"]);
$ultimo = $consulta->fetchColumn();

$proximoNum = 1;
if ($ultimo) {
    // Intentamos extraer la parte numérica
    $partes = explode('/', $ultimo);
    if (count($partes) >= 1) {
        $ultimoNum = (int)$partes[0];
        $proximoNum = $ultimoNum + 1;
    }
}

// Formatear a 001/26
$formateado = str_pad($proximoNum, 3, '0', STR_PAD_LEFT) . '/' . $añoCorto;

echo json_encode(['next' => $formateado, 'year' => $añoLargo]);
?>
