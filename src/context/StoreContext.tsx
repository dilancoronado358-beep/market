// ==============================================================================
// CONTEXTO REACTIVO GENERAL DEL NEGOCIO (STORE CONTEXT)
// Sincroniza todos los módulos con el motor de base de datos en tiempo real (Supabase PostgreSQL)
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, DatabaseSnapshot } from '../lib/databaseState';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface StoreContextType extends DatabaseSnapshot {
  isStoreLoading: boolean;
  refresh: () => Promise<void>;
  // Métodos de negocio asíncronos con persistencia directa en Supabase
  createProduct: (data: any, initialStock: number) => Promise<any>;
  updateProduct: (id: string, updates: any, reason: string) => Promise<any>;
  createSupplierVisit: (data: any) => Promise<any>;
  addVisitReceiptItem: (visitId: string, itemData: any) => Promise<any>;
  createProductFromVisit: (visitId: string, productData: any, receiptData: any) => Promise<any>;
  reportSupplierIncident: (data: any) => any;
  registerSupplierReturn: (data: any) => any;
  processSupplierExchange: (data: any) => any;
  createSupplierReplacement: (data: any) => any;
  fulfillSupplierReplacement: (replacementId: string, qtyDelivered: number) => any;
  closeSupplierVisit: (visitId: string, notes: string) => any;
  processSale: (data: any) => Promise<any>;
  cancelSale: (saleId: string, reason: string) => Promise<any>;
  openCashSession: (registerCode: string, openingFloat: number, notes: string) => any;
  registerCashMovement: (sessionId: string, type: any, amount: number, reason: string) => any;
  closeCashSession: (sessionId: string, actualCountedCash: number, notes: string, supervisorId: string) => any;
  registerElectronicDocument: (doc: any) => any;
  updateElectronicDocumentStatus: (id: string, status: any, authNumber?: string, errorMessage?: string) => any;
  enqueueEmail: (recipient: string, subject: string, bodyHtml: string, templateType: string, docId?: string) => any;
  retryEmail: (id: string) => any;
  markNotificationAsRead: (id: string) => any;
  updateSettings: (newSettings: any) => any;
  createCustomer: (data: any) => Promise<any>;
  createSupplier: (data: any) => Promise<any>;
  createPurchaseOrder: (data: any) => Promise<any>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<DatabaseSnapshot>(db.getSnapshot());
  const [isStoreLoading, setIsStoreLoading] = useState<boolean>(!db.isInitialized);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;

    // 1. Suscribirse a cambios locales y en tiempo real
    const unsubscribe = db.subscribe(() => {
      if (isMounted) {
        setSnapshot({ ...db.getSnapshot() });
      }
    });

    // 2. Activar Realtime con Supabase (multi-dispositivo)
    db.initRealtime();

    // 3. Forzar sincronización completa con Supabase al montar el Provider
    db.syncWithSupabase()
      .then((liveData) => {
        if (isMounted) {
          setSnapshot({ ...liveData });
          setIsStoreLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error en sincronización inicial con Supabase:', err);
        if (isMounted) {
          setIsStoreLoading(false);
        }
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const refresh = async () => {
    setIsStoreLoading(true);
    try {
      const liveData = await db.syncWithSupabase();
      setSnapshot({ ...liveData });
      toast.success('Datos actualizados desde Supabase en la nube.');
    } catch {
      toast.error('Error al sincronizar con Supabase');
    } finally {
      setIsStoreLoading(false);
    }
  };

  const currentUserId = user?.id || 'usr-system';
  const currentUserName = user?.full_name || 'Sistema';

  return (
    <StoreContext.Provider
      value={{
        ...snapshot,
        isStoreLoading,
        refresh,
        createProduct: async (data, initialStock) => {
          try {
            const prod = await db.createProduct(data, initialStock, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Producto "${prod.name}" guardado exitosamente en Supabase.`);
            return prod;
          } catch (e: any) {
            toast.error(e.message || 'Error al guardar producto en Supabase');
            throw e;
          }
        },
        updateProduct: async (id, updates, reason) => {
          try {
            const prod = await db.updateProduct(id, updates, currentUserId, currentUserName, reason);
            setSnapshot(db.getSnapshot());
            toast.success(`Producto "${prod.name}" actualizado en Supabase.`);
            return prod;
          } catch (e: any) {
            toast.error(e.message || 'Error al actualizar producto en Supabase');
            throw e;
          }
        },
        createSupplierVisit: async (data) => {
          try {
            const visit = await db.createSupplierVisit(data, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Visita ${visit.visit_number} registrada en Supabase.`);
            return visit;
          } catch (e: any) {
            toast.error(e.message || 'Error al registrar visita');
            throw e;
          }
        },
        addVisitReceiptItem: async (visitId, itemData) => {
          try {
            const item = await db.addVisitReceiptItem(visitId, itemData, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Línea agregada a la recepción (${item.accepted_qty} aceptadas).`);
            return item;
          } catch (e: any) {
            toast.error(e.message || 'Error al agregar línea');
            throw e;
          }
        },
        createProductFromVisit: async (visitId, productData, receiptData) => {
          try {
            const prod = await db.createProductFromVisit(visitId, productData, receiptData, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Producto nuevo "${prod.name}" creado e incorporado a la visita.`);
            return prod;
          } catch (e: any) {
            toast.error(e.message || 'Error al crear producto en visita');
            throw e;
          }
        },
        reportSupplierIncident: (data) => {
          try {
            const inc = db.reportSupplierIncident(data, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.warning(`Incidencia ${inc.incident_number} reportada.`);
            return inc;
          } catch (e: any) {
            toast.error(e.message || 'Error al reportar daño');
            throw e;
          }
        },
        registerSupplierReturn: (data) => {
          try {
            const ret = db.registerSupplierReturn(data, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Retiro ${ret.return_number} registrado (${data.confirmPhysicalExit ? 'Salida confirmada' : 'Segregado'}).`);
            return ret;
          } catch (e: any) {
            toast.error(e.message || 'Error al registrar retiro');
            throw e;
          }
        },
        processSupplierExchange: (data) => {
          try {
            const exc = db.processSupplierExchange(data, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Cambio de producto ${exc.exchange_number} completado.`);
            return exc;
          } catch (e: any) {
            toast.error(e.message || 'Error al procesar cambio');
            throw e;
          }
        },
        createSupplierReplacement: (data) => {
          try {
            const rep = db.createSupplierReplacement(data, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.info(`Compromiso ${rep.replacement_number} agendado para ${rep.expected_delivery_date}.`);
            return rep;
          } catch (e: any) {
            toast.error(e.message || 'Error al agendar reposición');
            throw e;
          }
        },
        fulfillSupplierReplacement: (repId, qty) => {
          try {
            const rep = db.fulfillSupplierReplacement(repId, qty, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Reposición ${rep.replacement_number}: ${qty} unidades recibidas e ingresadas a inventario.`);
            return rep;
          } catch (e: any) {
            toast.error(e.message || 'Error al cumplir reposición');
            throw e;
          }
        },
        closeSupplierVisit: (visitId, notes) => {
          try {
            const visit = db.closeSupplierVisit(visitId, notes, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Visita ${visit.visit_number} finalizada y acta digital generada.`);
            return visit;
          } catch (e: any) {
            toast.error(e.message || 'Error al cerrar visita');
            throw e;
          }
        },
        processSale: async (data) => {
          try {
            const sale = await db.processSale(data, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Venta ${sale.sale_number} completada en Supabase ($${sale.total_amount.toFixed(2)}).`);
            return sale;
          } catch (e: any) {
            toast.error(e.message || 'Error al procesar venta');
            throw e;
          }
        },
        cancelSale: async (saleId, reason) => {
          try {
            const sale = await db.cancelSale(saleId, reason, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.warning(`Venta ${sale.sale_number} anulada e inventario revertido.`);
            return sale;
          } catch (e: any) {
            toast.error(e.message || 'Error al anular venta');
            throw e;
          }
        },
        openCashSession: (registerCode, floatAmount, notes) => {
          try {
            const session = db.openCashSession(registerCode, floatAmount, notes, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Turno de caja ${session.session_number} abierto.`);
            return session;
          } catch (e: any) {
            toast.error(e.message || 'Error al abrir turno');
            throw e;
          }
        },
        registerCashMovement: (sessionId, type, amount, reason) => {
          try {
            const mov = db.registerCashMovement(sessionId, type, amount, reason, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.success(`Movimiento de caja registrado ($${amount.toFixed(2)}).`);
            return mov;
          } catch (e: any) {
            toast.error(e.message || 'Error al registrar movimiento en caja');
            throw e;
          }
        },
        closeCashSession: (sessionId, counted, notes, supervisorId) => {
          try {
            const session = db.closeCashSession(sessionId, counted, notes, supervisorId, currentUserId, currentUserName);
            setSnapshot(db.getSnapshot());
            toast.info(`Turno de caja ${session.session_number} cerrado. Diferencia: $${session.difference?.toFixed(2)}`);
            return session;
          } catch (e: any) {
            toast.error(e.message || 'Error al cerrar turno de caja');
            throw e;
          }
        },
        registerElectronicDocument: (doc) => {
          db.registerElectronicDocument(doc, currentUserId, currentUserName);
          setSnapshot(db.getSnapshot());
        },
        updateElectronicDocumentStatus: (id, status, authNum, errorMsg) => {
          db.updateElectronicDocumentStatus(id, status, authNum, errorMsg);
          setSnapshot(db.getSnapshot());
        },
        enqueueEmail: (rec, subj, html, tpl, docId) => {
          const res = db.enqueueEmail(rec, subj, html, tpl, docId);
          setSnapshot(db.getSnapshot());
          return res;
        },
        retryEmail: (id) => {
          db.retryEmail(id);
          setSnapshot(db.getSnapshot());
          toast.success('Correo reenviado con éxito.');
        },
        markNotificationAsRead: (id) => {
          db.markNotificationAsRead(id);
          setSnapshot(db.getSnapshot());
        },
        updateSettings: (newSettings) => {
          db.updateSettings(newSettings, currentUserId, currentUserName);
          setSnapshot(db.getSnapshot());
          toast.success('Configuración general actualizada.');
        },
        createCustomer: async (data) => {
          try {
            const cust = await db.createCustomer(data);
            setSnapshot(db.getSnapshot());
            toast.success(`Cliente "${cust.full_name}" registrado en Supabase.`);
            return cust;
          } catch (e: any) {
            toast.error(e.message || 'Error al registrar cliente');
            throw e;
          }
        },
        createSupplier: async (data) => {
          try {
            const sup = await db.createSupplier(data);
            setSnapshot(db.getSnapshot());
            toast.success(`Proveedor "${sup.trade_name || sup.business_name}" registrado en Supabase.`);
            return sup;
          } catch (e: any) {
            toast.error(e.message || 'Error al registrar proveedor');
            throw e;
          }
        },
        createPurchaseOrder: async (data) => {
          try {
            const po = await db.createPurchaseOrder(data);
            setSnapshot(db.getSnapshot());
            toast.success(`Orden de compra "${po.order_number}" registrada en Supabase.`);
            return po;
          } catch (e: any) {
            toast.error(e.message || 'Error al registrar orden de compra');
            throw e;
          }
        },
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore debe ser utilizado dentro de un StoreProvider');
  }
  return context;
};
