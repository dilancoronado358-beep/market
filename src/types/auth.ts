import { UserRole } from './database';

export type PermissionKey =
  | 'view_dashboard'
  | 'view_products'
  | 'manage_products'
  | 'change_prices'
  | 'modify_costs'
  | 'view_inventory'
  | 'adjust_inventory'
  | 'view_suppliers'
  | 'manage_suppliers'
  | 'manage_visits'
  | 'confirm_receipts'
  | 'manage_incidents'
  | 'authorize_returns'
  | 'manage_replacements'
  | 'view_purchases'
  | 'manage_purchases'
  | 'approve_purchases'
  | 'pos_sales'
  | 'apply_discounts'
  | 'cancel_sales'
  | 'view_customers'
  | 'manage_customers'
  | 'view_cash'
  | 'operate_cash'
  | 'close_cash_register'
  | 'approve_cash_differences'
  | 'sri_invoicing'
  | 'view_internal_docs'
  | 'view_reports'
  | 'view_financial_reports'
  | 'export_data'
  | 'email_center'
  | 'automations'
  | 'access_audit_logs'
  | 'manage_users'
  | 'edit_permissions'
  | 'edit_tax_settings'
  | 'system_settings';

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  administrador: [
    'view_dashboard',
    'view_products',
    'manage_products',
    'change_prices',
    'modify_costs',
    'view_inventory',
    'adjust_inventory',
    'view_suppliers',
    'manage_suppliers',
    'manage_visits',
    'confirm_receipts',
    'manage_incidents',
    'authorize_returns',
    'manage_replacements',
    'view_purchases',
    'manage_purchases',
    'approve_purchases',
    'pos_sales',
    'apply_discounts',
    'cancel_sales',
    'view_customers',
    'manage_customers',
    'view_cash',
    'operate_cash',
    'close_cash_register',
    'approve_cash_differences',
    'sri_invoicing',
    'view_internal_docs',
    'view_reports',
    'view_financial_reports',
    'export_data',
    'email_center',
    'automations',
    'access_audit_logs',
    'manage_users',
    'edit_permissions',
    'edit_tax_settings',
    'system_settings',
  ],
  gerente: [
    'view_dashboard',
    'view_products',
    'manage_products',
    'change_prices',
    'modify_costs',
    'view_inventory',
    'adjust_inventory',
    'view_suppliers',
    'manage_suppliers',
    'manage_visits',
    'confirm_receipts',
    'manage_incidents',
    'authorize_returns',
    'manage_replacements',
    'view_purchases',
    'manage_purchases',
    'approve_purchases',
    'pos_sales',
    'apply_discounts',
    'cancel_sales',
    'view_customers',
    'manage_customers',
    'view_cash',
    'operate_cash',
    'close_cash_register',
    'approve_cash_differences',
    'sri_invoicing',
    'view_internal_docs',
    'view_reports',
    'view_financial_reports',
    'export_data',
    'email_center',
    'automations',
    'access_audit_logs',
  ],
  supervisor: [
    'view_dashboard',
    'view_products',
    'view_inventory',
    'adjust_inventory',
    'view_suppliers',
    'manage_visits',
    'confirm_receipts',
    'manage_incidents',
    'authorize_returns',
    'manage_replacements',
    'pos_sales',
    'apply_discounts',
    'cancel_sales',
    'view_customers',
    'view_cash',
    'close_cash_register',
    'approve_cash_differences',
    'view_reports',
    'view_internal_docs',
  ],
  cajero: [
    'view_dashboard',
    'view_products',
    'pos_sales',
    'view_customers',
    'manage_customers',
    'view_cash',
    'operate_cash',
    'view_internal_docs',
  ],
  encargado_inventario: [
    'view_dashboard',
    'view_products',
    'manage_products',
    'view_inventory',
    'adjust_inventory',
    'view_suppliers',
    'manage_visits',
    'confirm_receipts',
    'manage_incidents',
    'manage_replacements',
  ],
  responsable_compras: [
    'view_dashboard',
    'view_products',
    'view_inventory',
    'view_suppliers',
    'manage_suppliers',
    'manage_visits',
    'confirm_receipts',
    'view_purchases',
    'manage_purchases',
    'manage_replacements',
  ],
  auditor: [
    'view_dashboard',
    'view_products',
    'view_inventory',
    'view_suppliers',
    'view_purchases',
    'view_customers',
    'view_cash',
    'sri_invoicing',
    'view_internal_docs',
    'view_reports',
    'view_financial_reports',
    'export_data',
    'access_audit_logs',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador General',
  gerente: 'Gerente Comercial',
  supervisor: 'Supervisor de Operaciones',
  cajero: 'Cajero / Punto de Venta',
  encargado_inventario: 'Encargado de Inventario',
  responsable_compras: 'Responsable de Compras',
  auditor: 'Auditor y Control Interno',
};
