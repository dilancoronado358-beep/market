// ==============================================================================
// MOTOR DE PERSISTENCIA Y ESTADO RELACIONAL TRANSACCIONAL (ERP / POS ECUADOR)
// Conexión directa a Supabase PostgreSQL y Kardex inmutable
// PERSISTENCIA REAL DIRECTA EN SUPABASE — SIN LOCALSTORAGE
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

// Generador de UUIDs estándar versión 4 para llaves primarias PostgreSQL de Supabase
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const isValidUUID = (val?: string | null): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

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

// Estado inicial limpio en Cero ("EN 0") — Plantilla inicial antes de sincronizar con Supabase
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
      id: 'd0000000-0000-0000-0000-000000000001',
      email: 'admin@erpposecuador.com',
      full_name: 'Administrador Principal',
      role: 'administrador',
      is_active: true,
      phone: '0991234567',
      created_at: new Date().toISOString(),
    },
    {
      id: '34905f53-dedc-4a92-89c1-4c42b7dfea81',
      email: 'dcoronado@ensing.lat',
      full_name: 'DILAN CORONADO',
      role: 'administrador',
      is_active: true,
      phone: '0969930639',
      created_at: new Date().toISOString(),
    },
    {
      id: 'f1196c8b-28d4-4972-84df-3cbd14f306ba',
      email: 'dilancoronado358@gmail.com',
      full_name: 'DILAN CORONADO',
      role: 'administrador',
      is_active: true,
      phone: '0969930639',
      created_at: new Date().toISOString(),
    },
    {
      id: 'ee9ecaf2-3a09-4a1a-af8f-fd417a743628',
      email: 'mfalconi@erpposecuador.com',
      full_name: 'Ing. Mateo Falconi',
      role: 'cajero',
      is_active: true,
      phone: '0981122334',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      email: 'gerencia@erpposecuador.com',
      full_name: 'Gerencia General',
      role: 'gerente',
      is_active: true,
      phone: '0997654321',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      email: 'supervisor@erpposecuador.com',
      full_name: 'Supervisor de Operaciones',
      role: 'supervisor',
      is_active: true,
      phone: '0988776655',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      email: 'bodega@erpposecuador.com',
      full_name: 'Encargado de Inventario',
      role: 'encargado_inventario',
      is_active: true,
      phone: '0966554433',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      email: 'compras@erpposecuador.com',
      full_name: 'Responsable de Compras',
      role: 'responsable_compras',
      is_active: true,
      phone: '0955443322',
      created_at: new Date().toISOString(),
    },
    {
      id: 'd0000000-0000-0000-0000-000000000006',
      email: 'auditor@erpposecuador.com',
      full_name: 'Auditor Financiero',
      role: 'auditor',
      is_active: true,
      phone: '0944332211',
      created_at: new Date().toISOString(),
    },
  ],
  categories: [
    { id: 'c0000000-0000-0000-0000-000000000001', name: 'Abarrotes y Alimentos', description: 'Víveres, aceites, granos y no perecibles', is_active: true, created_at: new Date().toISOString() },
    { id: 'c0000000-0000-0000-0000-000000000002', name: 'Bebidas y Refrescos', description: 'Gaseosas, aguas minerales y jugos', is_active: true, created_at: new Date().toISOString() },
    { id: 'c0000000-0000-0000-0000-000000000003', name: 'Lácteos y Huevos', description: 'Leche, quesos, yogures y derivados', is_active: true, created_at: new Date().toISOString() },
    { id: 'c0000000-0000-0000-0000-000000000004', name: 'Limpieza y Desinfección', description: 'Detergentes, jabones y desinfectantes', is_active: true, created_at: new Date().toISOString() },
    { id: 'c0000000-0000-0000-0000-000000000005', name: 'Snacks y Confitería', description: 'Galletas, papas fritas y chocolates', is_active: true, created_at: new Date().toISOString() },
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
      id: 'e0000000-0000-0000-0000-000000000001',
      identification_type: 'consumidor_final',
      identification_number: '9999999999999',
      full_name: 'CONSUMIDOR FINAL',
      address: 'Ecuador',
      is_active: true,
      total_purchases_count: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    },
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
  automations: [],
  notifications: [],
  auditLogs: [],
};

export const initialData: DatabaseSnapshot = cleanZeroData;

// Clase que maneja el motor de base de datos conectado directamente a Supabase
class DatabaseEngine {
  private data: DatabaseSnapshot;
  private listeners: (() => void)[] = [];
  public isInitialized: boolean = false;
  private realtimeChannel: any = null;

  constructor() {
    this.cleanLocalStorage();
    this.data = JSON.parse(JSON.stringify(cleanZeroData));
    this.syncWithSupabase();
    this.initRealtime();
  }

