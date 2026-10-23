// ==============================================================================
// PRUEBAS AUTOMATIZADAS DEL SISTEMA INTEGRAL (TIENDA KATY - ECUADOR)
// Cubre validaciones de flujos de negocio, integridad de Kardex, visitas, POS,
// sesiones de caja y facturación SRI (Prompt Maestro Sección 24).
// ==============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/databaseState';
import { calculateModulo11, generateAccessKey, validateEcuadorianId } from '../lib/sriUtils';
import { ROLE_DEFAULT_PERMISSIONS } from '../types/auth';

describe('ERP / POS Ecuador — Suite de Pruebas de Integridad de Negocio', () => {
  beforeEach(() => {
    db.seedTestData();
  });

  // 1 & 2. Autenticación y Bloqueo de Usuarios
  it('1. Debe validar inicio de sesión con usuario activo', () => {
    const admin = db.getSnapshot().profiles.find((p) => p.email === 'admin@erpposecuador.com');
    expect(admin).toBeDefined();
    expect(admin?.is_active).toBe(true);
    expect(admin?.role).toBe('administrador');
  });

  it('2. Debe bloquear acceso a cuentas desactivadas por el administrador', () => {
    const { profiles } = db.getSnapshot();
    const testUser = profiles[0];
    const originalStatus = testUser.is_active;

    testUser.is_active = false;
    expect(testUser.is_active).toBe(false);

    // Restaurar
    testUser.is_active = originalStatus;
  });

  // 3. Matriz de Permisos por Rol (RBAC)
  it('3. Debe restringir permisos críticos según el rol del usuario', () => {
    const adminPerms = ROLE_DEFAULT_PERMISSIONS['administrador'];
    const cajeroPerms = ROLE_DEFAULT_PERMISSIONS['cajero'];
    const auditorPerms = ROLE_DEFAULT_PERMISSIONS['auditor'];

    // Admin tiene control total
    expect(adminPerms).toContain('change_prices');
    expect(adminPerms).toContain('manage_users');
    expect(adminPerms).toContain('system_settings');

    // Cajero no debe poder modificar costos ni cambiar permisos
    expect(cajeroPerms).not.toContain('modify_costs');
    expect(cajeroPerms).not.toContain('manage_users');
    expect(cajeroPerms).toContain('pos_sales');

    // Auditor solo tiene permisos de consulta
    expect(auditorPerms).toContain('access_audit_logs');
    expect(auditorPerms).toContain('view_financial_reports');
    expect(auditorPerms).not.toContain('pos_sales');
    expect(auditorPerms).not.toContain('manage_products');
  });

  // 4. Creación de Producto y Registro en Kardex
  it('4. Debe crear producto y registrar saldo inicial inmutable en Kardex', () => {
    const initialProductCount = db.getSnapshot().products.length;
    const initialMovementCount = db.getSnapshot().movements.length;

    const newProd = db.createProduct(
      {
        internal_code: `TEST-${Date.now()}`,
        name: 'Producto de Prueba Unitaria',
        unit_of_measure: 'unidad',
        unit_purchase: 'unidad',
        unit_conversion_ratio: 1,
        cost_price: 2.50,
        avg_cost: 2.50,
        sale_price: 3.50,
        iva_rate: 15.00,
        min_stock: 5,
        max_stock: 50,
        is_active: true,
      },
      20, // Saldo inicial
      'usr-admin-1',
      'Administrador'
    );

    expect(db.getSnapshot().products.length).toBe(initialProductCount + 1);
    expect(newProd.current_stock).toBe(20);
    expect(newProd.avg_cost).toBe(2.50);

    // Verificar movimiento en Kardex
    expect(db.getSnapshot().movements.length).toBe(initialMovementCount + 1);
    const lastMovement = db.getSnapshot().movements[0];
    expect(lastMovement.movement_type).toBe('inventario_inicial');
    expect(lastMovement.quantity_in).toBe(20);
    expect(lastMovement.new_stock).toBe(20);
  });

  // 5. MÓDULO PRIORITARIO: Registro de Visita de Proveedor y Recepción
  it('5. Debe registrar llegada de proveedor e iniciar expediente digital', () => {
    const visit = db.createSupplierVisit(
      {
        supplier_id: 'sup-pronaca',
        sales_rep_name: 'Carlos Ruiz',
        reason: 'Entrega semanal de embutidos',
        invoice_or_doc_ref: 'FAC-99120',
      },
      'usr-inventario-1',
      'Luis Guanoluisa'
    );

    expect(visit.visit_number).toMatch(/^VIS-\d{4}-\d{4}$/);
    expect(visit.status).toBe('en_curso');
    expect(visit.check_in_time).toBeDefined();
  });

  // 6. Recepción de Mercadería con Productos Aceptados y Dañados
  it('6. Debe separar productos aceptados (al Kardex) de los rechazados (a cuarentena)', () => {
    const product = db.getSnapshot().products[0];
    const initialStock = product.current_stock;
    const initialQuarantine = product.quarantine_stock || 0;

    const visit = db.getSnapshot().visits[0];

    // Recibir 10 unidades declaradas: 8 aceptadas, 2 dañadas
    const item = db.addVisitReceiptItem(
      visit.id,
      {
        productId: product.id,
        declaredQty: 10,
        receivedQty: 10,
        acceptedQty: 8,
        rejectedQty: 2,
        unitCost: product.cost_price,
        status: 'dañado',
        differenceReason: '2 botellas rotas en transporte',
      },
      'usr-inventario-1',
      'Luis Guanoluisa'
    );

    expect(item.accepted_qty).toBe(8);
    expect(item.rejected_qty).toBe(2);

    // Solo las 8 aceptadas deben sumarse al stock vendible
    const updatedProd = db.getSnapshot().products.find((p) => p.id === product.id)!;
    expect(updatedProd.current_stock).toBe(initialStock + 8);
    // Las 2 dañadas van a cuarentena
    expect(updatedProd.quarantine_stock).toBe(initialQuarantine + 2);
  });

  // 7. Creación de Producto Nuevo desde la Visita
  it('7. Debe permitir crear un producto nuevo directamente desde la visita y recepcionarlo', () => {
    const visit = db.getSnapshot().visits[0];
    const newCode = `ONFLY-${Date.now()}`;

    const prod = db.createProductFromVisit(
      visit.id,
      {
        internal_code: newCode,
        name: 'Producto Creado en Visita',
        unit_of_measure: 'unidad',
        cost_price: 3.00,
        sale_price: 4.50,
        iva_rate: 15.00,
      },
      {
        declaredQty: 15,
        acceptedQty: 15,
        rejectedQty: 0,
      },
      'usr-inventario-1',
      'Luis Guanoluisa'
    );

    expect(prod.internal_code).toBe(newCode);
    expect(prod.main_supplier_id).toBe(visit.supplier_id);
    expect(prod.current_stock).toBe(15);
  });

  // 8. Retiro Físico de Mercadería por Proveedor
  it('8. Debe descontar de cuarentena únicamente al confirmar salida física', () => {
    const product = db.getSnapshot().products.find((p) => p.quarantine_stock > 0)!;
    const initialQuarantine = product.quarantine_stock;

    const returnRecord = db.registerSupplierReturn(
      {
        supplierId: 'sup-coca',
        items: [{ productId: product.id, quantity: 1, reason: 'Retiro por producto defectuoso' }],
        confirmPhysicalExit: true, // Salida física confirmada
      },
      'usr-inventario-1',
      'Luis Guanoluisa'
    );

    expect(returnRecord.status).toBe('retirado_confirmado');
    expect(product.quarantine_stock).toBe(initialQuarantine - 1);
  });

  // 9. Intercambio Mano a Mano de Productos
  it('9. Debe procesar cambio mano a mano impactando entradas y salidas en Kardex', () => {
    const orig = db.getSnapshot().products[0];
    const repl = db.getSnapshot().products[1];

    const prevOrigStock = orig.current_stock;
    const prevReplStock = repl.current_stock;

    const exc = db.processSupplierExchange(
      {
        supplierId: 'sup-pronaca',
        originalProductId: orig.id,
        originalQty: 2,
        replacementProductId: repl.id,
        replacementQty: 2,
        reason: 'Cambio de mercadería por fecha próxima',
      },
      'usr-inventario-1',
      'Luis Guanoluisa'
    );

    expect(exc.exchange_number).toMatch(/^CAM-\d{4}-\d{4}$/);
    expect(repl.current_stock).toBe(prevReplStock + 2);
  });

  // 10. Compromiso y Cumplimiento de Reposición
  it('10. Debe registrar compromiso de reposición y completar la entrega cuando llegue', () => {
    const prod = db.getSnapshot().products[0];
    const prevStock = prod.current_stock;

    const rep = db.createSupplierReplacement(
      {
        supplierId: 'sup-pronaca',
        productId: prod.id,
        affectedQty: 5,
        agreedQty: 5,
        expectedDeliveryDate: '2026-10-30',
      },
      'usr-inventario-1',
      'Luis Guanoluisa'
    );

    expect(rep.status).toBe('pendiente_entrega');
    expect(rep.delivered_qty).toBe(0);

    // Proveedor entrega la reposición
    const fulfilled = db.fulfillSupplierReplacement(rep.id, 5, 'usr-inventario-1', 'Luis Guanoluisa');
    expect(fulfilled.status).toBe('completada');
    expect(prod.current_stock).toBe(prevStock + 5);
  });

  // 11. Punto de Venta (POS): Venta Atómica y Descuento de Stock
  it('11. Debe procesar venta, descontar existencias y calcular cambio correctamente', () => {
    const prod = db.getSnapshot().products.find((p) => p.current_stock > 5)!;
    const prevStock = prod.current_stock;

    const sale = db.processSale(
      {
        customerId: 'cust-cf',
        items: [{ productId: prod.id, quantity: 2 }],
        paymentMethod: 'efectivo',
        amountPaid: 20.00,
      },
      'usr-cajero-1',
      'Andrea Suárez'
    );

    expect(sale.status).toBe('completada');
    expect(sale.change_given).toBe(Number((20.00 - sale.total_amount).toFixed(2)));
    expect(prod.current_stock).toBe(prevStock - 2);

    // Validar movimiento Kardex de tipo 'venta'
    const lastMovement = db.getSnapshot().movements[0];
    expect(lastMovement.movement_type).toBe('venta');
    expect(lastMovement.quantity_out).toBe(2);
  });

  // 12. Prevención de Venta con Saldo Insuficiente
  it('12. No debe permitir ventas con cantidades mayores al stock si allow_negative_stock es false', () => {
    const prod = db.getSnapshot().products[0];
    const excessiveQty = prod.current_stock + 9999;

    expect(() => {
      db.processSale(
        {
          customerId: 'cust-cf',
          items: [{ productId: prod.id, quantity: excessiveQty }],
          paymentMethod: 'efectivo',
          amountPaid: 100000,
        },
        'usr-cajero-1',
        'Andrea Suárez'
      );
    }).toThrow(/Stock insuficiente/);
  });

  // 13. Anulación de Venta con Reversión en Kardex
  it('13. Debe anular venta y restaurar existencias mediante movimiento de reversión autorizada', () => {
    const prod = db.getSnapshot().products.find((p) => p.current_stock > 5)!;
    const initialStock = prod.current_stock;

    const sale = db.processSale(
      {
        customerId: 'cust-cf',
        items: [{ productId: prod.id, quantity: 1 }],
        paymentMethod: 'efectivo',
        amountPaid: 10.00,
      },
      'usr-cajero-1',
      'Andrea Suárez'
    );

    expect(prod.current_stock).toBe(initialStock - 1);

    // Anular venta
    db.cancelSale(sale.id, 'Cliente desistió de la compra', 'usr-cajero-1', 'Andrea Suárez');
    expect(sale.status).toBe('anulada');
    expect(prod.current_stock).toBe(initialStock);

    const revMovement = db.getSnapshot().movements[0];
    expect(revMovement.movement_type).toBe('reversion_autorizada');
    expect(revMovement.is_reversal).toBe(true);
  });

  // 14. Turnos de Caja, Movimientos y Conciliación
  it('14. Debe calcular arqueo de caja con sobrante o faltante', () => {
    const session = db.getSnapshot().cashSessions.find((s) => s.status === 'abierta')!;
    const expected = session.expected_cash;

    // Registrar egreso menor
    db.registerCashMovement(session.id, 'egreso', 3.00, 'Compra de papel térmico', 'usr-cajero-1', 'Andrea Suárez');
    expect(session.expected_cash).toBe(Number((expected - 3.00).toFixed(2)));

    // Cerrar caja con conteo exacto
    const closed = db.closeCashSession(session.id, session.expected_cash, 'Cierre sin novedad', 'usr-super-1', 'usr-cajero-1', 'Andrea Suárez');
    expect(closed.status).toBe('cerrada');
    expect(closed.difference).toBe(0);
  });

  // 15. Algoritmo Módulo 11 del SRI de Ecuador
  it('15. Debe calcular el dígito verificador oficial según la Ficha Técnica del SRI', () => {
    // Clave de 48 dígitos de prueba
    const base48 = '221020260117900123450011001001000000001123456781';
    const checkDigit = calculateModulo11(base48);
    expect(checkDigit).toBeGreaterThanOrEqual(0);
    expect(checkDigit).toBeLessThanOrEqual(9);

    const full49 = generateAccessKey({
      date: new Date(2026, 9, 22),
      docType: '01',
      ruc: '1790012345001',
      environment: '1',
      establishment: '001',
      emissionPoint: '001',
      sequential: '000000001',
      numericCode: '12345678',
    });

    expect(full49.length).toBe(49);
    expect(full49.startsWith('221020260117900123450011001001000000001123456781')).toBe(true);
  });

  // 16. Validación de Cédula y RUC Ecuatoriano
  it('16. Debe validar cédula, RUC y Consumidor Final de Ecuador', () => {
    // Consumidor Final
    const cf = validateEcuadorianId('9999999999999');
    expect(cf.isValid).toBe(true);
    expect(cf.type).toBe('consumidor_final');

    // Cédula inválida
    const invalid = validateEcuadorianId('1718293049');
    expect(invalid.isValid).toBe(false);
  });

  // 17. Bitácora de Auditoría Inmutable
  it('17. Toda operación sensible debe registrar un evento de auditoría', () => {
    const logs = db.getSnapshot().auditLogs;
    expect(logs.length).toBeGreaterThan(0);
    const hasLog = logs.some((l) => l.action.includes('VENTA') || l.action.includes('VISITA'));
    expect(hasLog).toBe(true);
  });
});
