<?php
// 1. IMPORTANTE: Silenciar errores visibles para no romper el JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Usamos try-catch global para capturar errores de inclusión
try {
    require_once __DIR__ . '/../config/cors.php';
    require_once __DIR__ . '/../config/auth.php';
    require_once __DIR__ . '/../config/database.php';

    $conexion = obtenerConexionBD();
    requerirRol('usuario');
    $usuario_id = $_SESSION['usuario_id'];
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error crítico de configuración: ' . $e->getMessage()]);
    exit;
}

// NOTA: No definimos enviarRespuesta() ni manejarError() aquí porque ya vienen de database.php

$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Obtener un solo presupuesto del usuario
                $consulta = $conexion->prepare("SELECT * FROM presupuestos WHERE id = ? AND usuario_id = ?");
                $consulta->execute([$_GET['id'], $usuario_id]);
                $presupuesto = $consulta->fetch(PDO::FETCH_ASSOC);

                if ($presupuesto) {
                    $consultaPartidas = $conexion->prepare("SELECT * FROM presupuesto_items WHERE presupuesto_id = ? ORDER BY orden ASC");
                    $consultaPartidas->execute([$_GET['id']]);
                    $presupuesto['items'] = $consultaPartidas->fetchAll(PDO::FETCH_ASSOC);
                }

                enviarRespuesta($presupuesto ?: null);
            } else {
                // Listado general del usuario
                $sql = "SELECT p.*, COALESCE(c.nombre, 'Cliente desconocido') as cliente_nombre 
                        FROM presupuestos p 
                        LEFT JOIN clientes c ON p.cliente_id = c.id 
                        WHERE p.usuario_id = ?
                        ORDER BY p.created_at DESC";
                
                $consulta = $conexion->prepare($sql);
                $consulta->execute([$usuario_id]);
                $presupuestos = $consulta->fetchAll(PDO::FETCH_ASSOC);
                
                if (!$presupuestos) {
                    $presupuestos = [];
                }
                
                enviarRespuesta($presupuestos);
            }
            break;

        case 'POST':
            // Leer entrada
            $entrada = file_get_contents("php://input");
            $datos = json_decode($entrada, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                manejarError("JSON inválido recibido");
            }

            // Normalizar claves (Soporte camelCase)
            $idCliente = $datos['cliente_id'] ?? $datos['clienteId'] ?? null;

            if (!$idCliente || !isset($datos['items'])) {
                manejarError("Faltan datos obligatorios (cliente_id o items)");
            }

            $conexion->beginTransaction();

            // Insertar cabecera con usuario_id
            $consulta = $conexion->prepare("
                INSERT INTO presupuestos 
                (numero_presupuesto, fecha_presupuesto, cliente_id, descripcion_general, iva_porcentaje, estado, total_bruto, iva_importe, total_presupuesto, usuario_id) 
                VALUES (?, ?, ?, ?, ?, 'pendiente', 0, 0, 0, ?)
            ");

            // Valores por defecto
            $numero = $datos['numero_presupuesto'] ?? 'BORRADOR-' . time();
            $fecha = $datos['fecha_presupuesto'] ?? date('Y-m-d');
            $desc = $datos['descripcion_general'] ?? '';
            $iva = $datos['iva_porcentaje'] ?? 0;

            $consulta->execute([
                $numero,
                $fecha,
                $idCliente,
                $desc,
                $iva,
                $usuario_id
            ]);

            $presupuestoId = $conexion->lastInsertId();
            $totalBruto = 0;

            // Insertar partidas/items
            $consultaPartida = $conexion->prepare("
                INSERT INTO presupuesto_items 
                (presupuesto_id, descripcion, cantidad, precio_unitario, orden) 
                VALUES (?, ?, ?, ?, ?)
            ");

            if (is_array($datos['items'])) {
                foreach ($datos['items'] as $indice => $item) {
                    $descPartida = $item['descripcion'] ?? 'Partida sin nombre';
                    $cantidad = floatval($item['cantidad'] ?? 0);
                    $precio = floatval($item['precio_unitario'] ?? 0);
                    
                    $importe = $cantidad * $precio;
                    
                    // Excluir de la suma si es un campo de "subtotal" o "suma informativa"
                    $descMayus = strtoupper($descPartida);
                    $esSuma = false;
                    foreach (['SUMA', 'RESTO', 'SUBTOTAL', 'TOTAL'] as $palabraClave) {
                        if (strpos($descMayus, $palabraClave) === 0) {
                            $esSuma = true;
                            break;
                        }
                    }

                    if (!$esSuma) {
                        $totalBruto += $importe;
                    }

                    $consultaPartida->execute([
                        $presupuestoId,
                        $descPartida,
                        $cantidad,
                        $precio,
                        $indice
                    ]);
                }
            }

            // Actualizar totales
            $ivaPorcentaje = floatval($iva);
            $ivaImporte = $totalBruto * ($ivaPorcentaje / 100);
            $totalPresupuesto = $totalBruto + $ivaImporte;

            $consultaActualizacion = $conexion->prepare("
                UPDATE presupuestos 
                SET total_bruto = ?, iva_importe = ?, total_presupuesto = ? 
                WHERE id = ? AND usuario_id = ?
            ");
            $consultaActualizacion->execute([$totalBruto, $ivaImporte, $totalPresupuesto, $presupuestoId, $usuario_id]);

            $conexion->commit();

            enviarRespuesta(['mensaje' => 'Presupuesto creado', 'id' => $presupuestoId], 201);
            break;

        case 'PUT':
            // Actualizar presupuesto (Datos completos o solo Estado)
            $entrada = file_get_contents("php://input");
            $datos = json_decode($entrada, true);

            if (!isset($datos['id'])) {
                manejarError("ID de presupuesto obligatorio");
            }

            // Verificar propiedad antes de empezar transacción (opcional pero recomendado)
            $consultaPropiedad = $conexion->prepare("SELECT id FROM presupuestos WHERE id = ? AND usuario_id = ?");
            $consultaPropiedad->execute([$datos['id'], $usuario_id]);
            if (!$consultaPropiedad->fetch()) {
                manejarError("Acceso denegado a este presupuesto", 403);
            }

            $conexion->beginTransaction();

            // Variable para controlar si debemos sincronizar la obra
            $sincronizarObra = false;
            $presupuestoId = $datos['id'];

            if (isset($datos['estado']) && !isset($datos['items'])) {
                // CASO 1: Solo actualizar estado
                $consulta = $conexion->prepare("UPDATE presupuestos SET estado = ? WHERE id = ? AND usuario_id = ?");
                $consulta->execute([$datos['estado'], $datos['id'], $usuario_id]);

                if ($datos['estado'] === 'aceptado') {
                    $sincronizarObra = true;
                }
            } else {
                // CASO 2: Actualización completa (Edición)
                $consulta = $conexion->prepare("
                    UPDATE presupuestos 
                    SET numero_presupuesto=?, fecha_presupuesto=?, cliente_id=?, descripcion_general=?, iva_porcentaje=? 
                    WHERE id=? AND usuario_id=?
                ");
                
                $consulta->execute([
                    $datos['numero_presupuesto'],
                    $datos['fecha_presupuesto'],
                    $datos['cliente_id'],
                    $datos['descripcion_general'],
                    $datos['iva_porcentaje'],
                    $datos['id'],
                    $usuario_id
                ]);

                // Reemplazar items (Borrar y Crear)
                $conexion->prepare("DELETE FROM presupuesto_items WHERE presupuesto_id=?")->execute([$datos['id']]);

                $consultaPartida = $conexion->prepare("
                    INSERT INTO presupuesto_items 
                    (presupuesto_id, descripcion, cantidad, precio_unitario, orden) 
                    VALUES (?, ?, ?, ?, ?)
                ");

                $totalBruto = 0;
                if (is_array($datos['items'])) {
                    foreach ($datos['items'] as $indice => $item) {
                        $descPartida = $item['descripcion'] ?? 'Partida sin nombre';
                        $cantidad = floatval($item['cantidad'] ?? 0);
                        $precio = floatval($item['precio_unitario'] ?? 0);
                        
                        $importe = $cantidad * $precio;
                        
                        // Excluir de la suma si es un campo de "subtotal" o "suma informativa"
                        $descMayus = strtoupper($descPartida);
                        $esSuma = false;
                        foreach (['SUMA', 'RESTO', 'SUBTOTAL', 'TOTAL'] as $palabraClave) {
                            if (strpos($descMayus, $palabraClave) === 0) {
                                $esSuma = true;
                                break;
                            }
                        }

                        if (!$esSuma) {
                            $totalBruto += $importe;
                        }

                        $consultaPartida->execute([
                            $datos['id'],
                            $descPartida,
                            $cantidad,
                            $precio,
                            $indice
                        ]);
                    }
                }

                // Recalcular totales
                $ivaPorcentaje = floatval($datos['iva_porcentaje']);
                $ivaImporte = $totalBruto * ($ivaPorcentaje / 100);
                $totalPresupuesto = $totalBruto + $ivaImporte;

                $consultaTotales = $conexion->prepare("UPDATE presupuestos SET total_bruto=?, iva_importe=?, total_presupuesto=? WHERE id=? AND usuario_id=?");
                $consultaTotales->execute([$totalBruto, $ivaImporte, $totalPresupuesto, $datos['id'], $usuario_id]);
                
                // Si editamos un presupuesto que YA estaba aceptado, hay que actualizar la obra también
                $consultaEstado = $conexion->prepare("SELECT estado FROM presupuestos WHERE id = ?");
                $consultaEstado->execute([$datos['id']]);
                if ($consultaEstado->fetchColumn() === 'aceptado') {
                    $sincronizarObra = true;
                }
            }

            // --- LÓGICA CENTRALIZADA: CREAR O ACTUALIZAR OBRA ---
            if ($sincronizarObra) {
                // 1. Obtener datos frescos del presupuesto
                $consultaPre = $conexion->prepare("SELECT * FROM presupuestos WHERE id = ?");
                $consultaPre->execute([$presupuestoId]);
                $presupuesto = $consultaPre->fetch(PDO::FETCH_ASSOC);

                if ($presupuesto) {
                    // 2. Verificar si ya existe la obra
                    $consultaObraCheck = $conexion->prepare("SELECT id FROM obras WHERE presupuesto_id = ?");
                    $consultaObraCheck->execute([$presupuestoId]);
                    $obraExistente = $consultaObraCheck->fetch(PDO::FETCH_ASSOC);
                    
                    $tituloObra = $presupuesto['descripcion_general'] ?: 'Obra nueva';

                    if ($obraExistente) {
                        // ACTUALIZAR: Si ya existe, actualizamos totales y textos
                        $consultaActObra = $conexion->prepare("
                            UPDATE obras 
                            SET titulo = ?, descripcion = ?, presupuesto_total = ?, cliente_id = ?
                            WHERE id = ? AND usuario_id = ?
                        ");
                        $consultaActObra->execute([
                            $tituloObra,
                            $presupuesto['descripcion_general'],
                            $presupuesto['total_presupuesto'],
                            $presupuesto['cliente_id'],
                            $obraExistente['id'],
                            $usuario_id
                        ]);
                    } else {
                        // INSERTAR: Si no existe, la creamos
                        $consultaInsObra = $conexion->prepare("
                            INSERT INTO obras (presupuesto_id, cliente_id, numero_obra, titulo, descripcion, presupuesto_total, estado, created_at, usuario_id)
                            VALUES (?, ?, ?, ?, ?, ?, 'en_curso', NOW(), ?)
                        ");
                        $consultaInsObra->execute([
                            $presupuesto['id'],
                            $presupuesto['cliente_id'],
                            $presupuesto['numero_presupuesto'],
                            $tituloObra,
                            $presupuesto['descripcion_general'],
                            $presupuesto['total_presupuesto'],
                            $usuario_id
                        ]);
                    }
                }
            }

            $conexion->commit();
            enviarRespuesta(['mensaje' => 'Presupuesto actualizado correctamente']);
            break;

        case 'DELETE':
            // Borrar presupuesto
            $entrada = file_get_contents("php://input");
            $datos = json_decode($entrada, true);
            
            $id = $_GET['id'] ?? $datos['id'] ?? null;

            if (!$id) {
                manejarError("ID de presupuesto obligatorio");
            }

            // Verificar propiedad
            $consultaPropiedad = $conexion->prepare("SELECT id FROM presupuestos WHERE id = ? AND usuario_id = ?");
            $consultaPropiedad->execute([$id, $usuario_id]);
            if (!$consultaPropiedad->fetch()) {
                manejarError("Acceso denegado a este presupuesto", 403);
            }

            $conexion->beginTransaction();

            // 1. Desvincular facturas asociadas a este presupuesto (para que no bloquee FK)
            $conexion->prepare("UPDATE facturas SET presupuesto_id = NULL WHERE presupuesto_id = ? AND usuario_id = ?")->execute([$id, $usuario_id]);

            // 2. Borrar las partidas (items) asociadas al presupuesto
            $conexion->prepare("DELETE FROM presupuesto_items WHERE presupuesto_id = ?")->execute([$id]);

            // 3. Obtener la obra asociada y borrar sus registros dependientes antes de borrar la obra
            $consultaObra = $conexion->prepare("SELECT id FROM obras WHERE presupuesto_id = ? AND usuario_id = ?");
            $consultaObra->execute([$id, $usuario_id]);
            $obrasAsociadas = $consultaObra->fetchAll(PDO::FETCH_ASSOC);

            if ($obrasAsociadas && count($obrasAsociadas) > 0) {
                foreach ($obrasAsociadas as $obraAsociada) {
                    // Borramos dependencias de la obra
                    $conexion->prepare("DELETE FROM gastos WHERE obra_id = ?")->execute([$obraAsociada['id']]);
                    $conexion->prepare("DELETE FROM obra_jornadas WHERE obra_id = ?")->execute([$obraAsociada['id']]);
                    // Borramos la obra en sí
                    $conexion->prepare("DELETE FROM obras WHERE id = ?")->execute([$obraAsociada['id']]);
                }
            }

            // 4. Finalmente, borrar el presupuesto
            $consultaDelPre = $conexion->prepare("DELETE FROM presupuestos WHERE id = ? AND usuario_id = ?");
            $consultaDelPre->execute([$id, $usuario_id]);
            
            $conexion->commit();
            enviarRespuesta(['mensaje' => 'Presupuesto eliminado correctamente']);
            break;

        default:
            manejarError("Método no permitido", 405);
            break;
    }
} catch (Throwable $e) {
    error_log("ERROR_CRITICO_AQUI: " . $e->getMessage() . "\n" . $e->getTraceAsString());
    if ($conexion && $conexion->inTransaction()) {
        $conexion->rollBack();
    }
    if (function_exists('manejarError')) {
        manejarError("Error del servidor: " . $e->getMessage(), 500);
    } else {
        http_response_code(500);
        echo json_encode(['error' => "Error crítico: " . $e->getMessage()]);
    }
}
?>