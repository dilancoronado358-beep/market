// ==============================================================================
// CONTEXTO REACTIVO GENERAL DEL NEGOCIO (STORE CONTEXT)
// Sincroniza todos los módulos con el motor de base de datos en tiempo real
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, DatabaseSnapshot } from '../lib/databaseState';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface StoreContextType extends DatabaseSnapshot {
  refresh: () => void;
  // Métodos de negocio
  createProduct: (data: any, initialStock: number) => any;
  updateProduct: (id: string, updates: any, reason: string) => any;
  createSupplierVisit: (data: any) => any;
  addVisitReceiptItem: (visitId: string, itemData: any) => any;
  createProductFromVisit: (visitId: string, productData: any, receiptData: any) => any;
  reportSupplierIncident: (data: any) => any;
  registerSupplierReturn: (data: any) => any;
  processSupplierExchange: (data: any) => any;
  createSupplierReplacement: (data: any) => any;
  fulfillSupplierReplacement: (replacementId: string, qtyDelivered: number) => any;
  closeSupplierVisit: (visitId: string, notes: string) => any;
  processSale: (data: any) => any;
  cancelSale: (saleId: string, reason: string) => any;
  openCashSession: (registerCode: string, openingFloat: number, notes: string) => any;
  registerCashMovement: (sessionId: string, type: any, amount: number, reason: string) => any;
  closeCashSession: (sessionId: string, actualCountedCash: number, notes: string, supervisorId: string) => any;
  registerElectronicDocument: (doc: any) => any;
  updateElectronicDocumentStatus: (id: string, status: any, authNumber?: string, errorMessage?: string) => any;
  enqueueEmail: (recipient: string, subject: string, bodyHtml: string, templateType: string, docId?: string) => any;
  retryEmail: (id: string) => any;
  markNotificationAsRead: (id: string) => any;
  updateSettings: (newSettings: any) => any;
  createCustomer: (data: any) => any;
  createSupplier: (data: any) => any;
  createPurchaseOrder: (data: any) => any;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<DatabaseSnapshot>(db.getSnapshot());
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setSnapshot({ ...db.getSnapshot() });
    });
    return () => unsubscribe();
  }, []);

  const refresh = () => {
    setSnapshot({ ...db.getSnapshot() });
  };

  const currentUserId = user?.id || 'usr-system';
  const currentUserName = user?.full_name || 'Sistema';

  return (
    <StoreContext.Provider
      value={{
        ...snapshot,
        refresh,
        createProduct: (data, initialStock) => {
          try {
            const prod = db.createProduct(data, initialStock, currentUserId, currentUserName);
            toast.success(`Producto "${prod.name}" registrado correctamente.`);
            return prod;
          } catch (e: any) {
            toast.error(e.message || 'Error al crear producto');
            throw e;
          }
        },
        updateProduct: (id, updates, reason) => {
          try {
            const prod = db.updateProduct(id, updates, currentUserId, currentUserName, reason);
            toast.success(`Producto "${prod.name}" actualizado.`);
            return prod;
          } catch (e: any) {
            toast.error(e.message || 'Error al actualizar producto');
            throw e;
          }
        },
        createSupplierVisit: (data) => {
          try {
            const visit = db.createSupplierVisit(data, currentUserId, currentUserName);
            toast.success(`Visita ${visit.visit_number} iniciada.`);
            return visit;
          } catch (e: any) {
            toast.error(e.message || 'Error al iniciar visita');
            throw e;
          }
        },
        addVisitReceiptItem: (visitId, itemData) => {
          try {
            const item = db.addVisitReceiptItem(visitId, itemData, currentUserId, currentUserName);
            toast.success(`Línea agregada a la recepción (${item.accepted_qty} aceptadas).`);
            return item;
          } catch (e: any) {
            toast.error(e.message || 'Error al agregar línea');
            throw e;
          }
        },
        createProductFromVisit: (visitId, productData, receiptData) => {
          try {
            const prod = db.createProductFromVisit(visitId, productData, receiptData, currentUserId, currentUserName);
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
            toast.success(`Visita ${visit.visit_number} finalizada y acta digital generada.`);
            return visit;
          } catch (e: any) {
            toast.error(e.message || 'Error al cerrar visita');
            throw e;
          }
        },
        processSale: (data) => {
          try {
            const sale = db.processSale(data, currentUserId, currentUserName);
            toast.success(`Venta ${sale.sale_number} completada ($${sale.total_amount.toFixed(2)}).`);
            return sale;
          } catch (e: any) {
            toast.error(e.message || 'Error al procesar venta');
            throw e;
          }
        },
        cancelSale: (saleId, reason) => {
          try {
            const sale = db.cancelSale(saleId, reason, currentUserId, currentUserName);
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
            toast.info(`Turno de caja ${session.session_number} cerrado. Diferencia: $${session.difference?.toFixed(2)}`);
            return session;
          } catch (e: any) {
            toast.error(e.message || 'Error al cerrar turno de caja');
            throw e;
          }
        },
        registerElectronicDocument: (doc) => {
          db.registerElectronicDocument(doc, currentUserId, currentUserName);
        },
        updateElectronicDocumentStatus: (id, status, authNum, errorMsg) => {
          db.updateElectronicDocumentStatus(id, status, authNum, errorMsg);
        },
        enqueueEmail: (rec, subj, html, tpl, docId) => {
          return db.enqueueEmail(rec, subj, html, tpl, docId);
        },
        retryEmail: (id) => {
          db.retryEmail(id);
          toast.success('Correo reenviado con éxito.');
        },
        markNotificationAsRead: (id) => {
          db.markNotificationAsRead(id);
        },
        updateSettings: (newSettings) => {
          db.updateSettings(newSettings, currentUserId, currentUserName);
          toast.success('Configuración general actualizada.');
        },
        createCustomer: (data) => {
          return db.createCustomer(data);
        },
        createSupplier: (data) => {
          return db.createSupplier(data);
        },
        createPurchaseOrder: (data) => {
          return db.createPurchaseOrder(data);
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