  // Elimina cualquier rastro antiguo de localStorage
  private cleanLocalStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('erp_pos_ecuador_db_v1');
        localStorage.removeItem('erp_pos_ecuador_auth_user');
        localStorage.removeItem('tienda_katy_db_v1');
        localStorage.removeItem('tienda_katy_auth_user');
      }
    } catch {
      // Ignorar
    }
  }

  // Escuchar cambios en vivo desde Supabase para sincronizar entre todos los dispositivos conectados
  public initRealtime() {
    if (!isSupabaseConfigured || !supabase || this.realtimeChannel) return;
    try {
      this.realtimeChannel = supabase
        .channel('public-db-realtime-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('Cambio en tiempo real detectado en Supabase:', payload);
            this.syncWithSupabase();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Conexión en tiempo real activa con Supabase (multi-dispositivo).');
          }
        });
    } catch (e) {
      console.warn('Realtime subscription warning:', e);
    }
  }

  // Sincronización completa con Supabase PostgreSQL
  public async syncWithSupabase(): Promise<DatabaseSnapshot> {
    if (!isSupabaseConfigured || !supabase) {
      this.isInitialized = true;
      this.notify();
      return this.data;
    }
    try {
      const [
        { data: prods, error: prodsErr },
        { data: cats },
        { data: supps },
        { data: visits },
        { data: visitItems },
        { data: incidents },
        { data: returns },
        { data: exchanges },
        { data: replacements },
        { data: movs },
        { data: custs },
        { data: sessions },
        { data: cashMovs },
        { data: salesData },
        { data: saleItemsData },
        { data: electronicDocsData },
        { data: internalDocsData },
        { data: purchaseOrdersData },
        { data: auditLogsData },
        { data: settingsData },
        { data: profsData },
      ] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_categories').select('*').order('name', { ascending: true }),
        supabase.from('suppliers').select('*').order('business_name', { ascending: true }),
        supabase.from('supplier_visits').select('*').order('created_at', { ascending: false }),
        supabase.from('supplier_visit_items').select('*').order('created_at', { ascending: false }),
        supabase.from('supplier_incidents').select('*').order('created_at', { ascending: false }),
        supabase.from('supplier_returns').select('*').order('created_at', { ascending: false }),
        supabase.from('supplier_exchanges').select('*').order('created_at', { ascending: false }),
        supabase.from('supplier_replacements').select('*').order('created_at', { ascending: false }),
        supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('cash_sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('cash_movements').select('*').order('created_at', { ascending: false }),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('sale_items').select('*').order('created_at', { ascending: false }),
        supabase.from('electronic_documents').select('*').order('created_at', { ascending: false }),
        supabase.from('internal_documents').select('*').order('created_at', { ascending: false }),
        supabase.from('purchase_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('system_settings').select('*').limit(1),
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      ]);

      if (prodsErr) {
        console.warn('Error fetching products from Supabase:', prodsErr);
      }

      if (cats && cats.length > 0) this.data.categories = cats;
      if (prods) this.data.products = prods;
      if (supps) this.data.suppliers = supps;
      if (visits) this.data.visits = visits;
      if (visitItems) this.data.visitItems = visitItems;
      if (incidents) this.data.incidents = incidents;
      if (returns) this.data.returns = returns;
      if (exchanges) this.data.exchanges = exchanges;
      if (replacements) this.data.replacements = replacements;
      if (movs) this.data.movements = movs;
      if (custs) this.data.customers = custs;
      if (sessions) this.data.cashSessions = sessions;
      if (cashMovs) this.data.cashMovements = cashMovs;
      if (salesData) {
        this.data.sales = salesData.map((s) => ({
          ...s,
          items: (saleItemsData || []).filter((i) => i.sale_id === s.id),
        }));
      }
      if (saleItemsData) this.data.saleItems = saleItemsData;
      if (electronicDocsData) this.data.electronicDocs = electronicDocsData;
      if (internalDocsData) this.data.internalDocs = internalDocsData;
      if (purchaseOrdersData) this.data.purchaseOrders = purchaseOrdersData;
      if (auditLogsData) this.data.auditLogs = auditLogsData;
      if (settingsData && settingsData.length > 0) {
        this.data.settings = { ...this.data.settings, ...settingsData[0] };
      }
      if (profsData && profsData.length > 0) {
        this.data.profiles = profsData;
      }

      this.isInitialized = true;
      this.notify();
    } catch (err) {
      console.warn('Supabase sync notice:', err);
      this.isInitialized = true;
      this.notify();
    }
    return this.data;
  }


  public seedTestData() {
    if (this.data.products.length === 0) {
      this.data.products.push({
        id: 'a765e0b6-2fcb-40fd-b71d-069b246c6a1a',
        internal_code: 'ABR-001',
        barcode: '7861001234567',
        name: 'Aceite Comestible 1L',
        category_id: 'c0000000-0000-0000-0000-000000000001',
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
        id: '6d1da238-b55b-4f3f-9f81-23b03d172148',
        ruc: '1790005527001',
        business_name: 'PRONACA C.A.',
        trade_name: 'PRONACA',
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
        id: generateUUID(),
        visit_number: 'VIS-2026-0001',
        supplier_id: '6d1da238-b55b-4f3f-9f81-23b03d172148',
        sales_rep_name: 'Carlos Ruiz',
        check_in_time: new Date().toISOString(),
        receiver_user_id: 'd0000000-0000-0000-0000-000000000004',
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
        id: generateUUID(),
        session_number: 'CAJA-2026-0001',
        cash_register_id: 'reg-01',
        user_id: 'ee9ecaf2-3a09-4a1a-af8f-fd417a743628',
        user_name: 'Ing. Mateo Falconi',
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
    this.cleanLocalStorage();
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
    return {
      ...this.data,
      products: [...this.data.products],
      suppliers: [...this.data.suppliers],
      customers: [...this.data.customers],
      visits: [...this.data.visits],
      visitItems: [...this.data.visitItems],
      movements: [...this.data.movements],
      sales: [...this.data.sales],
      saleItems: [...this.data.saleItems],
      categories: [...this.data.categories],
      profiles: [...this.data.profiles],
      cashSessions: [...this.data.cashSessions],
      cashMovements: [...this.data.cashMovements],
      electronicDocs: [...this.data.electronicDocs],
      internalDocs: [...this.data.internalDocs],
      purchaseOrders: [...this.data.purchaseOrders],
      auditLogs: [...this.data.auditLogs],
      incidents: [...this.data.incidents],
      returns: [...this.data.returns],
      exchanges: [...this.data.exchanges],
      replacements: [...this.data.replacements],
      emailQueue: [...this.data.emailQueue],
      notifications: [...this.data.notifications],
    };
  }

  public persistState() {
    this.persist();
  }

  // --- GESTIÓN DE PERFILES Y USUARIOS ---
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

    let assignedId = generateUUID();

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
          if (authData?.user?.id) {
            assignedId = authData.user.id;
          } else if (authErr) {
            console.warn('Supabase signUp notice:', authErr.message);
          }
        }

        const { data: upsertData, error: upsertErr } = await supabase.from('profiles').upsert({
          id: assignedId,
          email: emailClean,
          full_name: profileData.full_name,
          role: profileData.role,
          phone: profileData.phone || '',
          is_active: true,
          updated_at: new Date().toISOString(),
        }).select().maybeSingle();

        if (!upsertErr && upsertData?.id) {
          assignedId = upsertData.id;
        }
      } catch (err) {
        console.warn('Supabase profile sync error:', err);
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
      'd0000000-0000-0000-0000-000000000001',
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
      adminUser?.id || 'd0000000-0000-0000-0000-000000000001',
      adminUser?.name || 'Administrador',
      isActive ? 'ACTIVACION_USUARIO' : 'DESACTIVACION_USUARIO',
      'Usuarios & Permisos',
      userId,
      `Estado de cuenta de ${target.full_name} cambiado a ${isActive ? 'activo' : 'inactivo'}`
    );

    return true;
  }

  // --- REGLAS DE AUDITORÍA (INMUTABLE EN SUPABASE) ---
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
      id: generateUUID(),
      user_id: userId,
      user_name: userName,
      action,
      module,
      record_id: recordId,
      reason,
      previous_values: prev,
      new_values: next,
      ip_address: '127.0.0.1 (Supabase Cloud)',
      created_at: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(log);

    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').insert({
        id: log.id,
        user_id: userId && userId.length > 20 ? userId : null,
        user_name: userName,
        action,
        module,
        record_id: String(recordId || 'general'),
        reason: reason || action,
        previous_values: prev || null,
        new_values: next || null,
        ip_address: '127.0.0.1'
      }).then(({ error }) => {
        if (error) console.warn('Supabase audit log insert error:', error);
      });
    }

    this.notify();
  }

  // --- PRODUCTOS Y KARDEX ATÓMICO EN SUPABASE ---
  public async createProduct(
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'current_stock' | 'quarantine_stock' | 'reserved_stock'>,
    initialStock: number,
    userId: string,
    userName: string
  ): Promise<Product> {
    const id = generateUUID();
    const newProduct: Product = {
      ...productData,
      id,
      current_stock: 0,
      reserved_stock: 0,
      quarantine_stock: 0,
      avg_cost: productData.cost_price,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error: insertErr } = await supabase.from('products').insert({
        id: newProduct.id,
        internal_code: newProduct.internal_code,
        sku: newProduct.sku || null,
        barcode: newProduct.barcode || null,
        name: newProduct.name,
        description: newProduct.description || null,
        category_id: isValidUUID(newProduct.category_id) ? newProduct.category_id : null,
        brand: newProduct.brand || null,
        model_presentation: newProduct.model_presentation || null,
        unit_of_measure: newProduct.unit_of_measure,
        unit_purchase: newProduct.unit_purchase || 'unidad',
        unit_conversion_ratio: newProduct.unit_conversion_ratio || 1,
        cost_price: newProduct.cost_price,
        avg_cost: newProduct.avg_cost,
        sale_price: newProduct.sale_price,
        wholesale_price: newProduct.wholesale_price || 0,
        iva_rate: newProduct.iva_rate,
        min_stock: newProduct.min_stock,
        max_stock: newProduct.max_stock,
        current_stock: 0,
        reserved_stock: 0,
        quarantine_stock: 0,
        location: newProduct.location || null,
        main_supplier_id: isValidUUID(newProduct.main_supplier_id) ? newProduct.main_supplier_id : null,
        is_active: true
      });

      if (insertErr) {
        console.error('Supabase product insert error:', insertErr);
        throw new Error(`Error en Supabase al crear producto: ${insertErr.message}`);
      }
    }

    this.data.products = [newProduct, ...this.data.products];

    if (initialStock > 0) {
      await this.executeKardexMovement({
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

    this.addAuditLog(userId, userName, 'CREACION_PRODUCTO', 'Catálogo Productos', newProduct.internal_code, 'Nuevo producto registrado en Supabase', null, newProduct);
    this.notify();
    return newProduct;
  }

  public async updateProduct(
    id: string,
    updates: Partial<Product>,
    userId: string,
    userName: string,
    auditReason: string
  ): Promise<Product> {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');

    const previous = { ...this.data.products[idx] };
    const updated = {
      ...this.data.products[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    updated.current_stock = previous.current_stock;
    updated.quarantine_stock = previous.quarantine_stock;

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').update({
        name: updated.name,
        internal_code: updated.internal_code,
        sku: updated.sku || null,
        barcode: updated.barcode || null,
        description: updated.description || null,
        brand: updated.brand || null,
        model_presentation: updated.model_presentation || null,
        unit_of_measure: updated.unit_of_measure,
        unit_purchase: updated.unit_purchase,
        unit_conversion_ratio: updated.unit_conversion_ratio,
        cost_price: updated.cost_price,
        sale_price: updated.sale_price,
        wholesale_price: updated.wholesale_price || 0,
        iva_rate: updated.iva_rate,
        min_stock: updated.min_stock,
        max_stock: updated.max_stock,
        location: updated.location || null,
        category_id: isValidUUID(updated.category_id) ? updated.category_id : null,
        main_supplier_id: isValidUUID(updated.main_supplier_id) ? updated.main_supplier_id : null,
        is_active: updated.is_active ?? true,
        updated_at: updated.updated_at
      }).eq('id', id);

      if (error) {
        console.error('Supabase product update error:', error);
        throw new Error(`Error en Supabase al actualizar producto: ${error.message}`);
      }
    }

    this.data.products = this.data.products.map((p) => (p.id === id ? updated : p));
    this.addAuditLog(userId, userName, 'ACTUALIZACION_PRODUCTO', 'Catálogo Productos', updated.internal_code, auditReason, previous, updated);
    this.notify();
    return updated;
  }

  public async deleteProduct(id: string, userId: string = 'd0000000-0000-0000-0000-000000000001', userName: string = 'Sistema'): Promise<boolean> {
    const prod = this.data.products.find((p) => p.id === id);
    if (!prod) return false;

    if (isSupabaseConfigured && supabase) {
      // Limpieza en cascada de registros que referencian al producto para evitar violaciones de Foreign Key
      try {
        await supabase.from('supplier_replacements').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup supplier_replacements warning:', err);
      }
      try {
        await supabase.from('supplier_exchange_items').delete().eq('original_product_id', id);
        await supabase.from('supplier_exchange_items').delete().eq('replacement_product_id', id);
      } catch (err) {
        console.warn('cleanup supplier_exchange_items warning:', err);
      }
      try {
        await supabase.from('supplier_return_items').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup supplier_return_items warning:', err);
      }
      try {
        await supabase.from('supplier_incidents').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup supplier_incidents warning:', err);
      }
      try {
        await supabase.from('supplier_visit_items').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup supplier_visit_items warning:', err);
      }
      try {
        await supabase.from('purchase_order_items').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup purchase_order_items warning:', err);
      }
      try {
        await supabase.from('inventory_movements').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup inventory_movements warning:', err);
      }
      try {
        await supabase.from('sale_items').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup sale_items warning:', err);
      }
      try {
        await supabase.from('internal_doc_items').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup internal_doc_items warning:', err);
      }
      try {
        await supabase.from('product_prices').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup product_prices warning:', err);
      }
      try {
        await supabase.from('product_barcodes').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup product_barcodes warning:', err);
      }
      try {
        await supabase.from('product_supplier_codes').delete().eq('product_id', id);
      } catch (err) {
        console.warn('cleanup product_supplier_codes warning:', err);
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Supabase product delete error:', error);
        throw new Error(`Error en Supabase al eliminar producto: ${error.message}`);
      }
    }

    this.data.products = this.data.products.filter((p) => p.id !== id);
    this.data.replacements = (this.data.replacements || []).filter((r) => r.product_id !== id);
    this.data.incidents = (this.data.incidents || []).filter((i) => i.product_id !== id);
    this.data.movements = (this.data.movements || []).filter((m) => m.product_id !== id);
    this.data.visitItems = (this.data.visitItems || []).filter((it) => it.product_id !== id);
    this.data.saleItems = (this.data.saleItems || []).filter((si) => si.product_id !== id);

    this.addAuditLog(userId, userName, 'ELIMINACION_PRODUCTO', 'Catálogo Productos', id, `Producto eliminado: ${prod.name} (${prod.internal_code})`);
    this.notify();
    return true;
  }

  // --- KARDEX INMUTABLE Y COSTO PROMEDIO EN SUPABASE ---
  public async executeKardexMovement(params: {
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
  }): Promise<InventoryMovement> {
    const product = this.data.products.find((p) => p.id === params.productId);
    if (!product) throw new Error(`Producto ${params.productId} no encontrado`);

    const prevStock = Number(product.current_stock || 0);
    const prevAvgCost = Number(product.avg_cost || product.cost_price || 0);
    let newStock = prevStock;
    let newAvgCost = prevAvgCost;

    if (params.quantityIn > 0) {
      newStock = prevStock + params.quantityIn;
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

    product.current_stock = newStock;
    product.avg_cost = newAvgCost;
    product.updated_at = new Date().toISOString();

    const movementNumber = `MOV-${new Date().getFullYear()}-${String(this.data.movements.length + 1).padStart(4, '0')}`;
    const movement: InventoryMovement = {
      id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      const { error: movErr } = await supabase.from('inventory_movements').insert({
        id: movement.id,
        movement_number: movement.movement_number,
        product_id: movement.product_id,
        product_name: movement.product_name,
        movement_type: movement.movement_type,
        quantity_in: movement.quantity_in,
        quantity_out: movement.quantity_out,
        previous_stock: movement.previous_stock,
        new_stock: movement.new_stock,
        unit_cost: movement.unit_cost,
        total_cost: movement.total_cost,
        doc_type: movement.doc_type || null,
        doc_id: movement.doc_id || null,
        doc_number: movement.doc_number || null,
        supplier_id: movement.supplier_id && movement.supplier_id.length > 20 ? movement.supplier_id : null,
        user_id: movement.user_id && movement.user_id.length > 20 ? movement.user_id : null,
        user_name: movement.user_name || null,
        reason: movement.reason,
        is_reversal: movement.is_reversal
      });

      if (movErr) {
        console.warn('Supabase kardex insert error:', movErr);
      }

      await supabase.from('products').update({
        current_stock: newStock,
        avg_cost: newAvgCost,
        updated_at: new Date().toISOString()
      }).eq('id', product.id);
    }

    product.current_stock = newStock;
    product.avg_cost = newAvgCost;
    this.data.movements = [movement, ...this.data.movements];
    this.data.products = [...this.data.products];

    if (newStock <= product.min_stock) {
      this.triggerLowStockNotification(product);
    }

    this.notify();
    return movement;
  }


  private triggerLowStockNotification(product: Product) {
    const existing = this.data.notifications.find(
      (n) => n.title.includes('Stock Crítico') && n.message.includes(product.name) && !n.is_read
    );
    if (!existing) {
      this.data.notifications.unshift({
        id: generateUUID(),
        title: `Alerta: Stock Bajo en ${product.name}`,
        message: `El producto "${product.name}" tiene ${product.current_stock} ${product.unit_of_measure} (mínimo: ${product.min_stock}).`,
        type: 'warning',
        link_url: '/productos',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    }
  }

  // --- VISITAS DE PROVEEDORES (EXPEDIENTE DIGITAL) EN SUPABASE ---
  public async createSupplierVisit(
    visitData: {
      supplier_id: string;
      sales_rep_name: string;
      reason: string;
      invoice_or_doc_ref?: string;
      notes?: string;
    },
    userId: string,
    userName: string
  ): Promise<SupplierVisit> {
    const visitCount = this.data.visits.length + 1;
    const visitNumber = `VIS-${new Date().getFullYear()}-${String(visitCount).padStart(4, '0')}`;
    const newVisit: SupplierVisit = {
      id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      const { error: visitErr } = await supabase.from('supplier_visits').insert({
        id: newVisit.id,
        visit_number: newVisit.visit_number,
        supplier_id: newVisit.supplier_id,
        sales_rep_name: newVisit.sales_rep_name,
        receiver_user_id: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        reason: newVisit.reason,
        invoice_or_doc_ref: newVisit.invoice_or_doc_ref || null,
        status: newVisit.status,
        notes: newVisit.notes || null,
        has_incidents: false,
        has_replacements_pending: false
      });
      if (visitErr) {
        console.error('Supabase visit insert error:', visitErr);
        throw new Error(`Error en Supabase al registrar visita: ${visitErr.message}`);
      }
    }

    this.data.visits = [newVisit, ...this.data.visits];
    this.addAuditLog(userId, userName, 'REGISTRO_LLEGADA_VISITA', 'Visitas Proveedores', visitNumber, `Llegada de proveedor: ${newVisit.sales_rep_name}`, null, newVisit);
    this.notify();
    return newVisit;
  }

  public async addVisitReceiptItem(
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
  ): Promise<SupplierVisitItem> {
    const visit = this.data.visits.find((v) => v.id === visitId);
    if (!visit) throw new Error('Visita no encontrada');
    const product = this.data.products.find((p) => p.id === itemData.productId);
    if (!product) throw new Error('Producto no encontrado');

    const newItem: SupplierVisitItem = {
      id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      const { error: itemErr } = await supabase.from('supplier_visit_items').insert({
        id: newItem.id,
        visit_id: newItem.visit_id,
        product_id: newItem.product_id,
        declared_qty: newItem.declared_qty,
        received_qty: newItem.received_qty,
        accepted_qty: newItem.accepted_qty,
        rejected_qty: newItem.rejected_qty,
        unit: newItem.unit || 'unidad',
        unit_cost: newItem.unit_cost,
        lot_number: newItem.lot_number || null,
        expiration_date: newItem.expiration_date || null,
        status: newItem.status,
        difference_reason: newItem.difference_reason || null,
        is_new_product: Boolean(newItem.is_new_product),
        notes: newItem.notes || null
      });
      if (itemErr) {
        console.error('Supabase visit item insert error:', itemErr);
        throw new Error(`Error en Supabase al registrar item de visita: ${itemErr.message}`);
      }
    }

    this.data.visitItems = [newItem, ...this.data.visitItems];

    if (itemData.acceptedQty > 0) {
      await this.executeKardexMovement({
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

    if (itemData.rejectedQty > 0 && itemData.status === 'dañado') {
      product.quarantine_stock = (product.quarantine_stock || 0) + itemData.rejectedQty;
      this.data.products = [...this.data.products];
      visit.has_incidents = true;

      await this.reportSupplierIncident({
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

    if (isSupabaseConfigured && supabase) {
      await supabase.from('supplier_visits').update({
        status: visit.status,
        has_incidents: visit.has_incidents,
        updated_at: visit.updated_at
      }).eq('id', visit.id);
    }

    this.addAuditLog(userId, userName, 'RECEPCION_LINEA_MERCADERIA', 'Visitas Proveedores', visit.visit_number, `Línea recibida: ${product.name}`, null, newItem);
    this.notify();
    return newItem;
  }

  public async createProductFromVisit(
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
  ): Promise<Product> {
    const visit = this.data.visits.find((v) => v.id === visitId);
    if (!visit) throw new Error('Visita no encontrada');

    const product = await this.createProduct({
      ...productData,
      main_supplier_id: visit.supplier_id,
      unit_purchase: productData.unit_of_measure,
      unit_conversion_ratio: 1,
      avg_cost: productData.cost_price,
      min_stock: 5,
      max_stock: 100,
      is_active: true,
    }, 0, userId, userName);

    await this.addVisitReceiptItem(visitId, {
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
      id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      supabase.from('supplier_incidents').insert({
        id: incident.id,
        incident_number: incident.incident_number,
        visit_id: incident.visit_id && incident.visit_id.length > 20 ? incident.visit_id : null,
        supplier_id: incident.supplier_id,
        product_id: incident.product_id,
        product_name: incident.product_name,
        affected_qty: incident.affected_qty,
        lot_number: incident.lot_number || null,
        damage_reason: incident.damage_reason,
        reported_by: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        estimated_value: incident.estimated_value,
        status: incident.status
      }).then(({ error }) => {
        if (error) console.warn('Supabase incident insert error:', error);
      });
    }

    this.data.notifications.unshift({
      id: generateUUID(),
      title: `Incidencia Registrada: ${incidentNumber}`,
      message: `Se reportaron ${params.affected_qty} unidades dañadas de "${product?.name}". Requiere seguimiento con proveedor.`,
      type: 'danger',
      link_url: '/visitas-proveedores',
      is_read: false,
      created_at: new Date().toISOString(),
    });

    this.addAuditLog(userId, userName, 'REPORTE_INCIDENCIA_DAÑO', 'Visitas Proveedores', incidentNumber, params.damage_reason, null, incident);
    this.notify();
    return incident;
  }

  public registerSupplierReturn(
    params: {
      supplierId: string;
      visitId?: string;
      items: { productId: string; quantity: number; reason: string; incidentId?: string }[];
      carrierOrRepName?: string;
      documentRef?: string;
      notes?: string;
      confirmPhysicalExit: boolean;
    },
    userId: string,
    userName: string
  ): SupplierReturn {
    const returnCount = this.data.returns.length + 1;
    const returnNumber = `DEV-${new Date().getFullYear()}-${String(returnCount).padStart(4, '0')}`;

    const returnRecord: SupplierReturn = {
      id: generateUUID(),
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
          id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      supabase.from('supplier_returns').insert({
        id: returnRecord.id,
        return_number: returnRecord.return_number,
        visit_id: returnRecord.visit_id && returnRecord.visit_id.length > 20 ? returnRecord.visit_id : null,
        supplier_id: returnRecord.supplier_id,
        created_by: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        status: returnRecord.status,
        authorized_by: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        carrier_or_rep_name: returnRecord.carrier_or_rep_name || null,
        document_ref: returnRecord.document_ref || null,
        notes: returnRecord.notes || null
      }).then(({ error }) => {
        if (error) console.warn('Supabase return insert error:', error);
      });
    }

    if (params.confirmPhysicalExit) {
      params.items.forEach((item) => {
        const prod = this.data.products.find((p) => p.id === item.productId);
        if (prod) {
          if (prod.quarantine_stock >= item.quantity) {
            prod.quarantine_stock -= item.quantity;
          } else {
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
    this.notify();
    return returnRecord;
  }

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
      id: generateUUID(),
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
          id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      supabase.from('supplier_exchanges').insert({
        id: exchange.id,
        exchange_number: exchange.exchange_number,
        visit_id: exchange.visit_id && exchange.visit_id.length > 20 ? exchange.visit_id : null,
        supplier_id: exchange.supplier_id,
        processed_by: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        status: exchange.status,
        price_difference: exchange.price_difference,
        notes: exchange.notes || null
      }).then(({ error }) => {
        if (error) console.warn('Supabase exchange insert error:', error);
      });
    }

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
    this.notify();
    return exchange;
  }

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
      id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      supabase.from('supplier_replacements').insert({
        id: replacement.id,
        replacement_number: replacement.replacement_number,
        origin_visit_id: replacement.origin_visit_id && replacement.origin_visit_id.length > 20 ? replacement.origin_visit_id : null,
        supplier_id: replacement.supplier_id,
        product_id: replacement.product_id,
        product_name: replacement.product_name,
        affected_qty: replacement.affected_qty,
        agreed_qty: replacement.agreed_qty,
        delivered_qty: 0,
        commitment_date: replacement.commitment_date,
        expected_delivery_date: replacement.expected_delivery_date,
        status: replacement.status,
        responsible_user_id: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        notes: replacement.notes || null
      }).then(({ error }) => {
        if (error) console.warn('Supabase replacement insert error:', error);
      });
    }

    if (params.originVisitId) {
      const visit = this.data.visits.find((v) => v.id === params.originVisitId);
      if (visit) {
        visit.has_replacements_pending = true;
        visit.updated_at = new Date().toISOString();
      }
    }

    this.addAuditLog(userId, userName, 'COMPROMISO_REPOSICION_REGISTRADO', 'Visitas Proveedores', replacementNumber, `Compromiso de entrega de ${params.agreedQty} unidades para el ${params.expectedDeliveryDate}`, null, replacement);
    this.notify();
    return replacement;
  }

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

    if (isSupabaseConfigured && supabase) {
      supabase.from('supplier_replacements').update({
        delivered_qty: rep.delivered_qty,
        status: rep.status,
        updated_at: new Date().toISOString()
      }).eq('id', replacementId).then(({ error }) => {
        if (error) console.warn('Supabase replacement update error:', error);
      });
    }

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
    this.notify();
    return rep;
  }

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

    if (isSupabaseConfigured && supabase) {
      supabase.from('supplier_visits').update({
        check_out_time: visit.check_out_time,
        status: visit.status,
        notes: visit.notes,
        updated_at: visit.updated_at
      }).eq('id', visitId).then(({ error }) => {
        if (error) console.warn('Supabase visit close update error:', error);
      });
    }

    const supplier = this.data.suppliers.find((s) => s.id === visit.supplier_id);
    if (supplier?.email) {
      this.enqueueEmail(
        supplier.email,
        `Acta de Visita Finalizada - ${visit.visit_number} (ERP / POS Ecuador)`,
        `<p>Estimados ${supplier.business_name}, se ha cerrado la visita ${visit.visit_number} con éxito. Adjuntamos el acta digital para sus registros.</p>`,
        'acta_visita',
        visit.id
      );
    }

    this.addAuditLog(userId, userName, 'CIERRE_VISITA_PROVEEDOR', 'Visitas Proveedores', visit.visit_number, `Cierre formal de visita con generación de acta`, null, visit);
    this.notify();
    return visit;
  }

  // --- PUNTO DE VENTA (POS) Y VENTAS EN SUPABASE ---
  public async processSale(
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
  ): Promise<Sale> {
    const customer = this.data.customers.find(
      (c) => c.id === params.customerId || (params.customerId === 'cust-cf' && (c.id === 'cust-cf' || c.identification_type === 'consumidor_final'))
    ) || (params.customerId === 'cust-cf' ? this.data.customers[0] : null);
    if (!customer) throw new Error('Cliente no encontrado');

    for (const item of params.items) {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (!prod) throw new Error(`Producto ${item.productId} no existe`);
      if (!this.data.settings.allow_negative_stock && prod.current_stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}". Disponible: ${prod.current_stock}, Solicitado: ${item.quantity}`);
      }
    }

    let subtotal0 = 0;
    let subtotalIva = 0;
    let ivaAmount = 0;
    let totalDiscount = 0;

    const saleItems: SaleItem[] = [];
    const saleId = generateUUID();
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
        id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      const { error: saleErr } = await supabase.from('sales').insert({
        id: newSale.id,
        sale_number: newSale.sale_number,
        customer_id: newSale.customer_id && newSale.customer_id.length > 20 ? newSale.customer_id : null,
        customer_name: newSale.customer_name,
        customer_id_number: newSale.customer_id_number,
        seller_user_id: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        seller_name: userName,
        subtotal_0: newSale.subtotal_0,
        subtotal_iva: newSale.subtotal_iva,
        iva_amount: newSale.iva_amount,
        discount_amount: newSale.discount_amount,
        total_amount: newSale.total_amount,
        payment_method: newSale.payment_method,
        amount_paid: newSale.amount_paid,
        change_given: newSale.change_given,
        status: 'completada',
        internal_doc_number: newSale.internal_doc_number
      });

      if (saleErr) {
        console.error('Supabase sale insert error:', saleErr);
        throw new Error(`Error en Supabase al registrar venta: ${saleErr.message}`);
      }

      const itemsToInsert = saleItems.map((si) => ({
        id: si.id,
        sale_id: saleId,
        product_id: si.product_id && si.product_id.length > 20 ? si.product_id : null,
        product_name: si.product_name,
        product_barcode: si.product_barcode || null,
        quantity: si.quantity,
        unit_cost: si.unit_cost,
        unit_price: si.unit_price,
        discount_percent: si.discount_percent,
        discount_amount: si.discount_amount,
        iva_rate: si.iva_rate,
        subtotal: si.subtotal,
        iva_amount: si.iva_amount,
        total: si.total
      }));

      const { error: itemsErr } = await supabase.from('sale_items').insert(itemsToInsert);
      if (itemsErr) {
        console.warn('Supabase sale_items insert error:', itemsErr);
      }
    }

    this.data.sales = [newSale, ...this.data.sales];
    this.data.saleItems = [...saleItems, ...this.data.saleItems];

    for (const item of saleItems) {
      await this.executeKardexMovement({
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

        if (isSupabaseConfigured && supabase) {
          await supabase.from('cash_sessions').update({
            cash_sales_total: session.cash_sales_total,
            card_sales_total: session.card_sales_total,
            transfer_sales_total: session.transfer_sales_total,
            expected_cash: session.expected_cash
          }).eq('id', session.id);
        }
      }
    }

    customer.total_purchases_count += 1;
    customer.total_spent += totalAmount;


    this.data.internalDocs.unshift({
      id: generateUUID(),
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
    this.notify();
    return newSale;
  }

  public async cancelSale(saleId: string, reason: string, userId: string, userName: string) {
    const sale = this.data.sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Venta no encontrada');
    if (sale.status === 'anulada') throw new Error('La venta ya fue anulada previamente');

    sale.status = 'anulada';
    sale.notes = `${sale.notes || ''} [ANULADA: ${reason}]`.trim();

    if (isSupabaseConfigured && supabase) {
      supabase.from('sales').update({
        status: 'anulada'
      }).eq('id', saleId).then(({ error }) => {
        if (error) console.warn('Supabase sale cancel update error:', error);
      });
    }

    const items = this.data.saleItems.filter((i) => i.sale_id === saleId);
    for (const item of items) {
      const prod = this.data.products.find((p) => p.id === item.product_id);
      if (prod) {
        await this.executeKardexMovement({
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

    if (sale.session_id) {
      const session = this.data.cashSessions.find((s) => s.id === sale.session_id && s.status === 'abierta');
      if (session && sale.payment_method === 'efectivo') {
        session.cash_sales_total -= sale.total_amount;
        session.expected_cash -= sale.total_amount;
      }
    }

    this.addAuditLog(userId, userName, 'ANULACION_VENTA', 'Punto de Venta', sale.sale_number, reason, null, sale);
    this.notify();
    return sale;
  }

  // --- SESIÓN Y ARQUEO DE CAJA EN SUPABASE ---
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
      id: generateUUID(),
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

    if (isSupabaseConfigured && supabase) {
      supabase.from('cash_sessions').insert({
        id: newSession.id,
        session_number: newSession.session_number,
        cash_register_id: newSession.cash_register_id,
        user_id: userId && userId.length > 20 ? userId : 'd0000000-0000-0000-0000-000000000001',
        user_name: userName,
        opening_float: openingFloat,
        expected_cash: openingFloat,
        status: 'abierta',
        notes: notes || null
      }).then(({ error }) => {
        if (error) console.warn('Supabase cash session insert error:', error);
      });
    }

    this.addAuditLog(userId, userName, 'APERTURA_TURNO_CAJA', 'Caja y Turnos', sessionNumber, `Apertura con fondo de $${openingFloat}`, null, newSession);
    this.notify();
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
      id: generateUUID(),
      session_id: sessionId,
      movement_type: type,
      amount,
      reason,
      authorized_by: userId,
      receipt_doc_ref: `REC-${Date.now().toString().slice(-6)}`,
      created_at: new Date().toISOString(),
    };

    this.data.cashMovements.unshift(movement);

    if (isSupabaseConfigured && supabase) {
      supabase.from('cash_movements').insert({
        id: movement.id,
        session_id: sessionId,
        movement_type: type,
        amount: movement.amount,
        reason: movement.reason,
        authorized_by: userId && userId.length > 20 ? userId : null,
        receipt_doc_ref: movement.receipt_doc_ref
      }).then(({ error }) => {
        if (error) console.warn('Supabase cash movement insert error:', error);
      });

      supabase.from('cash_sessions').update({
        expected_cash: session.expected_cash,
        inflows_total: session.inflows_total,
        outflows_total: session.outflows_total
      }).eq('id', sessionId).then(({ error }) => {
        if (error) console.warn('Supabase cash session update error:', error);
      });
    }

    this.addAuditLog(userId, userName, `MOVIMIENTO_CAJA_${type.toUpperCase()}`, 'Caja y Turnos', session.session_number, `$${amount}: ${reason}`, null, movement);
    this.notify();
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

    if (isSupabaseConfigured && supabase) {
      supabase.from('cash_sessions').update({
        closed_at: session.closed_at,
        actual_counted_cash: actualCountedCash,
        difference,
        status: session.status,
        supervisor_id: supervisorId && supervisorId.length > 20 ? supervisorId : null,
        notes: session.notes
      }).eq('id', sessionId).then(({ error }) => {
        if (error) console.warn('Supabase cash session close error:', error);
      });
    }

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
    this.notify();
    return session;
  }

  // --- FACTURACIÓN ELECTRÓNICA SRI ECUADOR EN SUPABASE ---
  public registerElectronicDocument(doc: ElectronicDocument, userId: string, userName: string) {
    if (!doc.id || doc.id.startsWith('sri-')) {
      doc.id = generateUUID();
    }
    this.data.electronicDocs.unshift(doc);

    if (isSupabaseConfigured && supabase) {
      supabase.from('electronic_documents').insert({
        id: doc.id,
        doc_type: doc.doc_type,
        environment: doc.environment,
        emission_type: doc.emission_type,
        establishment: doc.establishment,
        emission_point: doc.emission_point,
        sequential: doc.sequential,
        access_key: doc.access_key,
        customer_id: doc.customer_id && doc.customer_id.length > 20 ? doc.customer_id : null,
        customer_name: doc.customer_name || null,
        total_amount: doc.total_amount,
        status: doc.status,
        authorization_number: doc.authorization_number || null,
        authorized_at: doc.authorized_at || null,
        xml_content: doc.xml_content || null,
        error_message: doc.error_message || null
      }).then(({ error }) => {
        if (error) console.warn('Supabase electronic doc insert error:', error);
      });
    }

    this.addAuditLog(userId, userName, 'EMISION_DOC_ELECTRONICO_SRI', 'Facturación Electrónica', doc.access_key, `Documento ${doc.sequential} estado: ${doc.status}`, null, doc);
    this.notify();
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

      if (isSupabaseConfigured && supabase) {
        supabase.from('electronic_documents').update({
          status: doc.status,
          authorization_number: doc.authorization_number || null,
          authorized_at: doc.authorized_at || null,
          error_message: doc.error_message || null
        }).eq('id', id).then(({ error }) => {
          if (error) console.warn('Supabase electronic doc status update error:', error);
        });
      }
      this.notify();
    }
  }

  // --- CLIENTES EN SUPABASE ---
  public async createCustomer(custData: Omit<Customer, 'id' | 'created_at' | 'total_purchases_count' | 'total_spent'>): Promise<Customer> {
    const id = generateUUID();
    const newCust: Customer = {
      ...custData,
      id,
      total_purchases_count: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('customers').insert({
        id: newCust.id,
        identification_type: newCust.identification_type,
        identification_number: newCust.identification_number,
        full_name: newCust.full_name,
        email: newCust.email || null,
        phone: newCust.phone || null,
        address: newCust.address || null,
        is_active: newCust.is_active ?? true,
        total_purchases_count: 0,
        total_spent: 0
      });
      if (error) {
        console.error('Supabase customer insert error:', error);
        throw new Error(`Error en Supabase al registrar cliente: ${error.message}`);
      }
    }

    this.data.customers = [newCust, ...this.data.customers];
    this.notify();
    return newCust;
  }

  public async deleteCustomer(id: string, userId: string = 'd0000000-0000-0000-0000-000000000001', userName: string = 'Sistema'): Promise<boolean> {
    const cust = this.data.customers.find((c) => c.id === id);
    if (!cust) return false;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sales').update({ customer_id: null }).eq('customer_id', id);
      } catch (err) {
        console.warn('cleanup sales customer link warning:', err);
      }
      try {
        await supabase.from('inventory_movements').update({ customer_id: null }).eq('customer_id', id);
      } catch (err) {
        console.warn('cleanup inventory_movements customer link warning:', err);
      }

      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        console.error('Supabase customer delete error:', error);
        throw new Error(`Error en Supabase al eliminar cliente: ${error.message}`);
      }
    }

    this.data.customers = this.data.customers.filter((c) => c.id !== id);
    this.addAuditLog(userId, userName, 'ELIMINACION_CLIENTE', 'Clientes', id, `Cliente eliminado: ${cust.full_name} (${cust.identification_number})`);
    this.notify();
    return true;
  }

  // --- PROVEEDORES EN SUPABASE ---
  public async createSupplier(supplierData: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
    const id = generateUUID();
    const newSup: Supplier = {
      ...supplierData,
      id,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('suppliers').insert({
        id: newSup.id,
        ruc: newSup.ruc,
        business_name: newSup.business_name,
        trade_name: newSup.trade_name || newSup.business_name,
        address: newSup.address || null,
        city: newSup.city || 'Quito',
        phone: newSup.phone || null,
        email: newSup.email || null,
        payment_terms_days: newSup.payment_terms_days || 15,
        is_active: newSup.is_active ?? true
      });
      if (error) {
        console.error('Supabase supplier insert error:', error);
        throw new Error(`Error en Supabase al registrar proveedor: ${error.message}`);
      }
    }

    this.data.suppliers = [newSup, ...this.data.suppliers];
    this.notify();
    return newSup;
  }

  public async deleteSupplier(id: string, userId: string = 'd0000000-0000-0000-0000-000000000001', userName: string = 'Sistema'): Promise<boolean> {
    const sup = this.data.suppliers.find((s) => s.id === id);
    if (!sup) return false;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('supplier_replacements').delete().eq('supplier_id', id);
      } catch (err) {
        console.warn('cleanup supplier_replacements warning:', err);
      }
      try {
        const { data: exchs } = await supabase.from('supplier_exchanges').select('id').eq('supplier_id', id);
        if (exchs && exchs.length > 0) {
          for (const ex of exchs) {
            await supabase.from('supplier_exchange_items').delete().eq('exchange_id', ex.id);
          }
          await supabase.from('supplier_exchanges').delete().eq('supplier_id', id);
        }
      } catch (err) {
        console.warn('cleanup supplier_exchanges warning:', err);
      }
      try {
        const { data: rets } = await supabase.from('supplier_returns').select('id').eq('supplier_id', id);
        if (rets && rets.length > 0) {
          for (const ret of rets) {
            await supabase.from('supplier_return_items').delete().eq('return_id', ret.id);
          }
          await supabase.from('supplier_returns').delete().eq('supplier_id', id);
        }
      } catch (err) {
        console.warn('cleanup supplier_returns warning:', err);
      }
      try {
        await supabase.from('supplier_incidents').delete().eq('supplier_id', id);
      } catch (err) {
        console.warn('cleanup supplier_incidents warning:', err);
      }
      try {
        const { data: vsts } = await supabase.from('supplier_visits').select('id').eq('supplier_id', id);
        if (vsts && vsts.length > 0) {
          for (const vst of vsts) {
            await supabase.from('supplier_visit_items').delete().eq('visit_id', vst.id);
          }
          await supabase.from('supplier_visits').delete().eq('supplier_id', id);
        }
      } catch (err) {
        console.warn('cleanup supplier_visits warning:', err);
      }
      try {
        const { data: pos } = await supabase.from('purchase_orders').select('id').eq('supplier_id', id);
        if (pos && pos.length > 0) {
          for (const po of pos) {
            await supabase.from('purchase_order_items').delete().eq('purchase_order_id', po.id);
          }
          await supabase.from('purchase_orders').delete().eq('supplier_id', id);
        }
      } catch (err) {
        console.warn('cleanup purchase_orders warning:', err);
      }
      try {
        await supabase.from('supplier_contacts').delete().eq('supplier_id', id);
      } catch (err) {
        console.warn('cleanup supplier_contacts warning:', err);
      }
      try {
        await supabase.from('supplier_agreements').delete().eq('supplier_id', id);
      } catch (err) {
        console.warn('cleanup supplier_agreements warning:', err);
      }
      try {
        await supabase.from('product_supplier_codes').delete().eq('supplier_id', id);
      } catch (err) {
        console.warn('cleanup product_supplier_codes warning:', err);
      }
      try {
        await supabase.from('products').update({ main_supplier_id: null }).eq('main_supplier_id', id);
      } catch (err) {
        console.warn('cleanup products supplier link warning:', err);
      }
      try {
        await supabase.from('inventory_movements').update({ supplier_id: null }).eq('supplier_id', id);
      } catch (err) {
        console.warn('cleanup inventory_movements supplier link warning:', err);
      }

      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) {
        console.error('Supabase supplier delete error:', error);
        throw new Error(`Error en Supabase al eliminar proveedor: ${error.message}`);
      }
    }

    this.data.suppliers = this.data.suppliers.filter((s) => s.id !== id);
    this.data.visits = (this.data.visits || []).filter((v) => v.supplier_id !== id);
    this.data.purchaseOrders = (this.data.purchaseOrders || []).filter((p) => p.supplier_id !== id);
    this.data.incidents = (this.data.incidents || []).filter((i) => i.supplier_id !== id);
    this.data.returns = (this.data.returns || []).filter((r) => r.supplier_id !== id);
    this.data.replacements = (this.data.replacements || []).filter((r) => r.supplier_id !== id);

    this.addAuditLog(userId, userName, 'ELIMINACION_PROVEEDOR', 'Proveedores', id, `Proveedor eliminado: ${sup.trade_name || sup.business_name} (${sup.ruc})`);
    this.notify();
    return true;
  }

  // --- ÓRDENES DE COMPRA EN SUPABASE ---
  public async createPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'created_at'>): Promise<PurchaseOrder> {
    const id = generateUUID();
    const newPo: PurchaseOrder = {
      ...poData,
      id,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('purchase_orders').insert({
        id: newPo.id,
        order_number: newPo.order_number,
        supplier_id: newPo.supplier_id,
        supplier_name: newPo.supplier_name || 'Proveedor',
        created_by: newPo.created_by && newPo.created_by.length > 20 ? newPo.created_by : 'd0000000-0000-0000-0000-000000000001',
        status: newPo.status || 'borrador',
        expected_date: newPo.expected_date || null,
        subtotal: newPo.subtotal,
        tax_amount: newPo.tax_amount,
        total_amount: newPo.total_amount,
        notes: newPo.notes || null
      });
      if (error) {
        console.error('Supabase purchase order insert error:', error);
        throw new Error(`Error en Supabase al registrar orden de compra: ${error.message}`);
      }
    }

    this.data.purchaseOrders = [newPo, ...this.data.purchaseOrders];
    this.notify();
    return newPo;
  }

  public async deletePurchaseOrder(id: string, userId: string = 'd0000000-0000-0000-0000-000000000001', userName: string = 'Sistema'): Promise<boolean> {
    const po = this.data.purchaseOrders.find((p) => p.id === id);
    if (!po) return false;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('purchase_order_items').delete().eq('purchase_order_id', id);
      } catch (err) {
        console.warn('cleanup purchase_order_items warning:', err);
      }

      const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
      if (error) {
        console.error('Supabase purchase order delete error:', error);
        throw new Error(`Error en Supabase al eliminar orden de compra: ${error.message}`);
      }
    }

    this.data.purchaseOrders = this.data.purchaseOrders.filter((p) => p.id !== id);
    this.addAuditLog(userId, userName, 'ELIMINACION_ORDEN_COMPRA', 'Compras', id, `Orden de compra eliminada: ${po.order_number}`);
    this.notify();
    return true;
  }


  // --- COLA DE CORREO Y NOTIFICACIONES ---
  public enqueueEmail(
    recipient: string,
    subject: string,
    bodyHtml: string,
    templateType: string,
    docId?: string
  ): EmailQueueItem {
    const email: EmailQueueItem = {
      id: generateUUID(),
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
    this.notify();
    return email;
  }

  public retryEmail(id: string) {
    const email = this.data.emailQueue.find((e) => e.id === id);
    if (email) {
      email.attempts += 1;
      email.status = 'enviado';
      email.sent_at = new Date().toISOString();
      email.last_error = undefined;
      this.notify();
    }
  }

  public markNotificationAsRead(id: string) {
    const notif = this.data.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.notify();
    }
  }

  public updateSettings(newSettings: Partial<SystemSettings>, userId: string, userName: string) {
    const prev = { ...this.data.settings };
    this.data.settings = { ...this.data.settings, ...newSettings };

    if (isSupabaseConfigured && supabase) {
      supabase.from('system_settings').update({
        store_name: this.data.settings.store_name,
        trade_name: this.data.settings.trade_name,
        ruc: this.data.settings.ruc,
        address: this.data.settings.address,
        phone: this.data.settings.phone,
        email: this.data.settings.email,
        establishment_code: this.data.settings.establishment_code,
        emission_point_code: this.data.settings.emission_point_code,
        default_iva_rate: this.data.settings.default_iva_rate,
        allow_negative_stock: this.data.settings.allow_negative_stock,
        require_supervisor_for_discount: this.data.settings.require_supervisor_for_discount,
        max_cashier_discount: this.data.settings.max_cashier_discount,
        logo_url: this.data.settings.logo_url,
        updated_at: new Date().toISOString()
      }).eq('ruc', this.data.settings.ruc).then(({ error }) => {
        if (error) console.warn('Supabase settings update error:', error);
      });
    }

    this.addAuditLog(userId, userName, 'ACTUALIZACION_CONFIGURACION', 'Configuración General', 'SISTEMA', 'Actualización de parámetros generales de la tienda', prev, this.data.settings);
    this.notify();
  }
}

// Instancia única (Singleton) para toda la aplicación
export const db = new DatabaseEngine();
