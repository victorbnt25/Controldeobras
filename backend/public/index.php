<?php
// index.php - Sistema de Facturación para Reformas
session_start();

// Configuración de base de datos
define('DB_HOST', 'mysql');
define('DB_NAME', 'reformas_db');
define('DB_USER', 'root');
define('DB_PASS', 'root');

// Verificar conexión a la base de datos
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", 
                   DB_USER, 
                   DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Error de conexión a la base de datos: " . $e->getMessage());
}

// Funciones auxiliares
function getEstadisticas($pdo) {
    $estadisticas = [
        'total_clientes' => 0,
        'facturas_mes' => 0,
        'facturas_pendientes' => 0,
        'total_facturado_mes' => 0,
        'facturas_totales' => 0
    ];
    
    try {
        // Total clientes activos
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM clientes WHERE activo = 1");
        $estadisticas['total_clientes'] = $stmt->fetch()['total'];
        
        // Facturas del mes actual
        $mes_actual = date('Y-m');
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as total, 
                   SUM(total_factura) as facturado 
            FROM facturas 
            WHERE DATE_FORMAT(fecha_factura, '%Y-%m') = ? 
              AND estado != 'cancelada'
        ");
        $stmt->execute([$mes_actual]);
        $result = $stmt->fetch();
        $estadisticas['facturas_mes'] = $result['total'];
        $estadisticas['total_facturado_mes'] = $result['facturado'] ?: 0;
        
        // Facturas pendientes
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM facturas WHERE estado = 'pendiente'");
        $estadisticas['facturas_pendientes'] = $stmt->fetch()['total'];
        
        // Total facturas (no canceladas)
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM facturas WHERE estado != 'cancelada'");
        $estadisticas['facturas_totales'] = $stmt->fetch()['total'];
        
    } catch(PDOException $e) {
        error_log("Error en estadísticas: " . $e->getMessage());
    }
    
    return $estadisticas;
}

function getUltimasFacturas($pdo, $limit = 5) {
    try {
        $stmt = $pdo->prepare("
            SELECT f.*, c.nombre as cliente_nombre 
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
            WHERE f.estado != 'cancelada'
            ORDER BY f.fecha_factura DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
        return [];
    }
}

function getClientesRecientes($pdo, $limit = 5) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, nombre, tipo, created_at 
            FROM clientes 
            WHERE activo = 1
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch(PDOException $e) {
        return [];
    }
}

function getConfiguracion($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM configuracion LIMIT 1");
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: [];
    } catch(PDOException $e) {
        return [];
    }
}

