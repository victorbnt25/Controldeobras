<?php
// api/facturas.php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/database.php';

$conexion = obtenerConexionBD();
requerirRol('usuario');
$usuario_id = $_SESSION['usuario_id'];

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    enviarRespuesta([]);
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Detalle de una factura
            $consulta = $conexion->prepare("
                SELECT f.*, c.nombre as cliente_nombre, c.cif_dni as cliente_cif
                FROM facturas f
                JOIN clientes c ON f.cliente_id = c.id
                WHERE f.id = ? AND f.usuario_id = ?
            ");
            $consulta->execute([$_GET['id'], $usuario_id]);
            $factura = $consulta->fetch();
            
            if ($factura) {
                $consultaItems = $conexion->prepare("SELECT * FROM factura_items WHERE factura_id = ? ORDER BY id ASC");
                $consultaItems->execute([$factura['id']]);
                $factura['items'] = $consultaItems->fetchAll();
            }
            
            enviarRespuesta($factura ?: null);
        } else {
            // Obtener facturas del usuario (con opción de filtrado)
            $query = "
                SELECT f.*, c.nombre as cliente_nombre, c.cif_dni as cliente_cif
                FROM facturas f
                JOIN clientes c ON f.cliente_id = c.id
                WHERE f.usuario_id = ?
            ";
            
            $parametros = [$usuario_id];
            
            if (isset($_GET['estado']) && $_GET['estado'] !== '') {
                $query .= " AND f.estado = ?";
                $parametros[] = $_GET['estado'];
            }
            
            if (isset($_GET['cliente_id']) && $_GET['cliente_id'] !== '') {
                $query .= " AND f.cliente_id = ?";
                $parametros[] = $_GET['cliente_id'];
            }
            
            if (isset($_GET['mes']) && $_GET['mes'] !== '') {
                $query .= " AND DATE_FORMAT(f.fecha_factura, '%Y-%m') = ?";
                $parametros[] = $_GET['mes'];
            }
            
            $query .= " ORDER BY f.fecha_factura DESC, f.numero_factura DESC";
            
            try {
                $consulta = $conexion->prepare($query);
                $consulta->execute($parametros);
                $facturas = $consulta->fetchAll();
                
                // Obtener items para cada factura si se solicita
                if (isset($_GET['with_items']) && $_GET['with_items'] == '1') {
                    foreach ($facturas as &$factura) {
                        $consultaDeta = $conexion->prepare("
                            SELECT * FROM factura_items 
                            WHERE factura_id = ? 
                        ");
                        $consultaDeta->execute([$factura['id']]);
                        $factura['items'] = $consultaDeta->fetchAll();
                    }
                }
                
                enviarRespuesta($facturas);
            } catch(PDOException $e) {
                manejarError('Error obteniendo facturas: ' . $e->getMessage(), 500);
            }
        }
        break;
        
    case 'POST':
        $datos = json_decode(file_get_contents('php://input'), true);
        if (!$datos) manejarError('Datos inválidos', 400);
        
        $conexion->beginTransaction();
        try {
            $consulta = $conexion->prepare("
                INSERT INTO facturas (numero_factura, fecha_factura, cliente_id, oficio, presupuesto_id, total_bruto, iva_porcentaje, iva_importe, total_factura, forma_pago, estado, usuario_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $consulta->execute([
                $datos['numero_factura'],
                $datos['fecha_factura'],
                $datos['cliente_id'],
                $datos['oficio'] ?? null,
                $datos['presupuesto_id'] ?? null,
                $datos['total_bruto'] ?? 0,
                $datos['iva_porcentaje'] ?? 21,
                $datos['iva_importe'] ?? 0,
                $datos['total_factura'] ?? 0,
                $datos['forma_pago'] ?? 'Transferencia bancaria',
                $datos['estado'] ?? 'borrador',
                $usuario_id
            ]);
            $facturaId = $conexion->lastInsertId();
            
            if (isset($datos['items']) && is_array($datos['items'])) {
                $consultaItem = $conexion->prepare("INSERT INTO factura_items (factura_id, descripcion, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
                foreach ($datos['items'] as $item) {
                    $consultaItem->execute([$facturaId, $item['descripcion'], $item['cantidad'], $item['precio_unitario']]);
                }
            }

            if (!empty($datos['presupuesto_id'])) {
                $consultaPresu = $conexion->prepare("UPDATE presupuestos SET creado_factura = 1 WHERE id = ? AND usuario_id = ?");
                $consultaPresu->execute([$datos['presupuesto_id'], $usuario_id]);
            }
            
            $conexion->commit();
            enviarRespuesta(['id' => $facturaId]);
        } catch (Exception $e) {
            if ($conexion && $conexion->inTransaction()) {
                $conexion->rollBack();
            }
            manejarError($e->getMessage(), 500);
        }
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) manejarError('ID requerido', 400);
        
        $datos = json_decode(file_get_contents('php://input'), true);
        
        $conexion->beginTransaction();
        try {
            $consultaGet = $conexion->prepare("SELECT estado FROM facturas WHERE id = ? AND usuario_id = ?");
            $consultaGet->execute([$id, $usuario_id]);
            $currentF = $consultaGet->fetch(PDO::FETCH_ASSOC);
            if ($currentF && $currentF['estado'] === 'pagada') {
                if (!isset($datos['only_status']) || !$datos['only_status']) {
                    manejarError('No se pueden modificar los detalles (importes/conceptos) de una factura certificada como cobrada.', 403);
                }
            }

            if (isset($datos['only_status']) && $datos['only_status']) {
                $consulta = $conexion->prepare("UPDATE facturas SET estado=?, forma_pago=? WHERE id=? AND usuario_id=?");
                $consulta->execute([$datos['estado'], $datos['forma_pago'], $id, $usuario_id]);
                
                if (($datos['estado'] ?? 'pendiente') === 'pagada') {
                    $stmt = $conexion->prepare("SELECT presupuesto_id FROM facturas WHERE id=? AND usuario_id=?");
                    $stmt->execute([$id, $usuario_id]);
                    $fact = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($fact && $fact['presupuesto_id']) {
                        $updObra = $conexion->prepare("UPDATE obras SET estado='pagada' WHERE presupuesto_id=? AND usuario_id=?");
                        $updObra->execute([$fact['presupuesto_id'], $usuario_id]);
                    }
                } else {
                    $stmt = $conexion->prepare("SELECT presupuesto_id FROM facturas WHERE id=? AND usuario_id=?");
                    $stmt->execute([$id, $usuario_id]);
                    $fact = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($fact && $fact['presupuesto_id']) {
                        $updObra = $conexion->prepare("UPDATE obras SET estado='en_curso' WHERE presupuesto_id=? AND usuario_id=?");
                        $updObra->execute([$fact['presupuesto_id'], $usuario_id]);
                    }
                }
                
                $conexion->commit();
                enviarRespuesta(['ok' => true]);
                break;
            }

            $consulta = $conexion->prepare("
                UPDATE facturas SET
                    numero_factura=?, fecha_factura=?, cliente_id=?, oficio=?, total_bruto=?, iva_porcentaje=?, iva_importe=?, total_factura=?, forma_pago=?, estado=?
                WHERE id=? AND usuario_id=?
            ");
            $consulta->execute([
                $datos['numero_factura'],
                $datos['fecha_factura'],
                $datos['cliente_id'],
                $datos['oficio'] ?? null,
                $datos['total_bruto'],
                $datos['iva_porcentaje'],
                $datos['iva_importe'],
                $datos['total_factura'],
                $datos['forma_pago'] ?? 'Transferencia bancaria',
                $datos['estado'] ?? 'pendiente',
                $id,
                $usuario_id
            ]);
            
            // Reemplazar items
            $conexion->prepare("DELETE FROM factura_items WHERE factura_id=?")->execute([$id]);
            if (isset($datos['items']) && is_array($datos['items'])) {
                $consultaItem = $conexion->prepare("INSERT INTO factura_items (factura_id, descripcion, cantidad, precio_unitario) VALUES (?, ?, ?, ?)");
                foreach ($datos['items'] as $item) {
                    $consultaItem->execute([$id, $item['descripcion'], $item['cantidad'], $item['precio_unitario']]);
                }
            }

            if (($datos['estado'] ?? 'pendiente') === 'pagada') {
                $stmt = $conexion->prepare("SELECT presupuesto_id FROM facturas WHERE id=? AND usuario_id=?");
                $stmt->execute([$id, $usuario_id]);
                $fact = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($fact && $fact['presupuesto_id']) {
                    $updObra = $conexion->prepare("UPDATE obras SET estado='pagada' WHERE presupuesto_id=? AND usuario_id=?");
                    $updObra->execute([$fact['presupuesto_id'], $usuario_id]);
                }
            } else {
                $stmt = $conexion->prepare("SELECT presupuesto_id FROM facturas WHERE id=? AND usuario_id=?");
                $stmt->execute([$id, $usuario_id]);
                $fact = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($fact && $fact['presupuesto_id']) {
                    $updObra = $conexion->prepare("UPDATE obras SET estado='en_curso' WHERE presupuesto_id=? AND usuario_id=?");
                    $updObra->execute([$fact['presupuesto_id'], $usuario_id]);
                }
            }
            
            $conexion->commit();
            enviarRespuesta(['ok' => true]);
        } catch (Exception $e) {
            if ($conexion && $conexion->inTransaction()) {
                $conexion->rollBack();
            }
            manejarError($e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) manejarError('ID requerido', 400);
        
        $conexion->beginTransaction();
        try {
            // 1. Obtener presupuesto_id y estado antes de borrar
            $consultaGet = $conexion->prepare("SELECT estado, presupuesto_id FROM facturas WHERE id = ? AND usuario_id = ?");
            $consultaGet->execute([$id, $usuario_id]);
            $f = $consultaGet->fetch(PDO::FETCH_ASSOC);
            
            if (!$f) manejarError('Factura no encontrada', 404);
            if ($f['estado'] === 'pagada') manejarError('Las facturas pagadas no se pueden eliminar por normativa fiscal española.', 403);
            
            // 2. Borrar las partidas (items) de la factura
            $consultaDelItems = $conexion->prepare("DELETE FROM factura_items WHERE factura_id = ?");
            $consultaDelItems->execute([$id]);

            // 3. Borrar factura
            $consultaDel = $conexion->prepare("DELETE FROM facturas WHERE id=? AND usuario_id=?");
            $consultaDel->execute([$id, $usuario_id]);
            
            // 4. Resetear flag en presupuestos y devolver obra a activa
            if ($f && !empty($f['presupuesto_id'])) {
                $consultaReset = $conexion->prepare("UPDATE presupuestos SET creado_factura = 0 WHERE id = ? AND usuario_id = ?");
                $consultaReset->execute([$f['presupuesto_id'], $usuario_id]);

                $consultaObra = $conexion->prepare("UPDATE obras SET estado = 'en_curso' WHERE presupuesto_id = ? AND usuario_id = ?");
                $consultaObra->execute([$f['presupuesto_id'], $usuario_id]);
            }
            
            $conexion->commit();
            enviarRespuesta(['ok' => true]);
        } catch (Exception $e) {
            if ($conexion && $conexion->inTransaction()) {
                $conexion->rollBack();
            }
            manejarError($e->getMessage(), 500);
        }
        break;
        
    default:
        manejarError('Método no permitido', 405);
        break;
}