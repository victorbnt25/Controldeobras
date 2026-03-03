-- Script para añadir la tabla gastos_generales al servidor de producción
-- Ejecutar en phpMyAdmin o via CLI: mysql -u root -p reformas_db < add_gastos_generales.sql

CREATE TABLE IF NOT EXISTS `gastos_generales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `cliente_id` int NOT NULL,
  `obra_id` int NOT NULL,
  `proveedor_id` int NOT NULL,
  `concepto` varchar(255) NOT NULL,
  `fecha` date NOT NULL,
  `importe_base` decimal(10,2) NOT NULL DEFAULT '0.00',
  `iva_porcentaje` decimal(5,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_usuario_fecha` (`usuario_id`, `fecha`),
  KEY `idx_usuario_cliente` (`usuario_id`, `cliente_id`),
  KEY `idx_usuario_obra` (`usuario_id`, `obra_id`),
  KEY `idx_usuario_proveedor` (`usuario_id`, `proveedor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
