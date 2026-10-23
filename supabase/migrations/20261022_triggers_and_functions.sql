-- ==============================================================================
-- FUNCIONES TRANSACCIONALES Y TRIGGERS DE INTEGRIDAD (POSTGRESQL / SUPABASE)
-- TIENDA KATY - CONTROL AUTOMÁTICO DE KARDEX Y SALDOS
-- ==============================================================================

-- 1. Función para recalcular stock y costo promedio ponderado en cada movimiento
CREATE OR REPLACE FUNCTION process_inventory_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_current_stock NUMERIC(12, 2);
    v_current_avg_cost NUMERIC(12, 4);
    v_new_stock NUMERIC(12, 2);
    v_new_avg_cost NUMERIC(12, 4);
BEGIN
    -- Bloquear fila del producto para concurrencia segura
    SELECT current_stock, avg_cost
    INTO v_current_stock, v_current_avg_cost
    FROM products
    WHERE id = NEW.product_id
    FOR UPDATE;

    -- Validar stocks
    NEW.previous_stock := COALESCE(v_current_stock, 0);

    IF NEW.quantity_in > 0 THEN
        v_new_stock := v_current_stock + NEW.quantity_in;
        
        -- Recálculo de Costo Promedio Ponderado para compras o recepciones
        IF NEW.movement_type IN ('inventario_inicial', 'compra_recibida', 'reposicion') AND NEW.unit_cost > 0 THEN
            IF v_new_stock > 0 THEN
                v_new_avg_cost := ((v_current_stock * v_current_avg_cost) + (NEW.quantity_in * NEW.unit_cost)) / v_new_stock;
            ELSE
                v_new_avg_cost := NEW.unit_cost;
            END IF;
        ELSE
            v_new_avg_cost := v_current_avg_cost;
        END IF;

    ELSIF NEW.quantity_out > 0 THEN
        IF v_current_stock < NEW.quantity_out THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto %. Stock actual: %, Salida solicitada: %', 
                NEW.product_id, v_current_stock, NEW.quantity_out;
        END IF;
        v_new_stock := v_current_stock - NEW.quantity_out;
        v_new_avg_cost := v_current_avg_cost;
    ELSE
        RAISE EXCEPTION 'El movimiento debe especificar cantidad de entrada o salida mayor a cero.';
    END IF;

    NEW.new_stock := v_new_stock;
    NEW.total_cost := (COALESCE(NEW.quantity_in, 0) + COALESCE(NEW.quantity_out, 0)) * COALESCE(NEW.unit_cost, v_new_avg_cost);

    -- Actualizar stock en la tabla de productos
    UPDATE products
    SET 
        current_stock = v_new_stock,
        avg_cost = v_new_avg_cost,
        updated_at = NOW()
    WHERE id = NEW.product_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_process_inventory_movement ON inventory_movements;
CREATE TRIGGER trg_process_inventory_movement
BEFORE INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION process_inventory_movement();

-- 2. Función para registrar auditoría automáticamente
CREATE OR REPLACE FUNCTION record_audit_log(
    p_user_id UUID,
    p_action VARCHAR,
    p_module VARCHAR,
    p_record_id VARCHAR,
    p_reason TEXT,
    p_previous_values JSONB,
    p_new_values JSONB
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, action, module, record_id, reason, previous_values, new_values
    ) VALUES (
        p_user_id, p_action, p_module, p_record_id, p_reason, p_previous_values, p_new_values
    ) RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
