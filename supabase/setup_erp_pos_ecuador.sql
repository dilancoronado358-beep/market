-- ==============================================================================
-- ERP / POS ECUADOR — SCRIPT SQL MAESTRO DE CONFIGURACIÓN TOTAL PARA SUPABASE
-- Proyecto: https://lyoxpekdnrurlvcisbhe.supabase.co
-- Genera todas las tablas, tipos, disparadores (triggers), políticas RLS e
-- inicialización limpia en 0 lista para operar.
-- ==============================================================================

-- 1. Extensiones requeridas
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
    name VARCHAR(255) NOT NULL DEFAULT 'ERP / POS Ecuador',
    trade_name VARCHAR(255) NOT NULL DEFAULT 'ERP / POS Ecuador',
    ruc VARCHAR(13) NOT NULL DEFAULT '1790012345001',
    address TEXT NOT NULL DEFAULT 'Quito, Ecuador',
    phone VARCHAR(50) DEFAULT '+593 2 254-8900',
    email VARCHAR(255) DEFAULT 'administracion@erpposecuador.com',
    logo_url TEXT DEFAULT 'https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png',
    is_active BOOLEAN NOT NULL DEFAULT true,
    establishment_code VARCHAR(3) NOT NULL DEFAULT '001',
    emission_point_code VARCHAR(3) NOT NULL DEFAULT '001',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Parámetros del Sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL DEFAULT 'ERP / POS Ecuador',
    trade_name VARCHAR(255) NOT NULL DEFAULT 'ERP / POS Ecuador',
    ruc VARCHAR(13) NOT NULL DEFAULT '1790012345001',
    address TEXT NOT NULL DEFAULT 'Quito, Ecuador',
    phone VARCHAR(50) DEFAULT '+593 2 254-8900',
    email VARCHAR(255) DEFAULT 'administracion@erpposecuador.com',
    establishment_code VARCHAR(3) NOT NULL DEFAULT '001',
    emission_point_code VARCHAR(3) NOT NULL DEFAULT '001',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    default_iva_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    sri_environment VARCHAR(2) NOT NULL DEFAULT '1',
    allow_negative_stock BOOLEAN NOT NULL DEFAULT false,
    require_supervisor_for_discount BOOLEAN NOT NULL DEFAULT true,
    max_cashier_discount NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    logo_url TEXT DEFAULT 'https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Perfiles de Usuario
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    address TEXT,
    city VARCHAR(100) DEFAULT 'Quito',
    phone VARCHAR(50),
    email VARCHAR(255),
    payment_terms_days INTEGER NOT NULL DEFAULT 15,
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Contactos de Proveedores
CREATE TABLE IF NOT EXISTS supplier_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role_description VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Catálogo de Productos
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internal_code VARCHAR(50) NOT NULL UNIQUE,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    model_presentation VARCHAR(100),
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unidad',
    unit_purchase VARCHAR(50) DEFAULT 'caja',
    unit_conversion_ratio NUMERIC(10, 4) NOT NULL DEFAULT 1.0000,
    cost_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    avg_cost NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    sale_price NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
    wholesale_price NUMERIC(12, 4) DEFAULT 0.0000,
    iva_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    min_stock NUMERIC(12, 2) NOT NULL DEFAULT 5.00,
    max_stock NUMERIC(12, 2) DEFAULT 100.00,
    current_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reserved_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quarantine_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(100),
    main_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. MÓDULO PRIORITARIO: Visitas de Proveedores (Expediente Digital)
CREATE TABLE IF NOT EXISTS supplier_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    sales_rep_name VARCHAR(255) NOT NULL,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    received_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    received_by_name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL DEFAULT 'Entrega y reposición de mercadería',
    invoice_number VARCHAR(100),
    status visit_status NOT NULL DEFAULT 'en_curso',
    notes TEXT,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Líneas de Recepción en Visita
