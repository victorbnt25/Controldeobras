<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    require_once __DIR__ . '/../config/cors.php';
    require_once __DIR__ . '/../config/auth.php';
    require_once __DIR__ . '/../config/database.php';
    $conexion = obtenerConexionBD();
    requerirRol('usuario');
    $usuario_id = $_SESSION['usuario_id'];
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error crítico: ' . $e->getMessage()]);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    try {
        // Recibir filtros
        $tipo = $_GET['type'] ?? 'month'; // 'month' | 'year'
        $año = intval($_GET['year'] ?? date('Y'));
        $mes = intval($_GET['month'] ?? date('n'));

        // Construir condiciones SQL según el filtro
        if ($tipo === 'month') {
            $sqlFacturas = "WHERE usuario_id = $usuario_id AND estado = 'pagada' AND MONTH(fecha_factura) = $mes AND YEAR(fecha_factura) = $año";
            $sqlGastos = "WHERE usuario_id = $usuario_id AND MONTH(fecha) = $mes AND YEAR(fecha) = $año";
            $sqlJornadas = "JOIN obras o ON oj.obra_id = o.id WHERE o.usuario_id = $usuario_id AND MONTH(oj.fecha) = $mes AND YEAR(oj.fecha) = $año";
        } else {
            $sqlFacturas = "WHERE usuario_id = $usuario_id AND estado = 'pagada' AND YEAR(fecha_factura) = $año";
            $sqlGastos = "WHERE usuario_id = $usuario_id AND YEAR(fecha) = $año";
            $sqlJornadas = "JOIN obras o ON oj.obra_id = o.id WHERE o.usuario_id = $usuario_id AND YEAR(oj.fecha) = $año";
        }

        // 1. KPIs (Ingresos, Gastos, Beneficio del periodo)
        $consultaIngresos = $conexion->query("
            SELECT COALESCE(SUM(total_factura), 0) 
            FROM facturas 
            $sqlFacturas
        ");
        $ingresosMes = $consultaIngresos->fetchColumn();

        $consultaGastos = $conexion->query("
            SELECT 
                (SELECT COALESCE(SUM(importe), 0) FROM gastos $sqlGastos) +
                (SELECT COALESCE(SUM(total), 0) FROM obra_jornadas oj $sqlJornadas)
        ");
        $gastosMes = $consultaGastos->fetchColumn();

        // Total Histórico
        $consultaHistorico = $conexion->query("
            SELECT 
                (SELECT COALESCE(SUM(total_factura), 0) FROM facturas WHERE usuario_id = $usuario_id AND estado = 'pagada') - 
                (
                    (SELECT COALESCE(SUM(importe), 0) FROM gastos WHERE usuario_id = $usuario_id) + 
                    (SELECT COALESCE(SUM(total), 0) FROM obra_jornadas oj JOIN obras o ON oj.obra_id = o.id WHERE o.usuario_id = $usuario_id)
                )
        ");
        $totalHistorico = $consultaHistorico->fetchColumn();

        // 2. GRÁFICO PRINCIPAL (Evolución)
        $datosGrafico = [];
        
        if ($tipo === 'month') {
            // Modo MES: Mostrar días (1 al 31)
            $diasEnMes = date('t', mktime(0, 0, 0, $mes, 1, $año));
            for ($d = 1; $d <= $diasEnMes; $d++) {
                $cadenaFecha = sprintf("%04d-%02d-%02d", $año, $mes, $d);
                
                // Ingresos día
                $consultaI = $conexion->query("SELECT COALESCE(SUM(total_factura), 0) FROM facturas WHERE usuario_id = $usuario_id AND estado = 'pagada' AND fecha_factura = '$cadenaFecha'");
                $ing = $consultaI->fetchColumn();

                // Gastos día
                $consultaG = $conexion->query("
                    SELECT 
                        (SELECT COALESCE(SUM(importe), 0) FROM gastos WHERE usuario_id = $usuario_id AND fecha = '$cadenaFecha') +
                        (SELECT COALESCE(SUM(total), 0) FROM obra_jornadas oj JOIN obras o ON oj.obra_id = o.id WHERE o.usuario_id = $usuario_id AND oj.fecha = '$cadenaFecha')
                ");
                $gas = $consultaG->fetchColumn();

                $datosGrafico[] = ['label' => $d, 'ingresos' => (float)$ing, 'gastos' => (float)$gas];
            }
        } else {
            // Modo AÑO: Mostrar meses (Ene a Dic)
            $nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            for ($m = 1; $m <= 12; $m++) {
                $patronFecha = sprintf("%04d-%02d", $año, $m);
                
                // Ingresos mes
                $consultaI = $conexion->query("SELECT COALESCE(SUM(total_factura), 0) FROM facturas WHERE usuario_id = $usuario_id AND estado = 'pagada' AND DATE_FORMAT(fecha_factura, '%Y-%m') = '$patronFecha'");
                $ing = $consultaI->fetchColumn();

                // Gastos mes
                $consultaG = $conexion->query("
                    SELECT 
                        (SELECT COALESCE(SUM(importe), 0) FROM gastos WHERE usuario_id = $usuario_id AND DATE_FORMAT(fecha, '%Y-%m') = '$patronFecha') +
                        (SELECT COALESCE(SUM(total), 0) FROM obra_jornadas oj JOIN obras o ON oj.obra_id = o.id WHERE o.usuario_id = $usuario_id AND DATE_FORMAT(oj.fecha, '%Y-%m') = '$patronFecha')
                ");
                $gas = $consultaG->fetchColumn();

                $datosGrafico[] = ['label' => $nombresMeses[$m-1], 'ingresos' => (float)$ing, 'gastos' => (float)$gas];
            }
        }

        // 3. DISTRIBUCIÓN DE GASTOS
        $distribucion = [];
        
        // Gastos generales agrupados
        $consultaDist = $conexion->query("SELECT tipo, SUM(importe) as total FROM gastos $sqlGastos GROUP BY tipo");
        while ($fila = $consultaDist->fetch(PDO::FETCH_ASSOC)) {
            $distribucion[] = ['name' => ucfirst($fila['tipo']), 'value' => (float)$fila['total']];
        }

        // Mano de obra (Jornadas)
        $consultaMO = $conexion->query("SELECT SUM(total) FROM obra_jornadas oj $sqlJornadas");
        $mo = $consultaMO->fetchColumn();
        if ($mo > 0) {
            $distribucion[] = ['name' => 'Mano de Obra', 'value' => (float)$mo];
        }

        if (empty($distribucion)) {
            $distribucion[] = ['name' => 'Sin datos', 'value' => 1];
        }

        // 4. OBRAS ACTIVAS
        $consultaObras = $conexion->query("SELECT COUNT(*) FROM obras WHERE usuario_id = $usuario_id AND estado = 'en_curso'");
        $obrasActivas = $consultaObras->fetchColumn();

        echo json_encode([
            'ingresos_mes' => (float)$ingresosMes,
            'gastos_mes' => (float)$gastosMes,
            'total_historico' => (float)$totalHistorico,
            'obras_activas' => (int)$obrasActivas,
            'grafico_meses' => $datosGrafico,
            'grafico_distribucion' => $distribucion
        ]);

    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?>
