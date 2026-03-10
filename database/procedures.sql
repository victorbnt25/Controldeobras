USE reformas_db;

DELIMITER $$

CREATE PROCEDURE recalcular_totales_factura(IN factura_id_param INT)
BEGIN
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

CREATE TRIGGER after_factura_items_insert
AFTER INSERT ON factura_items
FOR EACH ROW
BEGIN
    CALL recalcular_totales_factura(NEW.factura_id);
END$$

CREATE TRIGGER after_factura_items_update
AFTER UPDATE ON factura_items
FOR EACH ROW
BEGIN
    CALL recalcular_totales_factura(NEW.factura_id);
END$$

CREATE TRIGGER after_factura_items_delete
AFTER DELETE ON factura_items
FOR EACH ROW
BEGIN
    CALL recalcular_totales_factura(OLD.factura_id);
END$$

DELIMITER ;
