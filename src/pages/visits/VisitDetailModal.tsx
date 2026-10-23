import React, { useState } from 'react';
import {
  SupplierVisit,
  SupplierVisitItem,
  SupplierIncident,
  SupplierReturn,
  SupplierExchange,
  SupplierReplacement,
  Product,
} from '../../types/database';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { generateActaVisitaPdf } from '../../lib/pdfGenerator';
import {
  PackagePlus,
  Plus,
  AlertTriangle,
  RotateCcw,
  ArrowRightLeft,
  CalendarClock,
  Printer,
  FileCheck2,
  CheckCircle,
  Clock,
  FileText,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

interface VisitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: SupplierVisit;
}

export const VisitDetailModal: React.FC<VisitDetailModalProps> = ({
  isOpen,
  onClose,
  visit,
}) => {
  const { user } = useAuth();
  const {
    suppliers,
    products,
    categories,
    visitItems,
    incidents,
    returns,
    exchanges,
    replacements,
    addVisitReceiptItem,
    createProductFromVisit,
    reportSupplierIncident,
    registerSupplierReturn,
    processSupplierExchange,
    createSupplierReplacement,
    fulfillSupplierReplacement,
    closeSupplierVisit,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'recepcion' | 'nuevo_producto' | 'retiros' | 'cambios' | 'incidencias' | 'reposiciones' | 'cierre'
  >('recepcion');

  const supplier = suppliers.find((s) => s.id === visit.supplier_id);
  const itemsOfVisit = visitItems.filter((i) => i.visit_id === visit.id);
  const incidentsOfVisit = incidents.filter((i) => i.visit_id === visit.id);
  const returnsOfVisit = returns.filter((r) => r.visit_id === visit.id);
  const exchangesOfVisit = exchanges.filter((e) => e.visit_id === visit.id);
  const replacementsOfVisit = replacements.filter((r) => r.origin_visit_id === visit.id);

  // Formulario de Recepción de Mercadería
  const [selectedProductId, setSelectedProductId] = useState('');
  const [declaredQty, setDeclaredQty] = useState<number>(1);
  const [acceptedQty, setAcceptedQty] = useState<number>(1);
  const [rejectedQty, setRejectedQty] = useState<number>(0);
  const [receiptCost, setReceiptCost] = useState<number>(0);
  const [receiptLot, setReceiptLot] = useState('');
  const [receiptExpiry, setReceiptExpiry] = useState('');
  const [differenceReason, setDifferenceReason] = useState('');

  // Formulario de Producto Nuevo en Visita
  const [npCode, setNpCode] = useState('');
  const [npBarcode, setNpBarcode] = useState('');
  const [npName, setNpName] = useState('');
  const [npCategory, setNpCategory] = useState('');
  const [npBrand, setNpBrand] = useState('');
  const [npUnit, setNpUnit] = useState('unidad');
  const [npCost, setNpCost] = useState<number>(1.0);
  const [npSalePrice, setNpSalePrice] = useState<number>(1.5);
  const [npIvaRate, setNpIvaRate] = useState<number>(15.0);
  const [npDeclaredQty, setNpDeclaredQty] = useState<number>(10);
  const [npAcceptedQty, setNpAcceptedQty] = useState<number>(10);

  // Formulario de Retiro / Devolución
  const [returnProductId, setReturnProductId] = useState('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState('Producto con daño físico / tara');
  const [confirmDeparture, setConfirmDeparture] = useState(true);

  // Formulario de Cambio Mano a Mano
  const [exOrigProdId, setExOrigProdId] = useState('');
  const [exOrigQty, setExOrigQty] = useState<number>(1);
  const [exReplProdId, setExReplProdId] = useState('');
  const [exReplQty, setExReplQty] = useState<number>(1);
  const [exReason, setExReason] = useState('Cambio por daño o fecha próxima de vencimiento');

  // Formulario de Compromiso de Reposición
  const [repProdId, setRepProdId] = useState('');
  const [repQty, setRepQty] = useState<number>(1);
  const [repDate, setRepDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [repNotes, setRepNotes] = useState('');

  // Cierre de Visita
  const [closingNotes, setClosingNotes] = useState('');

  // Manejador selección de producto para auto-cargar costo
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setReceiptCost(prod.cost_price || 0);
    }
  };

  // Agregar línea recibida
  const handleAddReceiptItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Seleccione un producto para la recepción');
      return;
    }
    const isDamaged = rejectedQty > 0;
    addVisitReceiptItem(visit.id, {
      productId: selectedProductId,
      declaredQty,
      receivedQty: acceptedQty + rejectedQty,
      acceptedQty,
      rejectedQty,
      unitCost: receiptCost,
      lotNumber: receiptLot,
      expirationDate: receiptExpiry,
      status: isDamaged ? 'dañado' : (acceptedQty === declaredQty ? 'recibido_conforme' : 'recibido_con_diferencias'),
      differenceReason: differenceReason || (isDamaged ? 'Mercadería dañada o con diferencias' : undefined),
    });

    // Reset
    setSelectedProductId('');
    setDeclaredQty(1);
    setAcceptedQty(1);
    setRejectedQty(0);
    setDifferenceReason('');
  };

  // Crear producto nuevo en la visita
  const handleCreateProductInVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!npCode || !npName) {
      toast.error('Código y Nombre son obligatorios');
      return;
    }

    createProductFromVisit(
      visit.id,
      {
        internal_code: npCode,
        barcode: npBarcode,
        name: npName,
        category_id: npCategory || undefined,
        brand: npBrand,
        unit_of_measure: npUnit,
        cost_price: npCost,
        sale_price: npSalePrice,
        iva_rate: npIvaRate,
      },
      {
        declaredQty: npDeclaredQty,
        acceptedQty: npAcceptedQty,
        rejectedQty: 0,
        notes: 'Producto nuevo ingresado durante la visita de proveedor',
      }
    );

    setActiveTab('recepcion');
    // Reset
    setNpCode('');
    setNpBarcode('');
    setNpName('');
  };

  // Procesar Retiro de Mercadería
  const handleRegisterReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnProductId) {
      toast.error('Seleccione un producto para el retiro');
      return;
    }

    registerSupplierReturn({
      supplierId: visit.supplier_id,
      visitId: visit.id,
      items: [{ productId: returnProductId, quantity: returnQty, reason: returnReason }],
      carrierOrRepName: visit.sales_rep_name,
      documentRef: visit.invoice_or_doc_ref,
      confirmPhysicalExit: confirmDeparture,
    });

    setReturnProductId('');
    setReturnQty(1);
  };

  // Procesar Cambio Mano a Mano
  const handleProcessExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exOrigProdId || !exReplProdId) {
      toast.error('Seleccione el producto original y el producto de reemplazo');
      return;
    }

    processSupplierExchange({
      visitId: visit.id,
      supplierId: visit.supplier_id,
      originalProductId: exOrigProdId,
      originalQty: exOrigQty,
      replacementProductId: exReplProdId,
      replacementQty: exReplQty,
      reason: exReason,
    });

    setExOrigProdId('');
    setExReplProdId('');
  };

  // Agendar Compromiso de Reposición
  const handleCreateReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repProdId) {
      toast.error('Seleccione el producto para el compromiso');
      return;
    }

    createSupplierReplacement({
      originVisitId: visit.id,
      supplierId: visit.supplier_id,
      productId: repProdId,
      affectedQty: repQty,
      agreedQty: repQty,
      expectedDeliveryDate: repDate,
      notes: repNotes,
    });

    setRepProdId('');
    setRepQty(1);
    setRepNotes('');
  };

  // Descargar Acta en PDF
  const handleDownloadActa = () => {
    const doc = generateActaVisitaPdf({
      visit,
      supplierName: supplier?.business_name || 'Proveedor',
      supplierRuc: supplier?.ruc || '1790000000001',
      receiverName: user?.full_name || 'Personal ERP / POS Ecuador',
      items: itemsOfVisit,
      incidents: incidentsOfVisit,
      replacements: replacementsOfVisit,
    });
    doc.save(`Acta_Visita_${visit.visit_number}.pdf`);
    toast.success('Acta de visita descargada en formato PDF');
  };

  // Cerrar Visita Formalmente
  const handleCloseVisit = () => {
    if (visit.status === 'finalizada') {
      toast.info('Esta visita ya ha sido cerrada previamente');
      return;
    }
    closeSupplierVisit(visit.id, closingNotes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Expediente Digital: ${visit.visit_number}`}
      subtitle={`Proveedor: ${supplier?.trade_name || supplier?.business_name} • Vendedor: ${visit.sales_rep_name}`}
      maxWidth="5xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="w-4 h-4" />}
              onClick={handleDownloadActa}
            >
              Imprimir / PDF Acta
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cerrar Expediente
            </Button>
            {visit.status !== 'finalizada' && (
              <Button
                variant="primary"
                icon={<CheckCircle className="w-4 h-4" />}
                onClick={() => setActiveTab('cierre')}
              >
                Finalizar Visita
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Cabecera del Expediente */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Estado Visita</span>
            <span className="font-bold text-slate-800 dark:text-white capitalize">
              {visit.status.replace('_', ' ')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Hora de Llegada</span>
            <span className="font-medium text-slate-800 dark:text-white flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              {new Date(visit.check_in_time).toLocaleString('es-EC')}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Factura / Guía Ref</span>
            <span className="font-mono font-medium text-slate-800 dark:text-white">
              {visit.invoice_or_doc_ref || 'Sin documento asignado'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 font-semibold block uppercase text-[10px]">Alertas Activas</span>
            <span className="font-medium">
              {visit.has_incidents ? (
                <span className="text-rose-500 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Con Daños/Incidencias
                </span>
              ) : (
                <span className="text-emerald-500 font-bold">Sin anomalías</span>
              )}
            </span>
          </div>
        </div>

        {/* Pestañas del Expediente */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'recepcion', label: `Mercadería Recibida (${itemsOfVisit.length})`, icon: <Boxes className="w-4 h-4" /> },
            { id: 'nuevo_producto', label: 'Crear Producto en Visita', icon: <PackagePlus className="w-4 h-4" /> },
            { id: 'retiros', label: `Mercadería que se Lleva (${returnsOfVisit.length})`, icon: <RotateCcw className="w-4 h-4" /> },
            { id: 'cambios', label: `Cambios Mano a Mano (${exchangesOfVisit.length})`, icon: <ArrowRightLeft className="w-4 h-4" /> },
            { id: 'incidencias', label: `Productos Dañados (${incidentsOfVisit.length})`, icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
            { id: 'reposiciones', label: `Reposiciones Acordadas (${replacementsOfVisit.length})`, icon: <CalendarClock className="w-4 h-4 text-blue-500" /> },
            { id: 'cierre', label: 'Acta & Cierre Formal', icon: <FileCheck2 className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 1. TAB: RECEPCIÓN DE MERCADERÍA */}
        {activeTab === 'recepcion' && (
          <div className="space-y-6">
            {/* Formulario de agregar línea */}
            {visit.status !== 'finalizada' && (
              <form onSubmit={handleAddReceiptItem} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Registrar Línea de Mercadería Entregada
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Las unidades aceptadas se sumarán al Kardex automáticamente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Producto del Catálogo
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Seleccionar Producto --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.internal_code}) — Stock Actual: {p.current_stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Costo Unitario ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={receiptCost}
                      onChange={(e) => setReceiptCost(parseFloat(e.target.value) || 0)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Cant. Declarada
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={declaredQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setDeclaredQty(val);
                        setAcceptedQty(val);
                      }}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 text-emerald-600">
                      Cant. Aceptada (Venta)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={acceptedQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setAcceptedQty(val);
                        setRejectedQty(Math.max(0, declaredQty - val));
                      }}
                      className="input-field font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 text-rose-500">
                      Cant. Rechazada / Dañada
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={rejectedQty}
                      onChange={(e) => setRejectedQty(parseInt(e.target.value) || 0)}
                      className="input-field font-bold text-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Lote
                    </label>
                    <input
                      type="text"
                      placeholder="L-2026-X"
                      value={receiptLot}
                      onChange={(e) => setReceiptLot(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Caducidad
                    </label>
                    <input
                      type="date"
                      value={receiptExpiry}
                      onChange={(e) => setReceiptExpiry(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {rejectedQty > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-rose-600 mb-1">
                      Motivo de Rechazo o Daño Físico (Se enviará a cuarentena)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Empaque roto, frasco quebrado, fuga de líquido"
                      value={differenceReason}
                      onChange={(e) => setDifferenceReason(e.target.value)}
                      className="input-field border-rose-300 text-rose-700"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end">
                  <Button type="submit" size="sm" icon={<Plus className="w-4 h-4" />}>
                    Confirmar Línea de Mercadería
                  </Button>
                </div>
              </form>
            )}

            {/* Tabla de líneas recibidas */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-850 font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-center">Declarado</th>
                    <th className="px-4 py-3 text-center">Aceptado</th>
                    <th className="px-4 py-3 text-center">Rechazado</th>
                    <th className="px-4 py-3 text-right">Costo Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal Aceptado</th>
                    <th className="px-4 py-3">Estado Línea</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {itemsOfVisit.length > 0 ? (
                    itemsOfVisit.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {item.product_name}
                          {item.is_new_product && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold">
                              NUEVO
                            </span>
                          )}
                          {item.lot_number && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Lote: {item.lot_number} • Vence: {item.expiration_date || 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{item.declared_qty}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-600 font-mono">
                          {item.accepted_qty}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-rose-600 font-mono">
                          {item.rejected_qty}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">${item.unit_cost.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-bold font-mono">
                          ${(item.accepted_qty * item.unit_cost).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={item.rejected_qty > 0 ? 'danger' : 'success'}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          {item.difference_reason && (
                            <p className="text-[10px] text-rose-500 mt-0.5">{item.difference_reason}</p>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No se ha registrado mercadería para esta visita todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. TAB: CREAR PRODUCTO NUEVO EN VISITA */}
        {activeTab === 'nuevo_producto' && (
          <form onSubmit={handleCreateProductInVisit} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Incorporación Rápida de Producto Nuevo
              </h4>
              <p className="text-xs text-slate-500">
                Permite crear un producto que el proveedor trae por primera vez, vinculándolo automáticamente a este proveedor y recepción.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código Interno Único *
                </label>
                <input
                  type="text"
                  placeholder="Ej: BEB-008"
                  value={npCode}
                  onChange={(e) => setNpCode(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código de Barras EAN
                </label>
                <input
                  type="text"
                  placeholder="786..."
                  value={npBarcode}
                  onChange={(e) => setNpBarcode(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoría
                </label>
                <select
                  value={npCategory}
                  onChange={(e) => setNpCategory(e.target.value)}
                  className="input-field"
                >
                  <option value="">General</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo del Producto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Jugo Del Valle Naranja 1L Tetrapack"
                  value={npName}
                  onChange={(e) => setNpName(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  placeholder="Ej: Del Valle"
                  value={npBrand}
                  onChange={(e) => setNpBrand(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Costo de Compra ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={npCost}
                  onChange={(e) => setNpCost(parseFloat(e.target.value) || 0)}
                  className="input-field font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Precio de Venta ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={npSalePrice}
                  onChange={(e) => setNpSalePrice(parseFloat(e.target.value) || 0)}
                  className="input-field font-bold text-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tarifa IVA Ecuador
                </label>
                <select
                  value={npIvaRate}
                  onChange={(e) => setNpIvaRate(parseFloat(e.target.value))}
                  className="input-field"
                >
                  <option value={15.0}>15% (Tarifa General)</option>
                  <option value={0.0}>0% (Canasta Básica)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 text-brand-600">
                  Cant. Recibida Ahora
                </label>
                <input
                  type="number"
                  min="1"
                  value={npAcceptedQty}
                  onChange={(e) => setNpAcceptedQty(parseInt(e.target.value) || 1)}
                  className="input-field font-bold text-brand-600"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="md" icon={<PackagePlus className="w-4 h-4" />}>
                Crear Producto e Ingresar a Recepción
              </Button>
            </div>
          </form>
        )}

        {/* 3. TAB: MERCADERÍA QUE SE LLEVA EL PROVEEDOR */}
        {activeTab === 'retiros' && (
          <div className="space-y-6">
            {visit.status !== 'finalizada' && (
              <form onSubmit={handleRegisterReturn} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Registrar Retiro Físico de Mercadería
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Producto a Retirar
                    </label>
                    <select
                      value={returnProductId}
                      onChange={(e) => setReturnProductId(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Cuarentena: {p.quarantine_stock || 0} | Vendible: {p.current_stock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={returnQty}
                      onChange={(e) => setReturnQty(parseInt(e.target.value) || 1)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Motivo de Salida
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="input-field"
                    >
                      <option value="Producto con daño físico / tara">Producto Dañado / Tara</option>
                      <option value="Producto vencido o próximo a caducar">Producto Vencido</option>
                      <option value="Error de despacho / Producto equivocado">Error de Despacho</option>
                      <option value="Retiro comercial acordado">Retiro Comercial</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={confirmDeparture}
                      onChange={(e) => setConfirmDeparture(e.target.checked)}
                      className="rounded border-slate-300 text-brand-600"
                    />
                    <span>Confirmar que la mercadería ya cruzó la puerta físicamente</span>
                  </label>

                  <Button type="submit" size="sm" icon={<RotateCcw className="w-4 h-4" />}>
                    Registrar Retiro
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {returnsOfVisit.map((ret) => (
                <div key={ret.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{ret.return_number}</span>
                      <Badge variant={ret.status === 'retirado_confirmado' ? 'success' : 'warning'}>
                        {ret.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-slate-500 mt-1">
                      {ret.items.map((i) => `${i.quantity}x ${i.product_name} (${i.reason})`).join(', ')}
                    </p>
                  </div>

                  <span className="font-mono text-slate-400">
                    {new Date(ret.created_at).toLocaleTimeString('es-EC')}
                  </span>
                </div>
              ))}
              {returnsOfVisit.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  El proveedor no ha retirado mercadería durante esta visita.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 4. TAB: CAMBIOS MANO A MANO */}
        {activeTab === 'cambios' && (
          <div className="space-y-6">
            {visit.status !== 'finalizada' && (
              <form onSubmit={handleProcessExchange} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Intercambio Mano a Mano (Producto Dañado por Reemplazo Nuevo)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Salida del Original */}
                  <div className="p-3 rounded-lg border border-rose-200 dark:border-rose-950/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
                    <span className="text-[11px] font-bold text-rose-600 block uppercase">
                      1. Producto que Sale (Dañado/Vencido)
                    </span>
                    <select
                      value={exOrigProdId}
                      onChange={(e) => setExOrigProdId(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
                      value={exOrigQty}
                      onChange={(e) => setExOrigQty(parseInt(e.target.value) || 1)}
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Entrada del Reemplazo */}
                  <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-600 block uppercase">
                      2. Producto de Reemplazo (Nuevo y Aceptado)
                    </span>
                    <select
                      value={exReplProdId}
                      onChange={(e) => setExReplProdId(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
                      value={exReplQty}
                      onChange={(e) => setExReplQty(parseInt(e.target.value) || 1)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" icon={<ArrowRightLeft className="w-4 h-4" />}>
                    Procesar Cambio e Impactar Kardex
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {exchangesOfVisit.map((exc) => (
                <div key={exc.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{exc.exchange_number}</span>
                    <p className="text-slate-500 mt-1">
                      {exc.items.map((i) => `Se cambió ${i.original_qty}x ${i.original_product_name} por ${i.replacement_qty}x ${i.replacement_product_name}`).join(', ')}
                    </p>
                    <span className="text-[11px] text-slate-400">
                      Diferencia: ${exc.price_difference.toFixed(2)} ({exc.treatment_of_difference})
                    </span>
                  </div>
                  <Badge variant="success">Completado</Badge>
                </div>
              ))}
              {exchangesOfVisit.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  No se han registrado intercambios de productos en esta visita.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 5. TAB: PRODUCTOS DAÑADOS / INCIDENCIAS */}
        {activeTab === 'incidencias' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Incidencias Registradas de Mercadería Dañada
              </h4>
              <span className="text-xs text-slate-400">
                Aislados en stock de cuarentena fuera del inventario disponible
              </span>
            </div>

            <div className="space-y-3">
              {incidentsOfVisit.map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-700 dark:text-rose-400">{inc.incident_number}</span>
                    <Badge variant="danger">{inc.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600 dark:text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Producto</span>
                      <span className="font-semibold">{inc.product_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cantidad Afectada</span>
                      <span className="font-bold text-rose-600">{inc.affected_qty} unidades</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Valor Estimado</span>
                      <span className="font-mono font-bold">${inc.estimated_value.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Ubicación Física</span>
                      <span>{inc.physical_location}</span>
                    </div>
                  </div>
                  <p className="text-slate-500 pt-1 border-t border-rose-200/50 dark:border-rose-900/30">
                    Motivo: {inc.damage_reason}
                  </p>
                </div>
              ))}
              {incidentsOfVisit.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  No existen incidencias reportadas en este expediente.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 6. TAB: COMPROMISOS DE REPOSICIÓN PENDIENTES */}
        {activeTab === 'reposiciones' && (
          <div className="space-y-6">
            {visit.status !== 'finalizada' && (
              <form onSubmit={handleCreateReplacement} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Agendar Compromiso de Reposición a Futuro
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Producto a Reponer
                    </label>
                    <select
                      value={repProdId}
                      onChange={(e) => setRepProdId(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cantidad Acordada
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={repQty}
                      onChange={(e) => setRepQty(parseInt(e.target.value) || 1)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha Prometida de Entrega (SLA)
                    </label>
                    <input
                      type="date"
                      value={repDate}
                      onChange={(e) => setRepDate(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" icon={<CalendarClock className="w-4 h-4" />}>
                    Agendar Compromiso
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {replacementsOfVisit.map((rep) => (
                <div key={rep.id} className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-950/20 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 dark:text-blue-400">{rep.replacement_number}</span>
                      <Badge variant={rep.status === 'completada' ? 'success' : 'info'}>
                        {rep.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {rep.agreed_qty}x {rep.product_name}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Fecha Límite: <span className="font-bold text-slate-700 dark:text-slate-200">{rep.expected_delivery_date}</span>
                    </p>
                  </div>

                  {rep.status !== 'completada' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fulfillSupplierReplacement(rep.id, rep.agreed_qty)}
                    >
                      Confirmar Entrega Ahora
                    </Button>
                  )}
                </div>
              ))}
              {replacementsOfVisit.length === 0 && (
                <p className="text-center py-8 text-xs text-slate-400">
                  No hay compromisos de reposición pactados en esta visita.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 7. TAB: CIERRE Y RESUMEN DEL ACTA */}
        {activeTab === 'cierre' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-brand-600" />
                <span>Resumen de Cierre de Visita & Generación de Acta</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Líneas Aceptadas</span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {itemsOfVisit.reduce((acc, i) => acc + i.accepted_qty, 0)} unidades
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Dañados / Rechazados</span>
                  <span className="text-base font-extrabold text-rose-600">
                    {itemsOfVisit.reduce((acc, i) => acc + i.rejected_qty, 0)} unidades
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Retirados por Proveedor</span>
                  <span className="text-base font-extrabold text-amber-600">
                    {returnsOfVisit.reduce((acc, r) => acc + r.items.reduce((s, i) => s + i.quantity, 0), 0)} unidades
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reposiciones Pactadas</span>
                  <span className="text-base font-extrabold text-blue-600">
                    {replacementsOfVisit.length} compromisos
                  </span>
                </div>
              </div>

              {visit.status !== 'finalizada' ? (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Observaciones Finales de Cierre de Visita
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detalles adicionales, acuerdos de pago o notas para la siguiente visita..."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    className="input-field"
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={<CheckCircle className="w-5 h-5" />}
                      onClick={handleCloseVisit}
                    >
                      Cerrar y Firmar Expediente Formalmente
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <p className="font-bold">Esta visita fue finalizada exitosamente</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Check-out registrado el {visit.check_out_time ? new Date(visit.check_out_time).toLocaleString('es-EC') : 'N/A'}. Acta digital archivada.
                      </p>
                    </div>
                  </div>

                  <Button size="sm" onClick={handleDownloadActa} icon={<Printer className="w-4 h-4" />}>
                    Descargar Acta PDF
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