CREATE TABLE IF NOT EXISTS supplier_visit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID NOT NULL REFERENCES supplier_visits(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    declared_qty NUMERIC(12, 2) NOT NULL,
    physical_qty NUMERIC(12, 2) NOT NULL,
    accepted_qty NUMERIC(12, 2) NOT NULL,
    rejected_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(12, 4) NOT NULL,
    batch_number VARCHAR(100),
    expiration_date DATE,
    status visit_item_status NOT NULL DEFAULT 'recibido_conforme',
    difference_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Incidencias de Proveedores (Productos Dañados)
CREATE TABLE IF NOT EXISTS supplier_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES supplier_visits(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    affected_qty NUMERIC(12, 2) NOT NULL,
    detection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reported_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    batch_number VARCHAR(100),
    reason VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    estimated_loss NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    physical_location VARCHAR(100) DEFAULT 'Área de Mermas / Cuarentena',
    status incident_status NOT NULL DEFAULT 'reportado',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Retiros Físicos de Mercadería por Proveedor
CREATE TABLE IF NOT EXISTS supplier_returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_number VARCHAR(50) NOT NULL UNIQUE,
    visit_id UUID REFERENCES supplier_visits(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    authorization_code VARCHAR(100),
    responsible_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status return_status NOT NULL DEFAULT 'retirado_confirmado',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Cambios de Mercadería Mano a Mano
CREATE TABLE IF NOT EXISTS supplier_exchanges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exchange_number VARCHAR(50) NOT NULL UNIQUE,
    visit_id UUID REFERENCES supplier_visits(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    delivered_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    delivered_product_name VARCHAR(255) NOT NULL,
    delivered_qty NUMERIC(12, 2) NOT NULL,
    delivered_unit_cost NUMERIC(12, 4) NOT NULL,
    received_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    received_product_name VARCHAR(255) NOT NULL,
    received_qty NUMERIC(12, 2) NOT NULL,
    received_unit_cost NUMERIC(12, 4) NOT NULL,
    cost_difference NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reason TEXT NOT NULL,
    responsible_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'completado',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Compromisos de Reposición Pendientes (SLA)
CREATE TABLE IF NOT EXISTS supplier_replacements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    replacement_number VARCHAR(50) NOT NULL UNIQUE,
    origin_incident_id UUID REFERENCES supplier_incidents(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    affected_qty NUMERIC(12, 2) NOT NULL,
    agreed_qty NUMERIC(12, 2) NOT NULL,
    delivered_qty NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commitment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE NOT NULL,
    status replacement_status NOT NULL DEFAULT 'pendiente_entrega',
    responsible_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Kardex Inmutable de Inventario
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_number VARCHAR(50) NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    movement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    movement_type movement_type NOT NULL,
    quantity_in NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    quantity_out NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    unit_cost NUMERIC(12, 4) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    doc_type VARCHAR(100),
    doc_id VARCHAR(100),
    doc_number VARCHAR(100),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    reason TEXT NOT NULL,
    is_reversal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Clientes
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identification_type VARCHAR(10) NOT NULL DEFAULT '05', -- 04: RUC, 05: Cédula, 07: Consumidor Final
    identification_number VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Sesiones y Turnos de Caja (Arqueo Ciego)
CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_number VARCHAR(50) NOT NULL UNIQUE,
    cashier_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    cashier_name VARCHAR(255) NOT NULL,
    register_code VARCHAR(20) NOT NULL DEFAULT 'CAJA-01',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opening_float NUMERIC(12, 2) NOT NULL DEFAULT 50.00,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 50.00,
    actual_counted_cash NUMERIC(12, 2),
    cash_difference NUMERIC(12, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'abierta',
    notes TEXT,
    supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Movimientos de Caja Chica
CREATE TABLE IF NOT EXISTS cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'ingreso' o 'egreso'
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Ventas en Punto de Venta (POS)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_id_number VARCHAR(20) NOT NULL,
    cashier_user_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    cashier_name VARCHAR(255) NOT NULL,
    cash_session_id UUID REFERENCES cash_sessions(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal_iva_0 NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    subtotal_iva_15 NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    change_given NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'completada',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Líneas de Venta
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 4) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    iva_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    subtotal NUMERIC(12, 2) NOT NULL,
    total NUMERIC(12, 2) NOT NULL
);

-- 22. Facturación Electrónica SRI (Ecuador)
CREATE TABLE IF NOT EXISTS electronic_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type sri_doc_type NOT NULL DEFAULT 'factura',
    document_number VARCHAR(50) NOT NULL UNIQUE,
    access_key VARCHAR(49) NOT NULL UNIQUE,
    authorization_number VARCHAR(49),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_id_number VARCHAR(20) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    xml_content TEXT NOT NULL,
    status sri_auth_status NOT NULL DEFAULT 'generado',
    environment VARCHAR(2) NOT NULL DEFAULT '1',
    authorized_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Documentos Internos de Control
CREATE TABLE IF NOT EXISTS internal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_number VARCHAR(50) NOT NULL UNIQUE,
    doc_type VARCHAR(100) NOT NULL,
    reference_id VARCHAR(100),
    issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    issuer_name VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. Órdenes de Compra
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente',
    expected_date DATE,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    items JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. Cola de Correos Electrónicos
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    related_doc_type VARCHAR(100),
    related_doc_id VARCHAR(100),
    status email_status NOT NULL DEFAULT 'pendiente',
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    sent_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. Reglas de Automatización
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    event_trigger VARCHAR(100) NOT NULL,
    condition_description TEXT NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered_at TIMESTAMPTZ
);

-- 27. Notificaciones del Sistema
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    related_module VARCHAR(100),
    related_id VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 28. Bitácora Inmutable de Auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    previous_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 29. Índices de Alto Desempeño
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_prod ON inventory_movements(product_id, movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_visits_supplier ON supplier_visits(supplier_id, check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_electronic_docs_key ON electronic_documents(access_key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 30. Habilitación de Row Level Security (RLS) con Políticas Permisivas para App
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_visit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_replacements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para acceso total autenticado y con clave pública de aplicación
CREATE POLICY "Public & Auth Full Access Stores" ON stores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Settings" ON system_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Profiles" ON profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Categories" ON product_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Suppliers" ON suppliers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Contacts" ON supplier_contacts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Visits" ON supplier_visits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access VisitItems" ON supplier_visit_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Incidents" ON supplier_incidents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Returns" ON supplier_returns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Exchanges" ON supplier_exchanges FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Replacements" ON supplier_replacements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Movements" ON inventory_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Customers" ON customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access CashSessions" ON cash_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access CashMovements" ON cash_movements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Sales" ON sales FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access SaleItems" ON sale_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access ElectronicDocs" ON electronic_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access InternalDocs" ON internal_documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access PurchaseOrders" ON purchase_orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access EmailQueue" ON email_queue FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access AutomationRules" ON automation_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access Notifications" ON notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public & Auth Full Access AuditLogs" ON audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 31. INICIALIZACIÓN LIMPIA EN CERO ("EN 0")
-- Inserción de la tienda principal y parámetros por defecto
INSERT INTO stores (id, code, name, trade_name, ruc, address, phone, email, logo_url)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'MATRIZ-001',
    'ERP / POS Ecuador',
    'ERP / POS Ecuador',
    '1790012345001',
    'Av. Amazonas N24-196 y Luis Cordero, Quito, Ecuador',
    '+593 2 254-8900',
    'administracion@erpposecuador.com',
    'https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png'
) ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    trade_name = EXCLUDED.trade_name,
    logo_url = EXCLUDED.logo_url;

INSERT INTO system_settings (id, store_id, store_name, trade_name, ruc, address, phone, email, logo_url)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'ERP / POS Ecuador',
    'ERP / POS Ecuador',
    '1790012345001',
    'Av. Amazonas N24-196 y Luis Cordero, Quito, Ecuador',
    '+593 2 254-8900',
    'administracion@erpposecuador.com',
    'https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png'
) ON CONFLICT (id) DO UPDATE SET
    store_name = EXCLUDED.store_name,
    trade_name = EXCLUDED.trade_name,
    logo_url = EXCLUDED.logo_url;

-- Categorías estándar base
INSERT INTO product_categories (id, name, description) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Abarrotes y Alimentos', 'Víveres, aceites, granos y no perecibles'),
    ('c0000000-0000-0000-0000-000000000002', 'Bebidas y Refrescos', 'Gaseosas, aguas minerales y jugos'),
    ('c0000000-0000-0000-0000-000000000003', 'Lácteos y Huevos', 'Leche, quesos, yogures y derivados'),
    ('c0000000-0000-0000-0000-000000000004', 'Limpieza y Desinfección', 'Detergentes, jabones y desinfectantes'),
    ('c0000000-0000-0000-0000-000000000005', 'Snacks y Confitería', 'Galletas, papas fritas y chocolates')
ON CONFLICT (id) DO NOTHING;

-- Usuario administrador inicial
INSERT INTO profiles (id, email, full_name, role, is_active, phone)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'admin@erpposecuador.com',
    'Administrador Principal',
    'administrador',
    true,
    '0991234567'
) ON CONFLICT (email) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;

-- Cliente base: Consumidor Final (Ecuador)
INSERT INTO customers (id, identification_type, identification_number, full_name, address)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    '07',
    '9999999999999',
    'CONSUMIDOR FINAL',
    'Ecuador'
) ON CONFLICT (identification_number) DO NOTHING;

-- 32. SINCRONIZACIÓN AUTOMÁTICA DE USUARIOS DESDE SUPABASE AUTH (auth.users -> public.profiles)
-- Garantiza que cualquier usuario creado desde el Dashboard de Supabase (Authentication > Users)
-- o por invitación tenga inmediatamente su perfil activo en public.profiles y pueda operar en el ERP.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        phone,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'administrador'::user_role),
        true,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        id = EXCLUDED.id,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