// Obtener datos
$estadisticas = getEstadisticas($pdo);
$ultimasFacturas = getUltimasFacturas($pdo);
$clientesRecientes = getClientesRecientes($pdo);
$configuracion = getConfiguracion($pdo);
$nombre_empresa = !empty($configuracion['nombre_empresa']) ? $configuracion['nombre_empresa'] : 'Mi Empresa';
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo htmlspecialchars($nombre_empresa); ?></title>
</head>
<body>
    <div style="max-width: 1200px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <header style="background-color: #2c3e50; color: white; padding: 20px; border-radius: 5px; margin-bottom: 30px;">
            <h1 style="margin: 0;"><?php echo htmlspecialchars($nombre_empresa); ?></h1>
            <p style="margin: 5px 0 0 0; color: #ecf0f1;">Sistema de Gestión y Facturación</p>
        </header>

        <!-- Menú de navegación -->
        <nav style="background-color: #34495e; padding: 15px; border-radius: 5px; margin-bottom: 30px;">
            <a href="index.php" style="color: white; margin-right: 20px; text-decoration: none; font-weight: bold;">Dashboard</a>
            <a href="clientes.php" style="color: white; margin-right: 20px; text-decoration: none;">Clientes</a>
            <a href="facturas.php" style="color: white; margin-right: 20px; text-decoration: none;">Facturas</a>
            <a href="nueva_factura.php" style="color: white; margin-right: 20px; text-decoration: none;">Nueva Factura</a>
            <a href="configuracion.php" style="color: white; text-decoration: none;">Configuración</a>
        </nav>

        <!-- Estadísticas -->
        <h2>Estadísticas</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
            <div style="background-color: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Clientes</h3>
                <p style="font-size: 2em; font-weight: bold; color: #3498db; margin: 0;"><?php echo $estadisticas['total_clientes']; ?></p>
                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Total activos</p>
            </div>
            
            <div style="background-color: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Facturas del Mes</h3>
                <p style="font-size: 2em; font-weight: bold; color: #2ecc71; margin: 0;"><?php echo $estadisticas['facturas_mes']; ?></p>
                <p style="margin: 5px 0 0 0; color: #7f8c8d;"><?php echo date('F Y'); ?></p>
            </div>
            
            <div style="background-color: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Pendientes</h3>
                <p style="font-size: 2em; font-weight: bold; color: #e74c3c; margin: 0;"><?php echo $estadisticas['facturas_pendientes']; ?></p>
                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Por cobrar</p>
            </div>
            
            <div style="background-color: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #2c3e50;">Facturado Mes</h3>
                <p style="font-size: 2em; font-weight: bold; color: #9b59b6; margin: 0;"><?php echo number_format($estadisticas['total_facturado_mes'], 2, ',', '.'); ?> €</p>
                <p style="margin: 5px 0 0 0; color: #7f8c8d;">Total</p>
            </div>
        </div>

        <!-- Contenido principal -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 30px;">
            <!-- Últimas Facturas -->
            <div style="background-color: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
                <h3 style="margin: 0 0 20px 0; color: #2c3e50;">Últimas Facturas</h3>
                <?php if (!empty($ultimasFacturas)): ?>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f8f9fa;">
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Nº Factura</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Cliente</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Fecha</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Total</th>
                                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($ultimasFacturas as $factura): ?>
                                <tr style="border-bottom: 1px solid #eee;">
                                    <td style="padding: 10px;">
                                        <a href="ver_factura.php?id=<?php echo $factura['id']; ?>" style="color: #3498db; text-decoration: none;">
                                            <?php echo htmlspecialchars($factura['numero_factura']); ?>
                                        </a>
                                    </td>
                                    <td style="padding: 10px;"><?php echo htmlspecialchars($factura['cliente_nombre']); ?></td>
                                    <td style="padding: 10px;"><?php echo date('d/m/Y', strtotime($factura['fecha_factura'])); ?></td>
                                    <td style="padding: 10px;"><?php echo number_format($factura['total_factura'], 2, ',', '.'); ?> €</td>
                                    <td style="padding: 10px;">
                                        <?php 
                                        $estado_colores = [
                                            'borrador' => '#f39c12',
                                            'pendiente' => '#e74c3c',
                                            'pagada' => '#2ecc71',
                                            'cancelada' => '#95a5a6'
                                        ];
                                        $color = $estado_colores[$factura['estado']] ?? '#95a5a6';
                                        ?>
                                        <span style="background-color: <?php echo $color; ?>; color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.9em;">
                                            <?php echo ucfirst($factura['estado']); ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <p style="text-align: right; margin-top: 15px;">
                        <a href="facturas.php" style="color: #3498db; text-decoration: none;">Ver todas las facturas →</a>
                    </p>
                <?php else: ?>
                    <p>No hay facturas registradas.</p>
                <?php endif; ?>
            </div>

            <!-- Clientes Recientes y Acciones -->
            <div>
                <!-- Clientes Recientes -->
                <div style="background-color: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 20px 0; color: #2c3e50;">Clientes Recientes</h3>
                    <?php if (!empty($clientesRecientes)): ?>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                            <?php foreach ($clientesRecientes as $cliente): ?>
                                <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                                    <strong><?php echo htmlspecialchars($cliente['nombre']); ?></strong><br>
                                    <small style="color: #7f8c8d;">
                                        <?php echo ucfirst($cliente['tipo']); ?> • 
                                        <?php echo date('d/m/Y', strtotime($cliente['created_at'])); ?>
                                    </small>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                        <p style="text-align: right; margin-top: 15px;">
                            <a href="clientes.php" style="color: #3498db; text-decoration: none;">Ver todos →</a>
                        </p>
                    <?php else: ?>
                        <p>No hay clientes registrados.</p>
                    <?php endif; ?>
                </div>

                <!-- Acciones Rápidas -->
                <div style="background-color: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px;">
                    <h3 style="margin: 0 0 20px 0; color: #2c3e50;">Acciones Rápidas</h3>
                    <div style="display: grid; gap: 10px;">
                        <a href="nueva_factura.php" style="background-color: #3498db; color: white; padding: 12px; text-align: center; text-decoration: none; border-radius: 5px; display: block;">
                            Nueva Factura
                        </a>
                        <a href="nuevo_cliente.php" style="background-color: #2ecc71; color: white; padding: 12px; text-align: center; text-decoration: none; border-radius: 5px; display: block;">
                            Nuevo Cliente
                        </a>
                        <a href="informes.php" style="background-color: #9b59b6; color: white; padding: 12px; text-align: center; text-decoration: none; border-radius: 5px; display: block;">
                            Informes
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer style="margin-top: 40px; padding: 20px 0; text-align: center; color: #7f8c8d; border-top: 1px solid #ddd;">
            <p>Sistema de Facturación v1.0 &copy; <?php echo date('Y'); ?> <?php echo htmlspecialchars($nombre_empresa); ?></p>
            <p>Total facturas en sistema: <?php echo $estadisticas['facturas_totales']; ?></p>
        </footer>
    </div>
</body>
</html>