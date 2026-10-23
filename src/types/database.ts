// ==============================================================================
// TIPOS DE BASE DE DATOS Y ENTIDADES (TIENDA KATY - ECUADOR)
// ==============================================================================

export type UserRole = 
  | 'administrador'
  | 'gerente'
  | 'supervisor'
  | 'cajero'
  | 'encargado_inventario'
  | 'responsable_compras'
  | 'auditor';

export type VisitStatus = 
  | 'en_curso'
  | 'en_recepcion'
  | 'pendiente_inspeccion'
  | 'con_incidencias'
  | 'pendiente_retiro'
  | 'pendiente_reposicion'
  | 'finalizada'
  | 'anulada';

export type VisitItemStatus = 
  | 'recibido_conforme'
  | 'recibido_con_diferencias'
  | 'dañado'
  | 'pendiente_inspeccion'
  | 'rechazado'
  | 'pendiente_reposicion';

export type IncidentStatus = 
  | 'reportado'
  | 'en_revision'
  | 'segregado'
  | 'notificado_proveedor'
  | 'pendiente_retiro'
  | 'pendiente_reposicion'
  | 'reembolsado_compensado'
  | 'resuelto'
  | 'cerrado_sin_compensacion';

export type ReturnStatus = 
  | 'solicitud'
  | 'producto_segregado'
  | 'preparado_retiro'
  | 'retirado_confirmado'
  | 'aceptado_proveedor'
  | 'compensacion_pendiente';

export type ReplacementStatus = 
  | 'solicitada'
  | 'aprobada'
  | 'pendiente_entrega'
  | 'entrega_parcial'
  | 'completada'
  | 'rechazada'
  | 'cancelada';

export type MovementType = 
  | 'inventario_inicial'
  | 'compra_recibida'
  | 'venta'
  | 'devolucion_cliente'
  | 'devolucion_proveedor'
  | 'producto_cambiado'
  | 'reposicion'
  | 'producto_dañado'
  | 'producto_vencido'
  | 'ajuste_positivo'
  | 'ajuste_negativo'
  | 'perdida'
  | 'consumo_interno'
  | 'transferencia_bodegas'
  | 'reversion_autorizada';

export type SriDocType = 'factura' | 'nota_credito' | 'nota_debito' | 'guia_remision' | 'retencion';

export type SriAuthStatus = 
  | 'pendiente'
  | 'generado'
  | 'firmado'
  | 'enviado'
  | 'recibido'
  | 'autorizado'
  | 'rechazado'
  | 'no_autorizado';

export type EmailStatus = 'pendiente' | 'en_proceso' | 'enviado' | 'fallido' | 'cancelado';

