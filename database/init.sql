-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: mysql
-- Tiempo de generación: 11-02-2026 a las 14:28:03
-- Versión del servidor: 8.0.44
-- Versión de PHP: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `reformas_db`
--
CREATE DATABASE IF NOT EXISTS `reformas_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `reformas_db`;

DELIMITER $$
--
-- Procedimientos
--
DROP PROCEDURE IF EXISTS `recalcular_totales_factura`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `recalcular_totales_factura` (IN `factura_id_param` INT)   BEGIN
    DECLARE total_items DECIMAL(10,2);
    
    SELECT COALESCE(SUM(importe), 0) INTO total_items
    FROM factura_items
    WHERE factura_id = factura_id_param;
    
    UPDATE facturas SET
        total_bruto = total_items,
        iva_importe = total_items * (iva_porcentaje / 100),
        total_factura = total_items + (total_items * (iva_porcentaje / 100))
    WHERE id = factura_id_param;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clientes`
--

DROP TABLE IF EXISTS `clientes`;
CREATE TABLE `clientes` (
  `id` int NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `tipo` enum('particular','empresa') DEFAULT 'empresa',
  `cif_dni` varchar(20) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `poblacion` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `codigo_postal` varchar(10) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `notas` text,
  `activo` tinyint(1) DEFAULT '1',
  `usuario_id` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `clientes`
--

INSERT INTO `clientes` (`id`, `nombre`, `tipo`, `cif_dni`, `direccion`, `poblacion`, `ciudad`, `codigo_postal`, `telefono`, `email`, `notas`, `activo`, `created_at`, `updated_at`) VALUES
(7, 'Victor', 'particular', '', 'C/Santa Gema 5 6A', 'Madrid', '', '', '+34 601 123 694', '', 'Este es un usuario de prueba', 1, '2026-02-10 13:23:47', '2026-02-11 13:15:20'),
(11, 'Emilio -Pedro Fernandez', 'empresa', '', 'c/ Las Eras ,9 2ºB', 'Fuenlabrada', '', '', ' +34 626 26 63 89', '', '', 1, '2026-02-10 21:22:59', '2026-02-11 09:09:42'),
(13, 'Lucia', 'particular', '', 'calle noria', '3113', '', '', '601123694', '', 'Bajo sin ascensor', 1, '2026-02-11 08:59:04', '2026-02-11 11:49:54'),
(14, 'Alvaro', 'particular', '49144255v', 'C/Santa Gema 5 6A', 'Madrid', 'Madrid', '28944', '+34 601 123 694', 'victor.benito.millan@gmail.com', 'Es un tonto', 1, '2026-02-11 10:59:58', '2026-02-11 13:15:29'),
(15, 'Arventia - oficina', 'empresa', '49144255v', 'C/ Pozuelo 7', 'Madrid', 'Pozuelo', '28944', '+34 601 123 694', 'victor.benito.millan@gmail.com', '', 1, '2026-02-11 13:16:22', '2026-02-11 14:17:51'),
(16, 'Arventia - sede', 'empresa', '49144255v', 'C/Gran Via 5', 'Madrid', 'Madrid', '28944', '+34 601 123 694', 'victor.benito.millan@gmail.com', '', 1, '2026-02-11 13:17:04', '2026-02-11 13:17:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
CREATE TABLE `configuracion` (
  `id` int NOT NULL,
  `nombre_empresa` varchar(200) DEFAULT NULL,
  `nombre_ceo` varchar(255) DEFAULT NULL,
  `cif_dni` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `poblacion` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `cuenta_bancaria` varchar(50) DEFAULT NULL,
  `email_empresa` varchar(100) DEFAULT NULL,
  `logo_url` LONGTEXT DEFAULT NULL,
  `usuario_id` int DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `configuracion`
--

INSERT INTO `configuracion` (`id`, `nombre_empresa`, `nombre_ceo`, `cif_dni`, `direccion`, `poblacion`, `telefono`, `cuenta_bancaria`, `email_empresa`, `logo_url`) VALUES
(1, 'DECOREFORM.A.B.', 'Miguel Angel Benito Fernández', 'B12345678', 'C/ Ejemplo 123', 'Madrid', '910000000', 'ES12 3456 7890 1234 5678 9012', 'info@decoriform.com', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `facturas`
--

DROP TABLE IF EXISTS `facturas`;
CREATE TABLE `facturas` (
  `id` int NOT NULL,
  `numero_factura` varchar(20) NOT NULL,
  `fecha_factura` date NOT NULL,
  `fecha_servicio` date DEFAULT NULL,
  `cliente_id` int NOT NULL,
  `presupuesto_id` int DEFAULT NULL,
  `oficio` varchar(150) DEFAULT NULL,
  `total_bruto` decimal(10,2) DEFAULT '0.00',
  `iva_porcentaje` decimal(4,2) DEFAULT '21.00',
  `iva_importe` decimal(10,2) DEFAULT '0.00',
  `total_factura` decimal(10,2) DEFAULT '0.00',
  `firma_pago` varchar(100) DEFAULT NULL,
  `iban` varchar(50) DEFAULT NULL,
  `numero_cuentas` int DEFAULT '1',
  `estado` enum('borrador','pendiente','pagada','cancelada') DEFAULT 'borrador',
  `usuario_id` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura_items`
--

DROP TABLE IF EXISTS `factura_items`;
CREATE TABLE `factura_items` (
  `id` int NOT NULL,
  `factura_id` int NOT NULL,
  `descripcion` text NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `importe` decimal(10,2) GENERATED ALWAYS AS ((`cantidad` * `precio_unitario`)) VIRTUAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Disparadores `factura_items`
--
DROP TRIGGER IF EXISTS `after_factura_items_delete`;
DELIMITER $$
CREATE TRIGGER `after_factura_items_delete` AFTER DELETE ON `factura_items` FOR EACH ROW BEGIN
    CALL recalcular_totales_factura(OLD.factura_id);
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `after_factura_items_insert`;
DELIMITER $$
CREATE TRIGGER `after_factura_items_insert` AFTER INSERT ON `factura_items` FOR EACH ROW BEGIN
    CALL recalcular_totales_factura(NEW.factura_id);
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `after_factura_items_update`;
DELIMITER $$
CREATE TRIGGER `after_factura_items_update` AFTER UPDATE ON `factura_items` FOR EACH ROW BEGIN
    CALL recalcular_totales_factura(NEW.factura_id);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gastos`
--

DROP TABLE IF EXISTS `gastos`;
CREATE TABLE `gastos` (
  `id` int NOT NULL,
  `concepto` varchar(255) DEFAULT NULL,
  `tipo` enum('material','gasolina','herramienta','otro') DEFAULT NULL,
  `importe` decimal(10,2) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `usuario_id` int DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presupuestos`
--

DROP TABLE IF EXISTS `presupuestos`;
CREATE TABLE `presupuestos` (
  `id` int NOT NULL,
  `numero_presupuesto` varchar(20) NOT NULL,
  `fecha_presupuesto` date NOT NULL,
  `cliente_id` int NOT NULL,
  `descripcion_general` varchar(255) DEFAULT NULL,
  `total_bruto` decimal(10,2) DEFAULT '0.00',
  `iva_porcentaje` decimal(4,2) DEFAULT '21.00',
  `iva_importe` decimal(10,2) DEFAULT '0.00',
  `total_presupuesto` decimal(10,2) DEFAULT '0.00',
  `estado` enum('pendiente','aceptado','rechazado') DEFAULT 'pendiente',
  `creado_factura` tinyint(1) DEFAULT '0',
  `usuario_id` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `presupuestos`
--

INSERT INTO `presupuestos` (`id`, `numero_presupuesto`, `fecha_presupuesto`, `cliente_id`, `descripcion_general`, `total_bruto`, `iva_porcentaje`, `iva_importe`, `total_presupuesto`, `estado`, `creado_factura`, `created_at`, `updated_at`) VALUES
(2, 'P-2026-001', '2026-02-10', 1, 'Presupuesto prueba', 0.00, 21.00, 0.00, 0.00, 'aceptado', 0, '2026-02-10 09:24:04', '2026-02-10 09:24:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `presupuesto_items`
--

DROP TABLE IF EXISTS `presupuesto_items`;
CREATE TABLE `presupuesto_items` (
  `id` int NOT NULL,
  `presupuesto_id` int NOT NULL,
  `descripcion` text NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `importe` decimal(10,2) GENERATED ALWAYS AS ((`cantidad` * `precio_unitario`)) VIRTUAL,
  `orden` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

DROP TABLE IF EXISTS `proveedores`;
CREATE TABLE `proveedores` (
  `id` int NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `cif` varchar(20) DEFAULT NULL,
  `numero_cuenta` varchar(34) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `notas` text,
  `activo` tinyint(1) DEFAULT '1',
  `usuario_id` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id`, `nombre`, `telefono`, `especialidad`, `cif`, `numero_cuenta`, `email`, `notas`, `activo`, `created_at`) VALUES
(1, 'German', '+34 601 123 694', 'Electricidad', 'A12345670', 'ES24144123', 'victor.benito.millan@gmail.com', '', 1, '2026-02-11 13:05:20'),
(2, 'Chispa', '+34 626266389', 'putero', '', '', 'victor.benito.millan@gmail.com', '', 1, '2026-02-11 13:17:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajadores`
--

DROP TABLE IF EXISTS `trabajadores`;
CREATE TABLE `trabajadores` (
  `id` int NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `tipo` enum('fijo','eventual') NOT NULL DEFAULT 'eventual',
  `precio_dia` decimal(10,2) DEFAULT NULL,
  `precio_hora` decimal(10,2) NOT NULL DEFAULT '0.00',
  `precio_sabado` decimal(10,2) NOT NULL DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `usuario_id` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `trabajadores`
--

INSERT INTO `trabajadores` (`id`, `nombre`, `telefono`, `tipo`, `precio_dia`, `precio_hora`, `precio_sabado`, `activo`, `created_at`) VALUES
(4, 'Jairo ', '+34 626266389', 'fijo', NULL, 8.00, 50.00, 1, '2026-02-11 08:15:49'),
(5, 'Victor', '+34 626 26 63 89', 'fijo', NULL, 10.00, 50.00, 1, '2026-02-11 12:31:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plantillas`
--

DROP TABLE IF EXISTS `plantillas`;
CREATE TABLE `plantillas` (
  `id` int NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `cantidad` decimal(10,2) DEFAULT '1.00',
  `precio` decimal(10,2) DEFAULT '0.00',
  `activo` tinyint(1) DEFAULT '1',
  `usuario_id` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajo_trabajadores`
--

DROP TABLE IF EXISTS `trabajo_trabajadores`;
CREATE TABLE `trabajo_trabajadores` (
  `id` int NOT NULL,
  `factura_id` int NOT NULL,
  `trabajador_id` int NOT NULL,
  `factor_jornada` decimal(3,2) DEFAULT '1.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`);

--
-- Indices de la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_factura_usuario` (`numero_factura`, `usuario_id`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `presupuesto_id` (`presupuesto_id`);

--
-- Indices de la tabla `factura_items`
--
ALTER TABLE `factura_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `factura_id` (`factura_id`);

--
-- Indices de la tabla `gastos`
--
ALTER TABLE `gastos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_presupuesto_usuario` (`numero_presupuesto`, `usuario_id`),
  ADD KEY `cliente_id` (`cliente_id`);

--
-- Indices de la tabla `presupuesto_items`
--
ALTER TABLE `presupuesto_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `presupuesto_id` (`presupuesto_id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `trabajadores`
--
ALTER TABLE `trabajadores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `plantillas`
--
ALTER TABLE `plantillas`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `trabajo_trabajadores`
--
ALTER TABLE `trabajo_trabajadores`
  ADD PRIMARY KEY (`id`),
  ADD KEY `factura_id` (`factura_id`),
  ADD KEY `trabajador_id` (`trabajador_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `configuracion`
--
ALTER TABLE `configuracion`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `facturas`
--
ALTER TABLE `facturas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `factura_items`
--
ALTER TABLE `factura_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gastos`
--
ALTER TABLE `gastos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `presupuesto_items`
--
ALTER TABLE `presupuesto_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `trabajadores`
--
ALTER TABLE `trabajadores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `plantillas`
--
ALTER TABLE `plantillas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `trabajo_trabajadores`
--
ALTER TABLE `trabajo_trabajadores`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `facturas`
--
ALTER TABLE `facturas`
  ADD CONSTRAINT `facturas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `facturas_ibfk_2` FOREIGN KEY (`presupuesto_id`) REFERENCES `presupuestos` (`id`);

--
-- Filtros para la tabla `factura_items`
--
ALTER TABLE `factura_items`
  ADD CONSTRAINT `factura_items_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `presupuestos`
--
ALTER TABLE `presupuestos`
  ADD CONSTRAINT `presupuestos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);

--
-- Filtros para la tabla `presupuesto_items`
--
ALTER TABLE `presupuesto_items`
  ADD CONSTRAINT `presupuesto_items_ibfk_1` FOREIGN KEY (`presupuesto_id`) REFERENCES `presupuestos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `trabajo_trabajadores`
--
ALTER TABLE `trabajo_trabajadores`
  ADD CONSTRAINT `trabajo_trabajadores_ibfk_1` FOREIGN KEY (`factura_id`) REFERENCES `facturas` (`id`),
  ADD CONSTRAINT `trabajo_trabajadores_ibfk_2` FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`);

-- --------------------------------------------------------
--
-- Estructura de tabla para la tabla `obras`
--
DROP TABLE IF EXISTS `obras`;
CREATE TABLE `obras` (
  `id` int NOT NULL,
  `presupuesto_id` int NOT NULL,
  `cliente_id` int NOT NULL,
  `numero_obra` varchar(20) NOT NULL,
  `titulo` varchar(255) DEFAULT NULL,
  `descripcion` text,
  `presupuesto_total` decimal(10,2) NOT NULL,
  `estado` enum('en_curso','cerrada') DEFAULT 'en_curso',
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `usuario_id` int DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
--
-- Estructura de tabla para la tabla `obra_jornadas`
--
DROP TABLE IF EXISTS `obra_jornadas`;
CREATE TABLE `obra_jornadas` (
  `id` int NOT NULL,
  `obra_id` int NOT NULL,
  `trabajador_id` int NOT NULL,
  `fecha` date NOT NULL,
  `tipo` enum('dia','medio','sabado','hora') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------
--
-- Adaptación tabla `gastos` para asociar a obra
--
ALTER TABLE `gastos`
  ADD COLUMN `obra_id` int DEFAULT NULL;

-- --------------------------------------------------------
--
-- Indices de la tabla `obras`
--
ALTER TABLE `obras`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_obra_usuario` (`numero_obra`, `usuario_id`),
  ADD UNIQUE KEY `presupuesto_id` (`presupuesto_id`),
  ADD KEY `cliente_id` (`cliente_id`);

-- --------------------------------------------------------
--
-- Indices de la tabla `obra_jornadas`
--
ALTER TABLE `obra_jornadas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `obra_id` (`obra_id`),
  ADD KEY `trabajador_id` (`trabajador_id`);

-- --------------------------------------------------------
--
-- AUTO_INCREMENT nuevas tablas
--
ALTER TABLE `obras`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `obra_jornadas`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------
--
-- Foreign Keys nuevas tablas
--
ALTER TABLE `obras`
  ADD CONSTRAINT `obras_ibfk_1` FOREIGN KEY (`presupuesto_id`) REFERENCES `presupuestos` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `obras_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT;

ALTER TABLE `obra_jornadas`
  ADD CONSTRAINT `obra_jornadas_ibfk_1` FOREIGN KEY (`obra_id`) REFERENCES `obras` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `obra_jornadas_ibfk_2` FOREIGN KEY (`trabajador_id`) REFERENCES `trabajadores` (`id`) ON DELETE RESTRICT;

ALTER TABLE `gastos`
  ADD CONSTRAINT `gastos_ibfk_obra` FOREIGN KEY (`obra_id`) REFERENCES `obras` (`id`) ON DELETE CASCADE;


--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `rol` ENUM('superusuario','usuario') NOT NULL DEFAULT 'usuario',
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `usuarios`
--

INSERT IGNORE INTO `usuarios` (`username`, `password`, `rol`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superusuario');

DROP TABLE IF EXISTS `gastos_generales`;
CREATE TABLE `gastos_generales` (
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

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
