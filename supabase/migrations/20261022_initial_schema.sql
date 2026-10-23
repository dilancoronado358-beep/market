-- ==============================================================================
-- SISTEMA INTEGRAL DE GESTIÓN COMERCIAL PARA TIENDA (TIENDA KATY) - ECUADOR
-- MIGRACIÓN INICIAL COMPLETA - POSTGRESQL / SUPABASE
-- ==============================================================================

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipos Enumerados (Enums)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'administrador',
        'gerente',
        'supervisor',
        'cajero',
        'encargado_inventario',
        'responsable_compras',
        'auditor'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE visit_status AS ENUM (
        'en_curso',
        'en_recepcion',
        'pendiente_inspeccion',
        'con_incidencias',
        'pendiente_retiro',
        'pendiente_reposicion',
        'finalizada',
        'anulada'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE visit_item_status AS ENUM (
        'recibido_conforme',
        'recibido_con_diferencias',
        'dañado',
        'pendiente_inspeccion',
        'rechazado',
        'pendiente_reposicion'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'reportado',
        'en_revision',
        'segregado',
        'notificado_proveedor',
        'pendiente_retiro',
        'pendiente_reposicion',
        'reembolsado_compensado',
        'resuelto',
        'cerrado_sin_compensacion'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE return_status AS ENUM (
        'solicitud',
        'producto_segregado',
        'preparado_retiro',
        'retirado_confirmado',
        'aceptado_proveedor',
        'compensacion_pendiente'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE replacement_status AS ENUM (
        'solicitada',
        'aprobada',
        'pendiente_entrega',
        'entrega_parcial',
        'completada',
        'rechazada',
        'cancelada'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE movement_type AS ENUM (
        'inventario_inicial',
        'compra_recibida',
        'venta',
        'devolucion_cliente',
        'devolucion_proveedor',
        'producto_cambiado',
        'reposicion',
        'producto_dañado',
        'producto_vencido',
        'ajuste_positivo',
        'ajuste_negativo',
        'perdida',
        'consumo_interno',
        'transferencia_bodegas',
        'reversion_autorizada'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE sri_doc_type AS ENUM (
        'factura',
        'nota_credito',
        'nota_debito',
        'guia_remision',
        'retencion'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE sri_auth_status AS ENUM (
        'pendiente',
        'generado',
        'firmado',
        'enviado',
        'recibido',
        'autorizado',
        'rechazado',
        'no_autorizado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE email_status AS ENUM (
        'pendiente',
        'en_proceso',
        'enviado',
        'fallido',
        'cancelado'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Tabla de Tiendas / Sucursales
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE DEFAULT 'MATRIZ-001',
    name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL DEFAULT 'TIENDA KATY',
    ruc VARCHAR(13) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    establishment_code VARCHAR(3) NOT NULL DEFAULT '001',
    emission_point_code VARCHAR(3) NOT NULL DEFAULT '001',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Perfiles de Usuario y Roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'cajero',
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_access TIMESTAMPTZ,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Permisos por Rol y Permisos Personalizados
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role user_role NOT NULL,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (user_id, permission_id)
);

-- 6. Categorías de Producto
CREATE TABLE IF NOT EXISTS product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Proveedores
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ruc VARCHAR(13) NOT NULL UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Quito',
    phone VARCHAR(50),
    email VARCHAR(255),
    payment_terms_days INTEGER NOT NULL DEFAULT 15,
    lead_time_days INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'Vendedor',
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Catálogo de Productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internal_code VARCHAR(100) NOT NULL UNIQUE,
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unidad',
    unit_purchase VARCHAR(50) NOT NULL DEFAULT 'unidad',
    unit_conversion_ratio NUMERIC(12, 4) NOT NULL DEFAULT 1.0,
    cost_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0 CHECK (cost_price >= 0),
    avg_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0 CHECK (avg_cost >= 0),
    sale_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0 CHECK (sale_price >= 0),
    wholesale_price NUMERIC(12, 4) CHECK (wholesale_price >= 0),
    iva_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    min_stock NUMERIC(12, 2) NOT NULL DEFAULT 5,
    max_stock NUMERIC(12, 2) NOT NULL DEFAULT 100,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    reserved_stock NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quarantine_stock NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Stock dañado / no vendible
    location VARCHAR(100),
    main_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_barcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_suppliers (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100),
    last_purchase_price NUMERIC(12, 4),
    is_preferred BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (product_id, supplier_id)
);

-- 9. Lotes y Caducidades
CREATE TABLE IF NOT EXISTS inventory_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    lot_number VARCHAR(100) NOT NULL,
    expiration_date DATE,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, lot_number)
);

-- 10. MÓDULO PRIORITARIO: Control de Visitas de Proveedores (Expediente Digital)
CREATE TABLE IF NOT EXISTS supplier_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    sales_rep_name VARCHAR(255) NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    receiver_user_id UUID NOT NULL REFERENCES profiles(id),
    reason TEXT NOT NULL DEFAULT 'Entrega y reposición de mercadería',
    invoice_or_doc_ref VARCHAR(100),
    status visit_status NOT NULL DEFAULT 'en_curso',
    notes TEXT,
    has_incidents BOOLEAN NOT NULL DEFAULT false,
    has_replacements_pending BOOLEAN NOT NULL DEFAULT false,
    acta_generated_at TIMESTAMPTZ,
    acta_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_visit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES supplier_visits(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    declared_qty NUMERIC(12, 2) NOT NULL CHECK (declared_qty >= 0),
    received_qty NUMERIC(12, 2) NOT NULL CHECK (received_qty >= 0),
    accepted_qty NUMERIC(12, 2) NOT NULL CHECK (accepted_qty >= 0),
    rejected_qty NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (rejected_qty >= 0),
    unit VARCHAR(50) NOT NULL DEFAULT 'unidad',
    unit_cost NUMERIC(12, 4) NOT NULL CHECK (unit_cost >= 0),
    lot_number VARCHAR(100),
    expiration_date DATE,
    status visit_item_status NOT NULL DEFAULT 'recibido_conforme',
    difference_reason TEXT,
    is_new_product BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Productos Dañados e Incidencias con Proveedores
CREATE TABLE IF NOT EXISTS supplier_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) NOT NULL UNIQUE,
    visit_id UUID REFERENCES supplier_visits(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    affected_qty NUMERIC(12, 2) NOT NULL CHECK (affected_qty > 0),
    lot_number VARCHAR(100),
    reported_by UUID NOT NULL REFERENCES profiles(id),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    damage_reason TEXT NOT NULL,
    photo_urls TEXT[] DEFAULT '{}',
    estimated_value NUMERIC(12, 4) NOT NULL DEFAULT 0,
    physical_location VARCHAR(100) DEFAULT 'Área de Devoluciones / Cuarentena',
    status incident_status NOT NULL DEFAULT 'reportado',
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Mercadería que se lleva el Proveedor (Retiros y Devoluciones)
CREATE TABLE IF NOT EXISTS supplier_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(50) NOT NULL UNIQUE,
    visit_id UUID REFERENCES supplier_visits(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    status return_status NOT NULL DEFAULT 'solicitud',
    authorized_by UUID REFERENCES profiles(id),
    physical_departure_at TIMESTAMPTZ,
    carrier_or_rep_name VARCHAR(255),
    document_ref VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES supplier_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    incident_id UUID REFERENCES supplier_incidents(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL, -- dañado, vencido, equivocado, retiro comercial, etc.
    unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
    photo_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Cambios Mano a Mano de Productos
CREATE TABLE IF NOT EXISTS supplier_exchanges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exchange_number VARCHAR(50) NOT NULL UNIQUE,
    visit_id UUID REFERENCES supplier_visits(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    processed_by UUID NOT NULL REFERENCES profiles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'completado',
    price_difference NUMERIC(12, 4) NOT NULL DEFAULT 0.00,
    treatment_of_difference TEXT,
    doc_ref VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supplier_exchange_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exchange_id UUID NOT NULL REFERENCES supplier_exchanges(id) ON DELETE CASCADE,
    original_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    original_qty NUMERIC(12, 2) NOT NULL CHECK (original_qty > 0),
    original_cost NUMERIC(12, 4) NOT NULL,
    replacement_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    replacement_qty NUMERIC(12, 2) NOT NULL CHECK (replacement_qty > 0),
    replacement_cost NUMERIC(12, 4) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Compromisos de Reposición Pendiente
CREATE TABLE IF NOT EXISTS supplier_replacements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    replacement_number VARCHAR(50) NOT NULL UNIQUE,
    origin_visit_id UUID REFERENCES supplier_visits(id) ON DELETE SET NULL,
    origin_incident_id UUID REFERENCES supplier_incidents(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    affected_qty NUMERIC(12, 2) NOT NULL CHECK (affected_qty > 0),
    agreed_qty NUMERIC(12, 2) NOT NULL CHECK (agreed_qty > 0),
    delivered_qty NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (delivered_qty >= 0),
    commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE NOT NULL,
    status replacement_status NOT NULL DEFAULT 'solicitada',
    responsible_user_id UUID NOT NULL REFERENCES profiles(id),
    fulfilled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Kardex y Movimientos de Inventario (Inmutables)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_number VARCHAR(50) NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    movement_type movement_type NOT NULL,
    quantity_in NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_in >= 0),
    quantity_out NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (quantity_out >= 0),
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
    total_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
    doc_type VARCHAR(100),
    doc_id VARCHAR(100),
    doc_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    customer_id UUID,
    user_id UUID NOT NULL REFERENCES profiles(id),
    reason TEXT NOT NULL,
    notes TEXT,
    is_reversal BOOLEAN NOT NULL DEFAULT false,
    reversal_of_id UUID REFERENCES inventory_movements(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Clientes
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identification_type VARCHAR(20) NOT NULL DEFAULT 'cedula', -- cedula, ruc, pasaporte, consumidor_final
    identification_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    total_purchases_count INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Sesiones y Operaciones de Caja (Turnos)
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    store_id UUID NOT NULL REFERENCES stores(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_number VARCHAR(50) NOT NULL UNIQUE,
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_float NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (opening_float >= 0),
    cash_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    card_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    transfer_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    credit_sales_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    inflows_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    outflows_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0,
    actual_counted_cash NUMERIC(12, 2),
    difference NUMERIC(12, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'abierta', -- abierta, cerrada, auditada
    supervisor_id UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL, -- ingreso, egreso, retiro_parcial
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    authorized_by UUID REFERENCES profiles(id),
    receipt_doc_ref VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Ventas (POS)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number VARCHAR(50) NOT NULL UNIQUE,
    session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    seller_user_id UUID NOT NULL REFERENCES profiles(id),
    subtotal_0 NUMERIC(12, 2) NOT NULL DEFAULT 0,
    subtotal_iva NUMERIC(12, 2) NOT NULL DEFAULT 0,
    iva_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'completada', -- completada, anulada
    payment_method VARCHAR(50) NOT NULL DEFAULT 'efectivo', -- efectivo, tarjeta, transferencia, mixto
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    change_given NUMERIC(12, 2) NOT NULL DEFAULT 0,
    internal_doc_number VARCHAR(50),
    sri_doc_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(12, 4) NOT NULL DEFAULT 0,
    unit_price NUMERIC(12, 4) NOT NULL CHECK (unit_price >= 0),
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 4) NOT NULL DEFAULT 0,
    iva_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    subtotal NUMERIC(12, 4) NOT NULL,
    iva_amount NUMERIC(12, 4) NOT NULL,
    total NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Facturación Electrónica SRI Ecuador & Documentos Internos
CREATE TABLE IF NOT EXISTS electronic_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type sri_doc_type NOT NULL DEFAULT 'factura',
    environment VARCHAR(10) NOT NULL DEFAULT '1', -- 1: Pruebas, 2: Producción
    emission_type VARCHAR(10) NOT NULL DEFAULT '1', -- 1: Normal
    establishment VARCHAR(3) NOT NULL DEFAULT '001',
    emission_point VARCHAR(3) NOT NULL DEFAULT '001',
    sequential VARCHAR(9) NOT NULL,
    access_key VARCHAR(49) UNIQUE,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL,
    status sri_auth_status NOT NULL DEFAULT 'pendiente',
    authorization_number VARCHAR(49),
    authorized_at TIMESTAMPTZ,
    xml_content TEXT,
    sri_response_xml TEXT,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    ride_pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_type VARCHAR(50) NOT NULL, -- nota_entrega, comprobante_interno, acta_devolucion
    reference_id UUID,
    issued_by UUID NOT NULL REFERENCES profiles(id),
    recipient_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Órdenes de Compra y Recepción
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    approved_by UUID REFERENCES profiles(id),
    status VARCHAR(50) NOT NULL DEFAULT 'borrador', -- borrador, aprobada, enviada, recepcion_parcial, completada, cancelada
    expected_date DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    supplier_invoice_ref VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity_ordered NUMERIC(12, 2) NOT NULL CHECK (quantity_ordered > 0),
    quantity_received NUMERIC(12, 2) NOT NULL DEFAULT 0,
    unit_cost NUMERIC(12, 4) NOT NULL CHECK (unit_cost >= 0),
    total_cost NUMERIC(12, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Centro de Correos Electrónicos
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    related_doc_type VARCHAR(50),
    related_doc_id VARCHAR(100),
    status email_status NOT NULL DEFAULT 'pendiente',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. Motor de Automatizaciones y Notificaciones
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    event_trigger VARCHAR(100) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    action_type VARCHAR(100) NOT NULL,
    action_payload JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, warning, danger, success
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Bitácora de Auditoría Inmutable
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    reason TEXT,
    previous_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. Configuración General del Sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. Índices de Alto Desempeño
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_prod ON inventory_movements(product_id, movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_visits_supplier ON supplier_visits(supplier_id, check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_incidents_status ON supplier_incidents(status);
CREATE INDEX IF NOT EXISTS idx_supplier_replacements_status ON supplier_replacements(status, expected_delivery_date);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_electronic_docs_access_key ON electronic_documents(access_key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module, created_at DESC);

-- 26. Habilitación de Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_visit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS Base (Permiten operaciones autenticadas según rol)
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Products viewable by authenticated users" ON products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Products modifiable by staff" ON products
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('administrador', 'gerente', 'encargado_inventario')
        )
    );

CREATE POLICY "Supplier visits accessible by authenticated" ON supplier_visits
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Inventory movements readable by staff" ON inventory_movements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sales readable by authenticated" ON sales
    FOR ALL TO authenticated USING (true);
