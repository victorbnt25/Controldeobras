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

try {
    switch ($metodo) {
        case 'GET':
            // Migración: añadir columnas de proveedor si no existen
            $checkCol = $conexion->prepare(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'obra_jornadas' 
                   AND COLUMN_NAME = 'proveedor_id'"
            );
            $checkCol->execute();
            if ((int)$checkCol->fetchColumn() === 0) {
                try {
                    $conexion->exec("ALTER TABLE obra_jornadas 
                        ADD COLUMN proveedor_id INT NULL,
                        ADD COLUMN importe_proveedor DECIMAL(10,2) NULL,
                        ADD COLUMN descripcion_factura TEXT NULL,
                        MODIFY COLUMN tipo ENUM('dia', 'medio', 'sabado', 'hora', 'proveedor'),
                        MODIFY COLUMN trabajador_id INT NULL");
                } catch (Exception $eAlter) { /* Ya existe, ignorar */ }
            } else {
                try {
                    $conexion->exec("ALTER TABLE obra_jornadas 
                        MODIFY COLUMN tipo ENUM('dia', 'medio', 'sabado', 'hora', 'proveedor'),
                        MODIFY COLUMN trabajador_id INT NULL");
                } catch (Exception $eAlter) { /* Ignorar si ya está */ }

                // Comprobar descripción factura por separado
                $checkDesc = $conexion->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'obra_jornadas' AND COLUMN_NAME = 'descripcion_factura'");
                $checkDesc->execute();
                if ((int)$checkDesc->fetchColumn() === 0) {
                    try { $conexion->exec("ALTER TABLE obra_jornadas ADD COLUMN descripcion_factura TEXT NULL"); } catch (Exception $e) {}
                }
            }

            // Migración: añadir es_extra en gastos_generales si no existe
            $checkEsExtra = $conexion->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gastos_generales' AND COLUMN_NAME = 'es_extra'");
            $checkEsExtra->execute();
            if ((int)$checkEsExtra->fetchColumn() === 0) {
                try { $conexion->exec("ALTER TABLE gastos_generales ADD COLUMN es_extra TINYINT(1) NOT NULL DEFAULT 0"); } catch (Exception $e) {}
            }

            // Migración: añadir proveedor_id y cliente_id en gastos_generales si no existe
            $checkProvGG = $conexion->prepare("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'gastos_generales' AND COLUMN_NAME = 'proveedor_id'");
            $checkProvGG->execute();
            if ((int)$checkProvGG->fetchColumn() === 0) {
                try { $conexion->exec("ALTER TABLE gastos_generales ADD COLUMN proveedor_id INT NULL, ADD COLUMN cliente_id INT NULL"); } catch (Exception $e) {}
            }

            if (isset($_GET['id'])) {
                // Detalle de una obra del usuario
                $consulta = $conexion->prepare("
                    SELECT 
                        o.*, 
                        c.nombre as cliente_nombre,
                        (
                            COALESCE((SELECT SUM(importe_base + (importe_base * (iva_porcentaje/100))) FROM gastos_generales WHERE obra_id = o.id AND (es_extra = 0 OR es_extra IS NULL)), 0) +
                            COALESCE((SELECT SUM(total) FROM obra_jornadas WHERE obra_id = o.id), 0)
                        ) as gastado,
                        (SELECT COUNT(*) FROM facturas WHERE presupuesto_id = o.presupuesto_id AND usuario_id = ?) as creado_factura
                    FROM obras o
                    JOIN clientes c ON o.cliente_id = c.id
                    LEFT JOIN presupuestos p ON o.presupuesto_id = p.id
                    WHERE o.id = ? AND o.usuario_id = ?
                ");
                $consulta->execute([$usuario_id, $_GET['id'], $usuario_id]);
                $obra = $consulta->fetch(PDO::FETCH_ASSOC);
                
                // Obtener gastos detallados
                if ($obra) {
                    $consultaGastos = $conexion->prepare("
                        SELECT id, concepto, importe_base as importe_base_original, iva_porcentaje, 
                               (importe_base + (importe_base * (iva_porcentaje/100))) as importe, 
                               fecha, es_extra, proveedor_id, cliente_id 
                        FROM gastos_generales 
                        WHERE obra_id = ? 
                        ORDER BY fecha DESC
                    ");
                    $consultaGastos->execute([$_GET['id']]);
                    $obra['gastos'] = $consultaGastos->fetchAll(PDO::FETCH_ASSOC);

                    // Obtener jornadas (mano de obra: trabajadores y proveedores)
                    $consultaJornadas = $conexion->prepare("
                        SELECT oj.*, 
                               t.nombre as trabajador_nombre,
                               p.nombre as proveedor_nombre
                        FROM obra_jornadas oj
                        LEFT JOIN trabajadores t ON oj.trabajador_id = t.id
                        LEFT JOIN proveedores p ON oj.proveedor_id = p.id
                        WHERE oj.obra_id = ?
                        ORDER BY oj.fecha DESC
                    ");
                    $consultaJornadas->execute([$_GET['id']]);
                    $obra['jornadas'] = $consultaJornadas->fetchAll(PDO::FETCH_ASSOC);
                }

                echo json_encode($obra ?: null);
            } else {
                // Listado de obras del usuario (solo las que tienen presupuesto aceptado)
                $sql = "
                    SELECT 
                        o.*, 
                        c.nombre as cliente_nombre,
                        (
                            COALESCE((SELECT SUM(importe_base + (importe_base * (iva_porcentaje/100))) FROM gastos_generales WHERE obra_id = o.id AND (es_extra = 0 OR es_extra IS NULL)), 0) +
                            COALESCE((SELECT SUM(total) FROM obra_jornadas WHERE obra_id = o.id), 0)
                        ) as gastado
                    FROM obras o
                    JOIN clientes c ON o.cliente_id = c.id
                    JOIN presupuestos p ON o.presupuesto_id = p.id
                    WHERE o.usuario_id = ? AND p.estado = 'aceptado'
                    ORDER BY o.created_at DESC
                ";
                $consulta = $conexion->prepare($sql);
                $consulta->execute([$usuario_id]);
                echo json_encode($consulta->fetchAll(PDO::FETCH_ASSOC));
            }
            break;

        case 'POST':
            // Migración en POST: añadir columnas de proveedor si no existen
            $checkColPost = $conexion->prepare(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                   AND TABLE_NAME = 'obra_jornadas' 
                   AND COLUMN_NAME = 'proveedor_id'"
            );
            $checkColPost->execute();
            if ((int)$checkColPost->fetchColumn() === 0) {
                try {
                    $conexion->exec("ALTER TABLE obra_jornadas 
                        ADD COLUMN proveedor_id INT NULL,
                        ADD COLUMN importe_proveedor DECIMAL(10,2) NULL,
                        MODIFY COLUMN tipo ENUM('dia', 'medio', 'sabado', 'hora', 'proveedor'),
                        MODIFY COLUMN trabajador_id INT NULL");
                } catch (Exception $e) { /* Ignorar */ }
            } else {
                try {
                    $conexion->exec("ALTER TABLE obra_jornadas 
                        MODIFY COLUMN tipo ENUM('dia', 'medio', 'sabado', 'hora', 'proveedor'),
                        MODIFY COLUMN trabajador_id INT NULL");
                } catch (Exception $e) { /* Ignorar */ }
            }

            // CREAR NUEVO GASTO O JORNADA
            $entradaBruta = file_get_contents("php://input");
            $datos = json_decode($entradaBruta, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'JSON inválido o vacío', 'raw' => $entradaBruta]);
                exit;
            }
            
            $idObra = $datos['obra_id'] ?? $datos['id_obra'] ?? $datos['obraId'] ?? null;
            
            // Verificar que la obra pertenece al usuario
            $consultaObraCheck = $conexion->prepare("SELECT id FROM obras WHERE id = ? AND usuario_id = ?");
            $consultaObraCheck->execute([$idObra, $usuario_id]);
            if (!$consultaObraCheck->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Acceso denegado a esta obra']);
                exit;
            }

            // CASO 1: IMPUTAR HORAS DE TRABAJADOR
            $idTrabajador = $datos['trabajador_id'] ?? null;
            $idProveedor  = $datos['proveedor_id']  ?? null;
            $cantidad = $datos['cantidad'] ?? $datos['horas'] ?? null;
            $cantidad = ($cantidad !== null) ? floatval($cantidad) : null;
            $tipo = $datos['tipo'] ?? 'hora'; 
            $importe = isset($datos['importe']) ? floatval($datos['importe']) : null;
            $tipoRegistro = $datos['tipo_registro'] ?? '';

            if ($idTrabajador && $cantidad !== null && $tipoRegistro === 'jornada') {
                $fecha = $datos['fecha'] ?? date('Y-m-d');
                
                // Verificar trabajador
                $consultaT = $conexion->prepare("SELECT * FROM trabajadores WHERE id = ? AND usuario_id = ?");
                $consultaT->execute([$idTrabajador, $usuario_id]);
                $trabajador = $consultaT->fetch(PDO::FETCH_ASSOC);
                
                if (!$trabajador) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Trabajador no encontrado o no pertenece al usuario']);
                    exit;
                }
                
                $precioUnitario = 0;
                $pDia = floatval($trabajador['precio_dia'] ?? 0);
                $pHora = floatval($trabajador['precio_hora'] ?? 0);
                $pSabado = floatval($trabajador['precio_sabado'] ?? 0);

                if ($tipo === 'dia') {
                    $precioUnitario = $pDia ?: ($pHora * 8);
                } elseif ($tipo === 'sabado') {
                    $precioUnitario = $pSabado ?: ($pHora * 1.5);
                } else {
                    $precioUnitario = $pHora;
                }

                $total = $cantidad * $precioUnitario;

                $consultaIns = $conexion->prepare(
                    "INSERT INTO obra_jornadas (obra_id, trabajador_id, fecha, tipo, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?, ?, ?)"
                );
                $consultaIns->execute([$idObra, $idTrabajador, $fecha, $tipo, $cantidad, $precioUnitario, $total]);
                
                echo json_encode(['mensaje' => 'Horas imputadas correctamente']);

            // CASO 2: REGISTRAR COSTE DE PROVEEDOR EN MANO DE OBRA
            } elseif ($idProveedor && isset($datos['importe']) && $tipoRegistro === 'jornada') {
                $fecha = $datos['fecha'] ?? date('Y-m-d');

                // Verificar proveedor
                $consultaP = $conexion->prepare("SELECT id FROM proveedores WHERE id = ? AND usuario_id = ?");
                $consultaP->execute([$idProveedor, $usuario_id]);
                if (!$consultaP->fetch()) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Proveedor no encontrado']);
                    exit;
                }

                $descFactura = !empty($datos['descripcion_factura']) ? $datos['descripcion_factura'] : null;

                $consultaInsP = $conexion->prepare(
                    "INSERT INTO obra_jornadas (obra_id, proveedor_id, fecha, tipo, cantidad, precio_unitario, total, importe_proveedor, descripcion_factura) 
                     VALUES (?, ?, ?, 'proveedor', 1, ?, ?, ?, ?)"
                );
                $consultaInsP->execute([$idObra, $idProveedor, $fecha, $importe, $importe, $importe, $descFactura]);

                echo json_encode(['mensaje' => 'Coste de proveedor registrado correctamente']);

            // CASO 3: CREAR GASTO GENERAL (EN GASTOS_GENERALES)
            } elseif ($importe !== null) {
                // Obtenemos el cliente_id de la obra
                $consultCli = $conexion->prepare("SELECT cliente_id FROM obras WHERE id = ?");
                $consultCli->execute([$idObra]);
                $clienteReq = $consultCli->fetchColumn() ?: null;

                $concepto = !empty($datos['concepto']) ? $datos['concepto'] : 'Gasto vario';
                $esExtra = !empty($datos['es_extra']) ? 1 : 0;
                
                $consultaInsGasto = $conexion->prepare("
                    INSERT INTO gastos_generales (usuario_id, cliente_id, obra_id, concepto, importe_base, iva_porcentaje, fecha, es_extra)
                    VALUES (?, ?, ?, ?, ?, 0, CURDATE(), ?)
                ");
                $consultaInsGasto->execute([$usuario_id, $clienteReq, $idObra, $concepto, $importe, $esExtra]);
                echo json_encode(['mensaje' => 'Gasto registrado correctamente en gastos generales']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Faltan datos obligatorios']);
            }
            break;

        case 'PUT':
            // EDITAR GASTO EXISTENTE
            $entrada = json_decode(file_get_contents("php://input"), true);
            if (isset($entrada['gasto_id']) && isset($entrada['importe'])) {
                $concepto = !empty($entrada['concepto']) ? $entrada['concepto'] : 'Gasto modificado';
                $consultaAct = $conexion->prepare("
                    UPDATE gastos_generales 
                    SET concepto = ?, importe_base = ?
                    WHERE id = ? AND usuario_id = ?
                ");
                $consultaAct->execute([$concepto, $entrada['importe'], $entrada['gasto_id'], $usuario_id]);
                echo json_encode(['mensaje' => 'Gasto actualizado correctamente']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Faltan datos']);
            }
            break;

        case 'DELETE':
            if (isset($_GET['gasto_id'])) {
                $consultaDel = $conexion->prepare("DELETE FROM gastos_generales WHERE id = ? AND usuario_id = ?");
                $consultaDel->execute([$_GET['gasto_id'], $usuario_id]);
                echo json_encode(['mensaje' => 'Gasto eliminado correctamente']);
            } elseif (isset($_GET['jornada_id'])) {
                $consultaDelJornada = $conexion->prepare("
                    DELETE oj FROM obra_jornadas oj
                    JOIN obras o ON oj.obra_id = o.id
                    WHERE oj.id = ? AND o.usuario_id = ?
                ");
                $consultaDelJornada->execute([$_GET['jornada_id'], $usuario_id]);
                echo json_encode(['mensaje' => 'Jornada eliminada correctamente']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'ID obligatorio']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>