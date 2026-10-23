// ==============================================================================
// MOTOR DE PERSISTENCIA Y ESTADO RELACIONAL TRANSACCIONAL (ERP / POS ECUADOR)
// Conexión directa a Supabase PostgreSQL y Kardex inmutable
// ==============================================================================

import {
  Product,
  ProductCategory,
  Supplier,
  SupplierVisit,
  SupplierVisitItem,
  SupplierIncident,
  SupplierReturn,
  SupplierExchange,
  SupplierReplacement,
  InventoryMovement,
  Customer,
  CashSession,
  CashMovement,
  Sale,
  SaleItem,
  ElectronicDocument,
  InternalDocument,
  PurchaseOrder,
  EmailQueueItem,
  AutomationRule,
  Notification,
  AuditLog,
  SystemSettings,
  UserProfile,
  UserRole,
} from '../types/database';
import { supabase, isSupabaseConfigured } from './supabase';

// Clave de almacenamiento local seguro para persistencia entre recargas
const STORAGE_KEY = 'erp_pos_ecuador_db_v1';

export interface DatabaseSnapshot {
  settings: SystemSettings;
  profiles: UserProfile[];
  categories: ProductCategory[];
  suppliers: Supplier[];
  products: Product[];
  visits: SupplierVisit[];
  visitItems: SupplierVisitItem[];
  incidents: SupplierIncident[];
  returns: SupplierReturn[];
  exchanges: SupplierExchange[];
  replacements: SupplierReplacement[];
  movements: InventoryMovement[];
  customers: Customer[];
  cashSessions: CashSession[];
  cashMovements: CashMovement[];
  sales: Sale[];
  saleItems: SaleItem[];
  electronicDocs: ElectronicDocument[];
  internalDocs: InternalDocument[];
  purchaseOrders: PurchaseOrder[];
  emailQueue: EmailQueueItem[];
  automations: AutomationRule[];
  notifications: Notification[];
  auditLogs: AuditLog[];
}