export interface Store {
  id: string;
  code: string;
  name: string;
  trade_name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  establishment_code: string;
  emission_point_code: string;
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  store_id?: string;
  is_active: boolean;
  phone?: string;
  last_access?: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: string;
  ruc: string;
  business_name: string;
  trade_name?: string;
  address: string;
  city: string;
  phone?: string;
  email?: string;
  payment_terms_days: number;
  lead_time_days: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: string;
  internal_code: string;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  category_id?: string;
  brand?: string;
  unit_of_measure: string;
  unit_purchase: string;
  unit_conversion_ratio: number;
  cost_price: number;
  avg_cost: number;
  sale_price: number;
  wholesale_price?: number;
  iva_rate: number; // e.g. 15.00
  min_stock: number;
  max_stock: number;
  current_stock: number;
  reserved_stock: number;
  quarantine_stock: number;
  location?: string;
  main_supplier_id?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierVisit {
  id: string;
  visit_number: string;
  supplier_id: string;
  sales_rep_name: string;
  check_in_time: string;
  check_out_time?: string;
  receiver_user_id: string;
  reason: string;
  invoice_or_doc_ref?: string;
  status: VisitStatus;
  notes?: string;
  has_incidents: boolean;
  has_replacements_pending: boolean;
  acta_generated_at?: string;
  acta_pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierVisitItem {
  id: string;
  visit_id: string;
  product_id: string;
  product_name?: string;
  declared_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  unit: string;
  unit_cost: number;
  lot_number?: string;
  expiration_date?: string;
  status: VisitItemStatus;
  difference_reason?: string;
  is_new_product: boolean;
  notes?: string;
  created_at: string;
}

export interface SupplierIncident {
  id: string;
  incident_number: string;
  visit_id?: string;
  supplier_id: string;
  product_id: string;
  product_name?: string;
  affected_qty: number;
  lot_number?: string;
  reported_by: string;
  reported_at: string;
  damage_reason: string;
  photo_urls: string[];
  estimated_value: number;
  physical_location: string;
  status: IncidentStatus;
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface SupplierReturn {
  id: string;
  return_number: string;
  visit_id?: string;
  supplier_id: string;
  created_by: string;
  status: ReturnStatus;
  authorized_by?: string;
  physical_departure_at?: string;
  carrier_or_rep_name?: string;
  document_ref?: string;
  notes?: string;
  created_at: string;
  items: SupplierReturnItem[];
}

export interface SupplierReturnItem {
  id: string;
  return_id: string;
  product_id: string;
  product_name?: string;
  incident_id?: string;
  quantity: number;
  reason: string;
  unit_cost: number;
  photo_urls?: string[];
  created_at: string;
}

export interface SupplierExchange {
  id: string;
  exchange_number: string;
  visit_id?: string;
  supplier_id: string;
  processed_by: string;
  status: string;
  price_difference: number;
  treatment_of_difference?: string;
  doc_ref?: string;
  notes?: string;
  created_at: string;
  items: SupplierExchangeItem[];
}

export interface SupplierExchangeItem {
  id: string;
  exchange_id: string;
  original_product_id: string;
  original_product_name?: string;
  original_qty: number;
  original_cost: number;
  replacement_product_id: string;
  replacement_product_name?: string;
  replacement_qty: number;
  replacement_cost: number;
  reason: string;
  created_at: string;
}

export interface SupplierReplacement {
  id: string;
  replacement_number: string;
  origin_visit_id?: string;
  origin_incident_id?: string;
  supplier_id: string;
  product_id: string;
  product_name?: string;
  affected_qty: number;
  agreed_qty: number;
  delivered_qty: number;
  commitment_date: string;
  expected_delivery_date: string;
  status: ReplacementStatus;
  responsible_user_id: string;
  fulfilled_at?: string;
  notes?: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  movement_number: string;
  product_id: string;
  product_name?: string;
  movement_date: string;
  movement_type: MovementType;
  quantity_in: number;
  quantity_out: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_cost: number;
  doc_type?: string;
  doc_id?: string;
  doc_number?: string;
  supplier_id?: string;
  customer_id?: string;
  user_id: string;
  user_name?: string;
  reason: string;
  notes?: string;
  is_reversal: boolean;
  reversal_of_id?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  identification_type: 'cedula' | 'ruc' | 'pasaporte' | 'consumidor_final';
  identification_number: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  is_active: boolean;
  total_purchases_count: number;
  total_spent: number;
  created_at: string;
}

export interface CashSession {
  id: string;
  session_number: string;
  cash_register_id: string;
  user_id: string;
  user_name?: string;
  opened_at: string;
  closed_at?: string;
  opening_float: number;
  cash_sales_total: number;
  card_sales_total: number;
  transfer_sales_total: number;
  credit_sales_total: number;
  inflows_total: number;
  outflows_total: number;
  expected_cash: number;
  actual_counted_cash?: number;
  difference?: number;
  status: 'abierta' | 'cerrada' | 'auditada';
  supervisor_id?: string;
  notes?: string;
  created_at: string;
}

export interface CashMovement {
  id: string;
  session_id: string;
  movement_type: 'ingreso' | 'egreso' | 'retiro_parcial';
  amount: number;
  reason: string;
  authorized_by?: string;
  receipt_doc_ref?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  sale_number: string;
  session_id?: string;
  customer_id: string;
  customer_name?: string;
  customer_id_number?: string;
  seller_user_id: string;
  seller_name?: string;
  subtotal_0: number;
  subtotal_iva: number;
  iva_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'completada' | 'anulada';
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
  amount_paid: number;
  change_given: number;
  internal_doc_number?: string;
  sri_doc_number?: string;
  notes?: string;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_barcode?: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  iva_rate: number;
  subtotal: number;
  iva_amount: number;
  total: number;
  created_at: string;
}

export interface ElectronicDocument {
  id: string;
  doc_type: SriDocType;
  environment: '1' | '2';
  emission_type: '1';
  establishment: string;
  emission_point: string;
  sequential: string;
  access_key: string;
  sale_id?: string;
  customer_id: string;
  customer_name?: string;
  total_amount: number;
  status: SriAuthStatus;
  authorization_number?: string;
  authorized_at?: string;
  xml_content?: string;
  sri_response_xml?: string;
  error_message?: string;
  retry_count: number;
  ride_pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InternalDocument {
  id: string;
  doc_number: string;
  doc_type: 'comprobante_venta_interno' | 'nota_entrega' | 'acta_devolucion' | 'control_inventario';
  reference_id?: string;
  issued_by: string;
  issuer_name?: string;
  recipient_name: string;
  total_amount: number;
  details: Record<string, any>;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name?: string;
  created_by: string;
  approved_by?: string;
  status: 'borrador' | 'aprobada' | 'enviada' | 'recepcion_parcial' | 'completada' | 'cancelada';
  expected_date?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  supplier_invoice_ref?: string;
  notes?: string;
  created_at: string;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name?: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
  created_at: string;
}

export interface EmailQueueItem {
  id: string;
  recipient: string;
  subject: string;
  body_html: string;
  template_type: string;
  related_doc_type?: string;
  related_doc_id?: string;
  status: EmailStatus;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  sent_at?: string;
  created_at: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  event_trigger: string;
  conditions: Record<string, any>;
  action_type: string;
  action_payload: Record<string, any>;
  is_active: boolean;
  last_triggered_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  module: string;
  record_id?: string;
  reason?: string;
  previous_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface SystemSettings {
  store_name: string;
  trade_name: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  establishment_code: string;
  emission_point_code: string;
  currency: string;
  default_iva_rate: number;
  sri_environment: '1' | '2';
  allow_negative_stock: boolean;
  require_supervisor_for_discount: boolean;
  max_cashier_discount: number;
  logo_url?: string;
}