// Estado inicial limpio en Cero ("EN 0") — Preparado para Supabase
export const cleanZeroData: DatabaseSnapshot = {
  settings: {
    store_name: 'ERP / POS Ecuador',
    trade_name: 'ERP / POS ECUADOR',
    ruc: '1790012345001',
    address: 'Av. Amazonas N24-196 y Luis Cordero, Quito, Ecuador',
    phone: '+593 2 254-8900',
    email: 'administracion@erpposecuador.com',
    establishment_code: '001',
    emission_point_code: '001',
    currency: 'USD',
    default_iva_rate: 15.00,
    sri_environment: '1',
    allow_negative_stock: false,
    require_supervisor_for_discount: true,
    max_cashier_discount: 5.0,
    logo_url: 'https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png',
  },
  profiles: [
    {
      id: 'usr-admin-1',
      email: 'admin@erpposecuador.com',
      full_name: 'Administrador Principal',
      role: 'administrador',
      is_active: true,
      phone: '0991234567',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-gerente-1',
      email: 'gerencia@erpposecuador.com',
      full_name: 'Gerencia General',
      role: 'gerente',
      is_active: true,
      phone: '0997654321',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-super-1',
      email: 'supervisor@erpposecuador.com',
      full_name: 'Supervisor de Operaciones',
      role: 'supervisor',
      is_active: true,
      phone: '0988776655',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-cajero-1',
      email: 'cajero@erpposecuador.com',
      full_name: 'Cajero Principal',
      role: 'cajero',
      is_active: true,
      phone: '0977112233',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-inventario-1',
      email: 'bodega@erpposecuador.com',
      full_name: 'Encargado de Inventario',
      role: 'encargado_inventario',
      is_active: true,
      phone: '0966554433',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-compras-1',
      email: 'compras@erpposecuador.com',
      full_name: 'Responsable de Compras',
      role: 'responsable_compras',
      is_active: true,
      phone: '0955443322',
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr-auditor-1',
      email: 'auditor@erpposecuador.com',
      full_name: 'Auditor Financiero',
      role: 'auditor',
      is_active: true,
      phone: '0944332211',
      created_at: new Date().toISOString(),
    },
  ],
  categories: [
    { id: 'cat-1', name: 'Abarrotes y Alimentos', description: 'Víveres, aceites, granos y no perecibles', is_active: true, created_at: new Date().toISOString() },
    { id: 'cat-2', name: 'Bebidas y Refrescos', description: 'Gaseosas, aguas minerales y jugos', is_active: true, created_at: new Date().toISOString() },
    { id: 'cat-3', name: 'Lácteos y Huevos', description: 'Leche, quesos, yogures y derivados', is_active: true, created_at: new Date().toISOString() },
    { id: 'cat-4', name: 'Limpieza y Desinfección', description: 'Detergentes, jabones y desinfectantes', is_active: true, created_at: new Date().toISOString() },
    { id: 'cat-5', name: 'Snacks y Confitería', description: 'Galletas, papas fritas y chocolates', is_active: true, created_at: new Date().toISOString() },
  ],
  suppliers: [],
  products: [],
  visits: [],
  visitItems: [],
  incidents: [],
  returns: [],
  exchanges: [],
  replacements: [],
  movements: [],
  customers: [
    {
      id: 'cust-cf',
      identification_type: 'consumidor_final',
      identification_number: '9999999999999',
      full_name: 'CONSUMIDOR FINAL',
      address: 'Ecuador',
      is_active: true,
      total_purchases_count: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    },
  ],
  cashSessions: [],
  cashMovements: [],
  sales: [],
  saleItems: [],
  electronicDocs: [],
  internalDocs: [],
  purchaseOrders: [],
  emailQueue: [],
  automations: [
    {
      id: 'aut-1',
      name: 'Alerta Automática de Stock Mínimo',
      event_trigger: 'movimiento_inventario',
      conditions: { min_stock_reached: true },
      action_type: 'notificacion_sistema',
      action_payload: { message: 'Stock crítico detectado' },
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'aut-2',
      name: 'Segregación Inmediata de Averías',
      event_trigger: 'reporte_incidencia_daño',
      conditions: { damage_reported: true },
      action_type: 'bloqueo_pos',
      action_payload: { quarantine: true },
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
  notifications: [],
  auditLogs: [],
};

export const initialData: DatabaseSnapshot = cleanZeroData;

// Clase que maneja el motor de base de datos
class DatabaseEngine {
  private data: DatabaseSnapshot;
  private listeners: (() => void)[] = [];

  constructor() {
    this.data = this.loadFromStorage();
    this.syncWithSupabase();
  }

  private loadFromStorage(): DatabaseSnapshot {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('tienda_katy_db_v1');
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.settings && parsed.categories && parsed.profiles) {
            parsed.profiles = parsed.profiles.filter((p: any) => !p.email.includes('tiendakaty.ec'));
            if (!parsed.profiles.some((p: any) => p.email === 'admin@erpposecuador.com')) {
              parsed.profiles.unshift(cleanZeroData.profiles[0]);
            }
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Error loading stored DB, falling back to clean zero data', e);
    }
    return JSON.parse(JSON.stringify(cleanZeroData));
  }

  public async syncWithSupabase() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const [
        { data: prods },
        { data: supps },
        { data: visits },
        { data: movs },
        { data: custs },
        { data: salesData },
        { data: settingsData },
        { data: profsData },
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('supplier_visits').select('*'),
        supabase.from('inventory_movements').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('system_settings').select('*').limit(1),
        supabase.from('profiles').select('*'),
      ]);

      let changed = false;
      if (prods && prods.length > 0) { this.data.products = prods; changed = true; }
      if (supps && supps.length > 0) { this.data.suppliers = supps; changed = true; }
      if (visits && visits.length > 0) { this.data.visits = visits; changed = true; }
      if (movs && movs.length > 0) { this.data.movements = movs; changed = true; }
      if (custs && custs.length > 0) { this.data.customers = custs; changed = true; }
      if (salesData && salesData.length > 0) { this.data.sales = salesData; changed = true; }
      if (settingsData && settingsData.length > 0) {
        this.data.settings = { ...this.data.settings, ...settingsData[0] };
        changed = true;
      }
      if (profsData && profsData.length > 0) {
        for (const p of profsData) {
          const idx = this.data.profiles.findIndex((x) => x.email.toLowerCase() === p.email?.toLowerCase());
          if (idx >= 0) {
            this.data.profiles[idx] = { ...this.data.profiles[idx], ...p };
          } else {
            this.data.profiles.push({
              id: p.id,
              email: p.email,
              full_name: p.full_name || p.email.split('@')[0],
              role: p.role || 'cajero',
              is_active: p.is_active ?? true,
              phone: p.phone || '',
              created_at: p.created_at || new Date().toISOString(),
            });
          }
        }
        changed = true;
      }
      if (changed) this.persist();
    } catch (err) {
      console.warn('Supabase sync notice:', err);
    }
  }

  public seedTestData() {
    if (this.data.products.length === 0) {
      this.data.products.push({
        id: 'prod-test-1',
        internal_code: 'ABR-001',
        name: 'Aceite Comestible 1L',
        category_id: 'cat-1',
        unit_of_measure: 'unidad',
        unit_purchase: 'unidad',
        unit_conversion_ratio: 1,
        cost_price: 2.10,
        avg_cost: 2.10,
        sale_price: 2.65,
        iva_rate: 15.00,
        min_stock: 5,
        max_stock: 50,
        current_stock: 20,
        reserved_stock: 0,
        quarantine_stock: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    if (this.data.suppliers.length === 0) {
      this.data.suppliers.push({
        id: 'sup-pronaca',
        ruc: '1790005527001',
        business_name: 'PRONACA C.A.',
        city: 'Quito',
        address: 'Quito, Ecuador',
        payment_terms_days: 15,
        lead_time_days: 2,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
    if (this.data.visits.length === 0) {
      this.data.visits.push({
        id: 'vis-101',
        visit_number: 'VIS-2026-0001',
        supplier_id: 'sup-pronaca',
        sales_rep_name: 'Carlos Ruiz',
        check_in_time: new Date().toISOString(),
        receiver_user_id: 'usr-inventario-1',
        reason: 'Entrega semanal',
        status: 'en_curso',
        has_incidents: false,
        has_replacements_pending: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    if (this.data.cashSessions.length === 0) {
      this.data.cashSessions.push({
        id: 'cs-1',
        session_number: 'CAJA-2026-0001',
        cash_register_id: 'reg-01',
        user_id: 'usr-cajero-1',
        user_name: 'Andrea Suárez',
        opened_at: new Date().toISOString(),
        opening_float: 50.00,
        cash_sales_total: 0,
        card_sales_total: 0,
        transfer_sales_total: 0,
        credit_sales_total: 0,
        inflows_total: 0,
        outflows_total: 0,
        expected_cash: 50.00,
        status: 'abierta',
        created_at: new Date().toISOString(),
      });
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Error persisting database state', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getSnapshot(): DatabaseSnapshot {
    return this.data;
  }

  public persistState() {
    this.persist();
  }

  public async createProfile(profileData: {
    full_name: string;
    email: string;
    role: UserRole;
    phone?: string;
    password?: string;
  }): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const emailClean = profileData.email.trim().toLowerCase();
    const existing = this.data.profiles.find((p) => p.email.toLowerCase() === emailClean);
    if (existing) {
      return { success: false, error: 'Ya existe un usuario con ese correo electrónico.' };
    }

    let assignedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;

    // Si Supabase está configurado, registrar en auth.users y en public.profiles
    if (isSupabaseConfigured && supabase) {
      try {
        if (profileData.password) {
          const { data: authData, error: authErr } = await supabase.auth.signUp({
            email: emailClean,
            password: profileData.password,
            options: {
              data: {
                full_name: profileData.full_name,
                role: profileData.role,
                phone: profileData.phone || '',
              },
            },
          });
          if (authErr && !authErr.message.includes('already registered')) {
            console.warn('Supabase signUp warning:', authErr.message);
          }
          if (authData?.user?.id) {
            assignedId = authData.user.id;
          }
        }

        // Insertar / Upsert en la tabla public.profiles de Supabase
        const { data: upsertData, error: upsertErr } = await supabase.from('profiles').upsert({
          id: assignedId,
          email: emailClean,
          full_name: profileData.full_name,
          role: profileData.role,
          phone: profileData.phone || '',
          is_active: true,
          updated_at: new Date().toISOString(),
        }).select().maybeSingle();

        if (upsertErr) {
          console.warn('Supabase profile upsert warning:', upsertErr);
        } else if (upsertData?.id) {
          assignedId = upsertData.id;
        }
      } catch (err: any) {
        console.warn('Supabase profile sync warning:', err);
      }
    }

    const newUser: UserProfile = {
      id: assignedId,
      email: emailClean,
      full_name: profileData.full_name,
      role: profileData.role,
      is_active: true,
      phone: profileData.phone || '',
      created_at: new Date().toISOString(),
    };

    this.data.profiles.push(newUser);
    this.persist();

    this.addAuditLog(
      'usr-admin',
      'Administrador',
      'CREACION_USUARIO',
      'Usuarios & Permisos',
      newUser.id,
      `Nuevo usuario creado: ${newUser.full_name} (${newUser.email}) con rol ${newUser.role}`
    );

    return { success: true, user: newUser };
  }

  public async updateProfileStatus(
    userId: string,
    isActive: boolean,
    adminUser?: { id: string; name: string }
  ): Promise<boolean> {
    const target = this.data.profiles.find((p) => p.id === userId);
    if (!target) return false;

    target.is_active = isActive;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('profiles')
          .update({ is_active: isActive, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch (e) {
        console.warn('Error updating profile status in Supabase:', e);
      }
    }

    this.persist();

    this.addAuditLog(
      adminUser?.id || 'usr-admin',
      adminUser?.name || 'Administrador',
      isActive ? 'ACTIVACION_USUARIO' : 'DESACTIVACION_USUARIO',
      'Usuarios & Permisos',
      userId,
      `Estado de cuenta de ${target.full_name} cambiado a ${isActive ? 'activo' : 'inactivo'}`
    );

    return true;
  }

  // --- REGLAS DE AUDITORÍA ---
  public addAuditLog(
    userId: string,
    userName: string,
    action: string,
    module: string,
    recordId?: string,
    reason?: string,
    prev?: any,
    next?: any
  ) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      user_name: userName,
      action,
      module,
      record_id: recordId,
      reason,
      previous_values: prev,
      new_values: next,
      ip_address: '192.168.1.X (Local Session)',
      created_at: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);
  }

  // --- PRODUCTOS Y KARDEX ATÓMICO ---
  public createProduct(
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'current_stock' | 'quarantine_stock' | 'reserved_stock'>,
    initialStock: number,
    userId: string,
    userName: string
  ): Product {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      current_stock: 0, // Se inicializa en 0 y se actualiza a través del Kardex
      reserved_stock: 0,
      quarantine_stock: 0,
      avg_cost: productData.cost_price,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.products.push(newProduct);

    // Si tiene stock inicial, registrar movimiento inmutable en Kardex
    if (initialStock > 0) {
      this.executeKardexMovement({
        productId: id,
        movementType: 'inventario_inicial',
        quantityIn: initialStock,
        quantityOut: 0,
        unitCost: productData.cost_price,
        docType: 'creacion_producto',
        docNumber: newProduct.internal_code,
        userId,
        userName,
        reason: 'Ingreso de saldo inicial en creación de catálogo',
      });
    }

    this.addAuditLog(userId, userName, 'CREACION_PRODUCTO', 'Catálogo Productos', newProduct.internal_code, 'Nuevo producto registrado', null, newProduct);
    this.persist();
    return this.data.products.find((p) => p.id === id)!;
  }

  public updateProduct(
    id: string,
    updates: Partial<Product>,
    userId: string,
    userName: string,
    auditReason: string
  ): Product {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');

    const previous = { ...this.data.products[idx] };
    const updated = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // No permitir modificar stock directamente fuera del Kardex
    updated.current_stock = previous.current_stock;
    updated.quarantine_stock = previous.quarantine_stock;

    this.data.products[idx] = updated;

    this.addAuditLog(userId, userName, 'ACTUALIZACION_PRODUCTO', 'Catálogo Productos', updated.internal_code, auditReason, previous, updated);
    this.persist();
    return updated;
  }

  // --- KARDEX INMUTABLE Y COSTO PROMEDIO PONDERADO ---
  public executeKardexMovement(params: {
    productId: string;
    movementType: import('../types/database').MovementType;
    quantityIn: number;
    quantityOut: number;
    unitCost: number;
    docType?: string;
    docId?: string;
    docNumber?: string;
    supplierId?: string;
    customerId?: string;
    userId: string;
    userName: string;
    reason: string;
    isReversal?: boolean;
    reversalOfId?: string;
  }): InventoryMovement {
    const product = this.data.products.find((p) => p.id === params.productId);
    if (!product) throw new Error(`Producto ${params.productId} no encontrado`);

    const prevStock = Number(product.current_stock || 0);
    const prevAvgCost = Number(product.avg_cost || product.cost_price || 0);
    let newStock = prevStock;
    let newAvgCost = prevAvgCost;

    if (params.quantityIn > 0) {
      newStock = prevStock + params.quantityIn;
      // Recalcular Costo Promedio Ponderado para compras o recepciones
      if (['inventario_inicial', 'compra_recibida', 'reposicion'].includes(params.movementType) && params.unitCost > 0) {
        if (newStock > 0) {
          newAvgCost = Number((((prevStock * prevAvgCost) + (params.quantityIn * params.unitCost)) / newStock).toFixed(4));
        } else {
          newAvgCost = params.unitCost;
        }
      }
    } else if (params.quantityOut > 0) {
      if (!this.data.settings.allow_negative_stock && prevStock < params.quantityOut) {
        throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${prevStock}, requerido: ${params.quantityOut}`);
      }
      newStock = prevStock - params.quantityOut;
    }

    // Actualizar producto
    product.current_stock = newStock;
    product.avg_cost = newAvgCost;
    product.updated_at = new Date().toISOString();

    const movementNumber = `MOV-${new Date().getFullYear()}-${String(this.data.movements.length + 1).padStart(4, '0')}`;
    const movement: InventoryMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      movement_number: movementNumber,
      product_id: product.id,
      product_name: product.name,
      movement_date: new Date().toISOString(),
      movement_type: params.movementType,
      quantity_in: params.quantityIn,
      quantity_out: params.quantityOut,
      previous_stock: prevStock,
      new_stock: newStock,
      unit_cost: params.unitCost || newAvgCost,
      total_cost: Number(((params.quantityIn + params.quantityOut) * (params.unitCost || newAvgCost)).toFixed(2)),
      doc_type: params.docType,
      doc_id: params.docId,
      doc_number: params.docNumber,
      supplier_id: params.supplierId,
      customer_id: params.customerId,
      user_id: params.userId,
      user_name: params.userName,
      reason: params.reason,
      is_reversal: Boolean(params.isReversal),
      reversal_of_id: params.reversalOfId,
      created_at: new Date().toISOString(),
    };

    this.data.movements.unshift(movement);

    // Verificar si el nuevo stock cae por debajo del mínimo para disparar alerta
    if (newStock <= product.min_stock) {
      this.triggerLowStockNotification(product);
    }

    return movement;
  }

  private triggerLowStockNotification(product: Product) {
    const existing = this.data.notifications.find(
      (n) => n.title.includes('Stock Crítico') && n.message.includes(product.name) && !n.is_read
    );
    if (!existing) {
      this.data.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: `Alerta: Stock Bajo en ${product.name}`,
        message: `El producto "${product.name}" tiene ${product.current_stock} ${product.unit_of_measure} (mínimo: ${product.min_stock}).`,
        type: 'warning',
        link_url: '/productos',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // --- MÓDULO PRIORITARIO: EXPEDIENTE DIGITAL DE VISITAS DE PROVEEDORES ---

  public createSupplierVisit(
    visitData: {
      supplier_id: string;
      sales_rep_name: string;
      reason: string;
      invoice_or_doc_ref?: string;
      notes?: string;
    },
    userId: string,
    userName: string
  ): SupplierVisit {
    const visitCount = this.data.visits.length + 1;
    const visitNumber = `VIS-${new Date().getFullYear()}-${String(visitCount).padStart(4, '0')}`;
    const newVisit: SupplierVisit = {
      id: `vis-${Date.now()}`,
      visit_number: visitNumber,
      supplier_id: visitData.supplier_id,
      sales_rep_name: visitData.sales_rep_name,
      check_in_time: new Date().toISOString(),
      receiver_user_id: userId,
      reason: visitData.reason,
      invoice_or_doc_ref: visitData.invoice_or_doc_ref,
      status: 'en_curso',
      notes: visitData.notes,
      has_incidents: false,
      has_replacements_pending: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.data.visits.unshift(newVisit);
    this.addAuditLog(userId, userName, 'REGISTRO_LLEGADA_VISITA', 'Visitas Proveedores', visitNumber, `Llegada de proveedor: ${newVisit.sales_rep_name}`, null, newVisit);
    this.persist();
    return newVisit;
  }

  public addVisitReceiptItem(
    visitId: string,
    itemData: {
      productId: string;
      declaredQty: number;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      unitCost: number;
      lotNumber?: string;
      expirationDate?: string;
      status: import('../types/database').VisitItemStatus;
      differenceReason?: string;
      isNewProduct?: boolean;
      notes?: string;
    },
    userId: string,
    userName: string
  ): SupplierVisitItem {
    const visit = this.data.visits.find((v) => v.id === visitId);
    if (!visit) throw new Error('Visita no encontrada');
    const product = this.data.products.find((p) => p.id === itemData.productId);
    if (!product) throw new Error('Producto no encontrado');

    const newItem: SupplierVisitItem = {
      id: `vi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      visit_id: visitId,
      product_id: itemData.productId,
      product_name: product.name,
      declared_qty: itemData.declaredQty,
      received_qty: itemData.receivedQty,
      accepted_qty: itemData.acceptedQty,
      rejected_qty: itemData.rejectedQty,
      unit: product.unit_of_measure,
      unit_cost: itemData.unitCost,
      lot_number: itemData.lotNumber,
      expiration_date: itemData.expirationDate,
      status: itemData.status,
      difference_reason: itemData.differenceReason,
      is_new_product: Boolean(itemData.isNewProduct),
      notes: itemData.notes,
      created_at: new Date().toISOString(),
    };

    this.data.visitItems.push(newItem);

    // 1. Ingresar cantidad aceptada al stock vendible mediante Kardex
    if (itemData.acceptedQty > 0) {
      this.executeKardexMovement({
        productId: product.id,
        movementType: 'compra_recibida',
        quantityIn: itemData.acceptedQty,
        quantityOut: 0,
        unitCost: itemData.unitCost,
        docType: 'visita_proveedor',
        docId: visit.id,
        docNumber: visit.visit_number,
        supplierId: visit.supplier_id,
        userId,
        userName,
        reason: `Recepción de mercadería en ${visit.visit_number} (${itemData.acceptedQty} ${product.unit_of_measure} aceptadas)`,
      });
    }

    // 2. Si hay productos rechazados o dañados, aislarlos a cuarentena o registrar incidencia
    if (itemData.rejectedQty > 0 && itemData.status === 'dañado') {
      product.quarantine_stock = (product.quarantine_stock || 0) + itemData.rejectedQty;
      visit.has_incidents = true;

      // Crear automáticamente incidencia por daño
      this.reportSupplierIncident({
        visit_id: visit.id,
        supplier_id: visit.supplier_id,
        product_id: product.id,
        affected_qty: itemData.rejectedQty,
        damage_reason: itemData.differenceReason || 'Producto recibido con daño físico de fábrica',
        estimated_value: Number((itemData.rejectedQty * itemData.unitCost).toFixed(2)),
        lot_number: itemData.lotNumber,
      }, userId, userName);
    }

    visit.status = visit.has_incidents ? 'con_incidencias' : 'en_recepcion';
    visit.updated_at = new Date().toISOString();

    this.addAuditLog(userId, userName, 'RECEPCION_LINEA_MERCADERIA', 'Visitas Proveedores', visit.visit_number, `Línea recibida: ${product.name}`, null, newItem);
    this.persist();
    return newItem;
  }

  // Creación rápida de producto nuevo desde la visita de proveedor sin perder contexto
  public createProductFromVisit(
    visitId: string,
    productData: {
      internal_code: string;
      barcode?: string;
      name: string;
      category_id?: string;
      brand?: string;
      unit_of_measure: string;
      cost_price: number;
      sale_price: number;
      iva_rate: number;
    },
    receiptData: {
      declaredQty: number;
      acceptedQty: number;
      rejectedQty: number;
      lotNumber?: string;
      expirationDate?: string;
      notes?: string;
    },
    userId: string,
    userName: string
  ) {
    const visit = this.data.visits.find((v) => v.id === visitId);
    if (!visit) throw new Error('Visita no encontrada');

    // Crear el producto en catálogo con stock 0 (se aumentará con la recepción de la visita)
    const product = this.createProduct({
      ...productData,
      main_supplier_id: visit.supplier_id,
      unit_purchase: productData.unit_of_measure,
      unit_conversion_ratio: 1,
      avg_cost: productData.cost_price,
      min_stock: 5,
      max_stock: 100,
      is_active: true,
    }, 0, userId, userName);

    // Agregar la línea de recepción a la visita
    this.addVisitReceiptItem(visitId, {
      productId: product.id,
      declaredQty: receiptData.declaredQty,
      receivedQty: receiptData.declaredQty,
      acceptedQty: receiptData.acceptedQty,
      rejectedQty: receiptData.rejectedQty,
      unitCost: productData.cost_price,
      lotNumber: receiptData.lotNumber,
      expirationDate: receiptData.expirationDate,
      status: receiptData.rejectedQty > 0 ? 'dañado' : 'recibido_conforme',
      isNewProduct: true,
      notes: receiptData.notes || 'Producto nuevo incorporado desde la visita',
    }, userId, userName);

    return product;
  }

  // Reportar incidencia / producto dañado
  public reportSupplierIncident(
    params: {
      visit_id?: string;
      supplier_id: string;
      product_id: string;
      affected_qty: number;
      lot_number?: string;
      damage_reason: string;
      estimated_value: number;
    },
    userId: string,
    userName: string
  ): SupplierIncident {
    const product = this.data.products.find((p) => p.id === params.product_id);
    const incidentCount = this.data.incidents.length + 1;
    const incidentNumber = `INC-${new Date().getFullYear()}-${String(incidentCount).padStart(4, '0')}`;

    const incident: SupplierIncident = {
      id: `inc-${Date.now()}`,
      incident_number: incidentNumber,
      visit_id: params.visit_id,
      supplier_id: params.supplier_id,
      product_id: params.product_id,
      product_name: product?.name || 'Producto',
      affected_qty: params.affected_qty,
      lot_number: params.lot_number,
      reported_by: userId,
      reported_at: new Date().toISOString(),
      damage_reason: params.damage_reason,
      photo_urls: [],
      estimated_value: params.estimated_value,
      physical_location: 'Área de Devoluciones / Cuarentena',
      status: 'reportado',
      created_at: new Date().toISOString(),
    };

    this.data.incidents.unshift(incident);

    // Registrar notificación interna
    this.data.notifications.unshift({
      id: `notif-${Date.now()}`,
      title: `Incidencia Registrada: ${incidentNumber}`,
      message: `Se reportaron ${params.affected_qty} unidades dañadas de "${product?.name}". Requiere seguimiento con proveedor.`,
      type: 'danger',
      link_url: '/visitas-proveedores',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    this.addAuditLog(userId, userName, 'REPORTE_INCIDENCIA_DAÑO', 'Visitas Proveedores', incidentNumber, params.damage_reason, null, incident);
    this.persist();
    return incident;
  }

  // Registro de mercadería que se lleva el proveedor (Retiros Físicos y Devoluciones)
  public registerSupplierReturn(
    params: {
      supplierId: string;
      visitId?: string;
      items: { productId: string; quantity: number; reason: string; incidentId?: string }[];
      carrierOrRepName?: string;
      documentRef?: string;
      notes?: string;
      confirmPhysicalExit: boolean; // Si es true, el producto ya cruzó la puerta
    },
    userId: string,
    userName: string
  ): SupplierReturn {
    const returnCount = this.data.returns.length + 1;
    const returnNumber = `DEV-${new Date().getFullYear()}-${String(returnCount).padStart(4, '0')}`;

    const returnRecord: SupplierReturn = {
      id: `ret-${Date.now()}`,
      return_number: returnNumber,
      visit_id: params.visitId,
      supplier_id: params.supplierId,
      created_by: userId,
      status: params.confirmPhysicalExit ? 'retirado_confirmado' : 'producto_segregado',
      authorized_by: userId,
      physical_departure_at: params.confirmPhysicalExit ? new Date().toISOString() : undefined,
      carrier_or_rep_name: params.carrierOrRepName,
      document_ref: params.documentRef,
      notes: params.notes,
      created_at: new Date().toISOString(),
      items: params.items.map((i) => {
        const prod = this.data.products.find((p) => p.id === i.productId);
        return {
          id: `ri-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          return_id: '',
          product_id: i.productId,
          product_name: prod?.name,
          incident_id: i.incidentId,
          quantity: i.quantity,
          reason: i.reason,
          unit_cost: prod?.cost_price || 0,
          created_at: new Date().toISOString(),
        };
      }),
    };

    this.data.returns.unshift(returnRecord);

    // Si se confirma el retiro físico, descontar del stock en cuarentena (o vendible) y registrar Kardex
    if (params.confirmPhysicalExit) {
      params.items.forEach((item) => {
        const prod = this.data.products.find((p) => p.id === item.productId);
        if (prod) {
          // Si estaba en cuarentena por daño, descontar de cuarentena
          if (prod.quarantine_stock >= item.quantity) {
            prod.quarantine_stock -= item.quantity;
          } else {
            // Descontar de stock regular con Kardex de devolución a proveedor
            this.executeKardexMovement({
              productId: prod.id,
              movementType: 'devolucion_proveedor',
              quantityIn: 0,
              quantityOut: item.quantity,
              unitCost: prod.cost_price,
              docType: 'devolucion_proveedor',
              docId: returnRecord.id,
              docNumber: returnRecord.return_number,
              supplierId: params.supplierId,
              userId,
              userName,
              reason: `Retiro físico confirmado por proveedor (${item.reason})`,
            });
          }
        }
      });
    }

    this.addAuditLog(userId, userName, 'RETIRO_MERCADERIA_PROVEEDOR', 'Visitas Proveedores', returnNumber, `Devolución ${returnNumber}: salida física ${params.confirmPhysicalExit ? 'confirmada' : 'preparada'}`, null, returnRecord);
    this.persist();
    return returnRecord;
  }

  // Intercambio mano a mano de productos (Cambios de mercadería dañada o vencida por nueva)
  public processSupplierExchange(
    params: {
      visitId?: string;
      supplierId: string;
      originalProductId: string;
      originalQty: number;
      replacementProductId: string;
      replacementQty: number;
      reason: string;
      notes?: string;
    },
    userId: string,
    userName: string
  ): SupplierExchange {
    const origProd = this.data.products.find((p) => p.id === params.originalProductId);
    const replProd = this.data.products.find((p) => p.id === params.replacementProductId);
    if (!origProd || !replProd) throw new Error('Producto original o de reemplazo no encontrado');

    const origTotal = params.originalQty * origProd.cost_price;
    const replTotal = params.replacementQty * replProd.cost_price;
    const priceDiff = Number((replTotal - origTotal).toFixed(2));

    const exchangeCount = this.data.exchanges.length + 1;
    const exchangeNumber = `CAM-${new Date().getFullYear()}-${String(exchangeCount).padStart(4, '0')}`;

    const exchange: SupplierExchange = {
      id: `exc-${Date.now()}`,
      exchange_number: exchangeNumber,
      visit_id: params.visitId,
      supplier_id: params.supplierId,
      processed_by: userId,
      status: 'completado',
      price_difference: priceDiff,
      treatment_of_difference: priceDiff === 0 ? 'Sin diferencia económica' : priceDiff > 0 ? 'A favor de proveedor' : 'A favor de tienda',
      notes: params.notes,
      created_at: new Date().toISOString(),
      items: [
        {
          id: `exci-${Date.now()}`,
          exchange_id: '',
          original_product_id: origProd.id,
          original_product_name: origProd.name,
          original_qty: params.originalQty,
          original_cost: origProd.cost_price,
          replacement_product_id: replProd.id,
          replacement_product_name: replProd.name,
          replacement_qty: params.replacementQty,
          replacement_cost: replProd.cost_price,
          reason: params.reason,
          created_at: new Date().toISOString(),
        },
      ],
    };

    this.data.exchanges.unshift(exchange);

    // Movimiento Kardex: Salida de original y entrada de reemplazo
    if (origProd.quarantine_stock >= params.originalQty) {
      origProd.quarantine_stock -= params.originalQty;
    } else {
      this.executeKardexMovement({
        productId: origProd.id,
        movementType: 'producto_cambiado',
        quantityIn: 0,
        quantityOut: params.originalQty,
        unitCost: origProd.cost_price,
        docType: 'cambio_producto',
        docNumber: exchangeNumber,
        supplierId: params.supplierId,
        userId,
        userName,
        reason: `Salida por cambio de mercadería con proveedor (${exchangeNumber})`,
      });
    }

    this.executeKardexMovement({
      productId: replProd.id,
      movementType: 'producto_cambiado',
      quantityIn: params.replacementQty,
      quantityOut: 0,
      unitCost: replProd.cost_price,
      docType: 'cambio_producto',
      docNumber: exchangeNumber,
      supplierId: params.supplierId,
      userId,
      userName,
      reason: `Ingreso de mercadería de reemplazo entregada por proveedor (${exchangeNumber})`,
    });

    this.addAuditLog(userId, userName, 'CAMBIO_MANO_A_MANO_PRODUCTO', 'Visitas Proveedores', exchangeNumber, `Cambio de ${params.originalQty}x ${origProd.name} por ${params.replacementQty}x ${replProd.name}`, null, exchange);
    this.persist();
    return exchange;
  }

  // Registro de compromiso de reposición pendiente
  public createSupplierReplacement(
    params: {
      originVisitId?: string;
      originIncidentId?: string;
      supplierId: string;
      productId: string;
      affectedQty: number;
      agreedQty: number;
      expectedDeliveryDate: string;
      notes?: string;
    },
    userId: string,
    userName: string
  ): SupplierReplacement {
    const product = this.data.products.find((p) => p.id === params.productId);
    const count = this.data.replacements.length + 1;
    const replacementNumber = `REP-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const replacement: SupplierReplacement = {
      id: `rep-${Date.now()}`,
      replacement_number: replacementNumber,
      origin_visit_id: params.originVisitId,
      origin_incident_id: params.originIncidentId,
      supplier_id: params.supplierId,
      product_id: params.productId,
      product_name: product?.name,
      affected_qty: params.affectedQty,
      agreed_qty: params.agreedQty,
      delivered_qty: 0,
      commitment_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: params.expectedDeliveryDate,
      status: 'pendiente_entrega',
      responsible_user_id: userId,
      notes: params.notes,
      created_at: new Date().toISOString(),
    };

    this.data.replacements.unshift(replacement);

    if (params.originVisitId) {
      const visit = this.data.visits.find((v) => v.id === params.originVisitId);
      if (visit) {
        visit.has_replacements_pending = true;
        visit.updated_at = new Date().toISOString();
      }
    }

    this.addAuditLog(userId, userName, 'COMPROMISO_REPOSICION_REGISTRADO', 'Visitas Proveedores', replacementNumber, `Compromiso de entrega de ${params.agreedQty} unidades para el ${params.expectedDeliveryDate}`, null, replacement);
    this.persist();
    return replacement;
  }

  // Cumplimiento de reposición pendiente
  public fulfillSupplierReplacement(
    replacementId: string,
    qtyDelivered: number,
    userId: string,
    userName: string
  ) {
    const rep = this.data.replacements.find((r) => r.id === replacementId);
    if (!rep) throw new Error('Compromiso de reposición no encontrado');

    rep.delivered_qty += qtyDelivered;
    if (rep.delivered_qty >= rep.agreed_qty) {
      rep.status = 'completada';
      rep.fulfilled_at = new Date().toISOString();
    } else {
      rep.status = 'entrega_parcial';
    }

    // Ingresar mercadería al inventario vendible
    const prod = this.data.products.find((p) => p.id === rep.product_id);
    if (prod) {
      this.executeKardexMovement({
        productId: prod.id,
        movementType: 'reposicion',
        quantityIn: qtyDelivered,
        quantityOut: 0,
        unitCost: prod.cost_price,
        docType: 'reposicion_proveedor',
        docId: rep.id,
        docNumber: rep.replacement_number,
        supplierId: rep.supplier_id,
        userId,
        userName,
        reason: `Recepción de reposición acordada (${rep.replacement_number})`,
      });
    }

    this.addAuditLog(userId, userName, 'REPOSICION_PROVEEDOR_RECIBIDA', 'Visitas Proveedores', rep.replacement_number, `Recibidas ${qtyDelivered} unidades de reposición`, null, rep);
    this.persist();
    return rep;
  }

  // Cierre de visita de proveedor y generación de acta
  public closeSupplierVisit(
    visitId: string,
    closingNotes: string,
    userId: string,
    userName: string
  ): SupplierVisit {
    const visit = this.data.visits.find((v) => v.id === visitId);
    if (!visit) throw new Error('Visita no encontrada');

    visit.check_out_time = new Date().toISOString();
    visit.status = 'finalizada';
    visit.notes = closingNotes ? `${visit.notes || ''}\n[Cierre]: ${closingNotes}`.trim() : visit.notes;
    visit.acta_generated_at = new Date().toISOString();
    visit.updated_at = new Date().toISOString();

    // Crear correo automático en cola con el acta de visita
    const supplier = this.data.suppliers.find((s) => s.id === visit.supplier_id);
    if (supplier?.email) {
      this.enqueueEmail(
        supplier.email,
        `Acta de Visita Finalizada - ${visit.visit_number} (TIENDA KATY)`,
        `<p>Estimados ${supplier.business_name}, se ha cerrado la visita ${visit.visit_number} con éxito. Adjuntamos el acta digital para sus registros.</p>`,
        'acta_visita',
        visit.id
      );
    }

    this.addAuditLog(userId, userName, 'CIERRE_VISITA_PROVEEDOR', 'Visitas Proveedores', visit.visit_number, `Cierre formal de visita con generación de acta`, null, visit);
    this.persist();
    return visit;
  }

  // --- PUNTO DE VENTA (POS) Y FACTURACIÓN ---

  public processSale(
    params: {
      customerId: string;
      sessionId?: string;
      items: { productId: string; quantity: number; discountPercent?: number }[];
      paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';
      amountPaid: number;
      notes?: string;
    },
    userId: string,
    userName: string
  ): Sale {
    const customer = this.data.customers.find((c) => c.id === params.customerId);
    if (!customer) throw new Error('Cliente no encontrado');

    // 1. Validar existencias de todos los productos en una sola pasada atómica
    for (const item of params.items) {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (!prod) throw new Error(`Producto ${item.productId} no existe`);
      if (!this.data.settings.allow_negative_stock && prod.current_stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}". Disponible: ${prod.current_stock}, Solicitado: ${item.quantity}`);
      }
    }

    // 2. Calcular importes y desglose de IVA (Ecuador: 0% e IVA vigente ej. 15%)
    let subtotal0 = 0;
    let subtotalIva = 0;
    let ivaAmount = 0;
    let totalDiscount = 0;

    const saleItems: SaleItem[] = [];
    const saleId = `sale-${Date.now()}`;
    const saleCount = this.data.sales.length + 1;
    const saleNumber = `VTA-${new Date().getFullYear()}-${String(saleCount).padStart(5, '0')}`;
    const internalDocNumber = `TKT-${this.data.settings.establishment_code}-${String(saleCount).padStart(6, '0')}`;

    for (const item of params.items) {
      const prod = this.data.products.find((p) => p.id === item.productId)!;
      const unitPrice = prod.sale_price;
      const discountPercent = item.discountPercent || 0;
      const itemSubtotalRaw = unitPrice * item.quantity;
      const itemDiscount = Number((itemSubtotalRaw * (discountPercent / 100)).toFixed(2));
      const itemNet = itemSubtotalRaw - itemDiscount;

      totalDiscount += itemDiscount;

      let itemIva = 0;
      if (prod.iva_rate > 0) {
        subtotalIva += itemNet;
        itemIva = Number((itemNet * (prod.iva_rate / 100)).toFixed(2));
        ivaAmount += itemIva;
      } else {
        subtotal0 += itemNet;
      }

      saleItems.push({
        id: `si-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sale_id: saleId,
        product_id: prod.id,
        product_name: prod.name,
        product_barcode: prod.barcode,
        quantity: item.quantity,
        unit_cost: prod.avg_cost || prod.cost_price,
        unit_price: unitPrice,
        discount_percent: discountPercent,
        discount_amount: itemDiscount,
        iva_rate: prod.iva_rate,
        subtotal: Number(itemNet.toFixed(2)),
        iva_amount: itemIva,
        total: Number((itemNet + itemIva).toFixed(2)),
        created_at: new Date().toISOString(),
      });
    }

    const totalAmount = Number((subtotal0 + subtotalIva + ivaAmount).toFixed(2));
    const changeGiven = params.paymentMethod === 'efectivo' ? Math.max(0, Number((params.amountPaid - totalAmount).toFixed(2))) : 0;

    if (params.paymentMethod === 'efectivo' && params.amountPaid < totalAmount) {
      throw new Error(`Monto pagado ($${params.amountPaid}) es menor al total de la venta ($${totalAmount})`);
    }

    // 3. Crear registro de venta
    const newSale: Sale = {
      id: saleId,
      sale_number: saleNumber,
      session_id: params.sessionId,
      customer_id: customer.id,
      customer_name: customer.full_name,
      customer_id_number: customer.identification_number,
      seller_user_id: userId,
      seller_name: userName,
      subtotal_0: Number(subtotal0.toFixed(2)),
      subtotal_iva: Number(subtotalIva.toFixed(2)),
      iva_amount: Number(ivaAmount.toFixed(2)),
      discount_amount: Number(totalDiscount.toFixed(2)),
      total_amount: totalAmount,
      status: 'completada',
      payment_method: params.paymentMethod,
      amount_paid: params.amountPaid,
      change_given: changeGiven,
      internal_doc_number: internalDocNumber,
      notes: params.notes,
      created_at: new Date().toISOString(),
      items: saleItems,
    };

    this.data.sales.unshift(newSale);
    this.data.saleItems.push(...saleItems);

    // 4. Descontar inventario y registrar en Kardex para cada línea
    for (const item of saleItems) {
      this.executeKardexMovement({
        productId: item.product_id,
        movementType: 'venta',
        quantityIn: 0,
        quantityOut: item.quantity,
        unitCost: item.unit_cost,
        docType: 'venta_pos',
        docId: newSale.id,
        docNumber: newSale.sale_number,
        customerId: customer.id,
        userId,
        userName,
        reason: `Venta POS ${newSale.sale_number} a ${customer.full_name}`,
      });
    }

    // 5. Si hay una sesión de caja abierta, acumular las ventas correspondientes
    if (params.sessionId) {
      const session = this.data.cashSessions.find((s) => s.id === params.sessionId && s.status === 'abierta');
      if (session) {
        if (params.paymentMethod === 'efectivo') {
          session.cash_sales_total += totalAmount;
          session.expected_cash += totalAmount;
        } else if (params.paymentMethod === 'tarjeta') {
          session.card_sales_total += totalAmount;
        } else if (params.paymentMethod === 'transferencia') {
          session.transfer_sales_total += totalAmount;
        }
      }
    }

    // 6. Actualizar métricas del cliente
    customer.total_purchases_count += 1;
    customer.total_spent += totalAmount;

    // 7. Emitir comprobante interno
    this.data.internalDocs.unshift({
      id: `int-${Date.now()}`,
      doc_number: internalDocNumber,
      doc_type: 'comprobante_venta_interno',
      reference_id: newSale.id,
      issued_by: userId,
      issuer_name: userName,
      recipient_name: customer.full_name,
      total_amount: totalAmount,
      details: {
        saleNumber,
        itemsCount: saleItems.length,
        paymentMethod: params.paymentMethod,
        subtotal0,
        subtotalIva,
        ivaAmount,
      },
      created_at: new Date().toISOString(),
    });

    this.addAuditLog(userId, userName, 'VENTA_POS_CONFIRMADA', 'Punto de Venta', saleNumber, `Venta procesada por $${totalAmount}`, null, newSale);
    this.persist();
    return newSale;
  }

  public cancelSale(saleId: string, reason: string, userId: string, userName: string) {
    const sale = this.data.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Venta no encontrada');
    if (sale.status === 'anulada') throw new Error('La venta ya fue anulada previamente');

    sale.status = 'anulada';
    sale.notes = `${sale.notes || ''} [ANULADA: ${reason}]`.trim();

    // Revertir inventario mediante movimientos de Kardex autorizados
    const items = this.data.saleItems.filter((i) => i.sale_id === saleId);
    for (const item of items) {
      const prod = this.data.products.find((p) => p.id === item.product_id);
      if (prod) {
        this.executeKardexMovement({
          productId: prod.id,
          movementType: 'reversion_autorizada',
          quantityIn: item.quantity,
          quantityOut: 0,
          unitCost: item.unit_cost,
          docType: 'anulacion_venta',
          docId: sale.id,
          docNumber: sale.sale_number,
          customerId: sale.customer_id,
          userId,
          userName,
          reason: `Reversión por anulación de venta ${sale.sale_number}: ${reason}`,
          isReversal: true,
        });
      }
    }

    // Revertir sesión de caja si aplica
    if (sale.session_id) {
      const session = this.data.cashSessions.find((s) => s.id === sale.session_id && s.status === 'abierta');
      if (session && sale.payment_method === 'efectivo') {
        session.cash_sales_total -= sale.total_amount;
        session.expected_cash -= sale.total_amount;
      }
    }

    this.addAuditLog(userId, userName, 'ANULACION_VENTA', 'Punto de Venta', sale.sale_number, reason, null, sale);
    this.persist();
    return sale;
  }

  // --- SESIÓN Y ARQUEO DE CAJA ---

  public openCashSession(
    registerCode: string,
    openingFloat: number,
    notes: string,
    userId: string,
    userName: string
  ): CashSession {
    const activeSession = this.data.cashSessions.find((s) => s.user_id === userId && s.status === 'abierta');
    if (activeSession) {
      throw new Error(`El usuario ya tiene un turno abierto (${activeSession.session_number})`);
    }

    const sessionCount = this.data.cashSessions.length + 1;
    const sessionNumber = `TUR-${new Date().getFullYear()}-${String(sessionCount).padStart(4, '0')}`;

    const newSession: CashSession = {
      id: `cs-${Date.now()}`,
      session_number: sessionNumber,
      cash_register_id: registerCode,
      user_id: userId,
      user_name: userName,
      opened_at: new Date().toISOString(),
      opening_float: openingFloat,
      cash_sales_total: 0,
      card_sales_total: 0,
      transfer_sales_total: 0,
      credit_sales_total: 0,
      inflows_total: 0,
      outflows_total: 0,
      expected_cash: openingFloat,
      status: 'abierta',
      notes,
      created_at: new Date().toISOString(),
    };

    this.data.cashSessions.unshift(newSession);
    this.addAuditLog(userId, userName, 'APERTURA_TURNO_CAJA', 'Caja y Turnos', sessionNumber, `Apertura con fondo de $${openingFloat}`, null, newSession);
    this.persist();
    return newSession;
  }

  public registerCashMovement(
    sessionId: string,
    type: 'ingreso' | 'egreso' | 'retiro_parcial',
    amount: number,
    reason: string,
    userId: string,
    userName: string
  ): CashMovement {
    const session = this.data.cashSessions.find((s) => s.id === sessionId && s.status === 'abierta');
    if (!session) throw new Error('Turno de caja no encontrado o ya cerrado');

    if (type === 'egreso' || type === 'retiro_parcial') {
      if (session.expected_cash < amount) {
        throw new Error(`Fondos insuficientes en caja ($${session.expected_cash.toFixed(2)}) para egreso de $${amount.toFixed(2)}`);
      }
      session.outflows_total += amount;
      session.expected_cash -= amount;
    } else {
      session.inflows_total += amount;
      session.expected_cash += amount;
    }

    const movement: CashMovement = {
      id: `cm-${Date.now()}`,
      session_id: sessionId,
      movement_type: type,
      amount,
      reason,
      authorized_by: userId,
      receipt_doc_ref: `REC-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
    };

    this.data.cashMovements.unshift(movement);
    this.addAuditLog(userId, userName, `MOVIMIENTO_CAJA_${type.toUpperCase()}`, 'Caja y Turnos', session.session_number, `$${amount}: ${reason}`, null, movement);
    this.persist();
    return movement;
  }

  public closeCashSession(
    sessionId: string,
    actualCountedCash: number,
    notes: string,
    supervisorId: string,
    userId: string,
    userName: string
  ): CashSession {
    const session = this.data.cashSessions.find((s) => s.id === sessionId && s.status === 'abierta');
    if (!session) throw new Error('Turno de caja no encontrado o ya cerrado');

    const difference = Number((actualCountedCash - session.expected_cash).toFixed(2));
    session.closed_at = new Date().toISOString();
    session.actual_counted_cash = actualCountedCash;
    session.difference = difference;
    session.status = difference === 0 ? 'cerrada' : 'auditada';
    session.supervisor_id = supervisorId;
    session.notes = notes ? `${session.notes || ''}\n[Cierre]: ${notes}`.trim() : session.notes;

    this.addAuditLog(
      userId,
      userName,
      'CIERRE_TURNO_CAJA',
      'Caja y Turnos',
      session.session_number,
      `Cierre con contado $${actualCountedCash}, esperado $${session.expected_cash}, diferencia: $${difference}`,
      null,
      session
    );
    this.persist();
    return session;
  }

  // --- FACTURACIÓN ELECTRÓNICA SRI ECUADOR ---
  public registerElectronicDocument(doc: ElectronicDocument, userId: string, userName: string) {
    this.data.electronicDocs.unshift(doc);
    this.addAuditLog(userId, userName, 'EMISION_DOC_ELECTRONICO_SRI', 'Facturación Electrónica', doc.access_key, `Documento ${doc.sequential} estado: ${doc.status}`, null, doc);
    this.persist();
  }

  public updateElectronicDocumentStatus(
    id: string,
    status: import('../types/database').SriAuthStatus,
    authNumber?: string,
    errorMessage?: string
  ) {
    const doc = this.data.electronicDocs.find((d) => d.id === id);
    if (doc) {
      doc.status = status;
      doc.authorization_number = authNumber || doc.authorization_number;
      if (status === 'autorizado') {
        doc.authorized_at = new Date().toISOString();
      }
      doc.error_message = errorMessage;
      doc.updated_at = new Date().toISOString();
      this.persist();
    }
  }

  // --- COLA DE CORREO Y AUTOMATIZACIONES ---
  public enqueueEmail(
    recipient: string,
    subject: string,
    bodyHtml: string,
    templateType: string,
    docId?: string
  ): EmailQueueItem {
    const email: EmailQueueItem = {
      id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipient,
      subject,
      body_html: bodyHtml,
      template_type: templateType,
      related_doc_id: docId,
      status: 'pendiente',
      attempts: 0,
      max_attempts: 3,
      created_at: new Date().toISOString(),
    };
    this.data.emailQueue.unshift(email);
    this.persist();
    return email;
  }

  public retryEmail(id: string) {
    const email = this.data.emailQueue.find((e) => e.id === id);
    if (email) {
      email.attempts += 1;
      email.status = 'enviado';
      email.sent_at = new Date().toISOString();
      email.last_error = undefined;
      this.persist();
    }
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.persist();
    }
  }

  public updateSettings(newSettings: Partial<SystemSettings>, userId: string, userName: string) {
    const prev = { ...this.data.settings };
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.addAuditLog(userId, userName, 'ACTUALIZACION_CONFIGURACION', 'Configuración General', 'SISTEMA', 'Actualización de parámetros generales de la tienda', prev, this.data.settings);
    this.persist();
  }
}

// Instancia única (Singleton) para toda la aplicación
export const db = new DatabaseEngine();
