import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { PurchaseOrder } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { FileSpreadsheet, Plus, CheckCircle, Clock, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/databaseState';

export const PurchaseOrdersList: React.FC = () => {
  const { purchaseOrders, suppliers, products } = useStore();
  const { user, hasPermission } = useAuth();

  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [orderNotes, setOrderNotes] = useState('');

  // Items de la orden
  const [orderItems, setOrderItems] = useState<{ productId: string; qty: number; unitCost: number }[]>([]);
  const [addItemProdId, setAddItemProdId] = useState('');
  const [addItemQty, setAddItemQty] = useState(10);

  const handleAddItemToOrder = () => {
    if (!addItemProdId) return;
    const prod = products.find((p) => p.id === addItemProdId);
    if (!prod) return;

    setOrderItems((prev) => [
      ...prev,
      { productId: prod.id, qty: addItemQty, unitCost: prod.cost_price },
    ]);
    setAddItemProdId('');
    setAddItemQty(10);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      toast.error('Seleccione un proveedor');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Agregue al menos un producto a la orden');
      return;
    }

    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    const subtotal = orderItems.reduce((acc, i) => acc + (i.qty * i.unitCost), 0);
    const tax = Number((subtotal * 0.15).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));

    const orderCount = purchaseOrders.length + 1;
    const orderNumber = `OC-${new Date().getFullYear()}-${String(orderCount).padStart(4, '0')}`;

    const newOrder: PurchaseOrder = {
      id: `po-${Date.now()}`,
      order_number: orderNumber,
      supplier_id: selectedSupplierId,
      supplier_name: supplier?.trade_name || supplier?.business_name,
      created_by: user?.id || 'usr-system',
      status: 'aprobada',
      expected_date: expectedDate,
      subtotal,
      tax_amount: tax,
      total_amount: total,
      notes: orderNotes,
      created_at: new Date().toISOString(),
      items: orderItems.map((i) => {
        const prod = products.find((p) => p.id === i.productId);
        return {
          id: `poi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          order_id: '',
          product_id: i.productId,
          product_name: prod?.name,
          quantity_ordered: i.qty,
          quantity_received: 0,
          unit_cost: i.unitCost,
          total_cost: i.qty * i.unitCost,
          created_at: new Date().toISOString(),
        };
      }),
    };

    db.getSnapshot().purchaseOrders.unshift(newOrder);
    toast.success(`Orden de Compra ${orderNumber} generada y aprobada.`);
    setIsNewOrderModalOpen(false);
    // Reset
    setSelectedSupplierId('');
    setOrderItems([]);
  };

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'order_number',
      header: 'N° Orden',
      sortable: true,
      render: (o) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          {o.order_number}
        </span>
      ),
    },
    {
      key: 'supplier_name',
      header: 'Proveedor',
      sortable: true,
      render: (o) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
          {o.supplier_name || 'Proveedor'}
        </span>
      ),
    },
    {
      key: 'expected_date',
      header: 'Fecha Prevista',
      sortable: true,
      render: (o) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {o.expected_date || 'Inmediata'}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Estimado',
      sortable: true,
      render: (o) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          ${o.total_amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (o) => {
        const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
          completada: 'success',
          aprobada: 'info',
          enviada: 'warning',
          recepcion_parcial: 'warning',
          borrador: 'neutral',
          cancelada: 'danger',
        };
        return (
          <Badge variant={variantMap[o.status] || 'neutral'}>
            {o.status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
  ];

  const modalSubtotal = orderItems.reduce((acc, it) => acc + it.qty * it.unitCost, 0);
  const modalIva = Number((modalSubtotal * 0.15).toFixed(2));
  const modalTotal = Number((modalSubtotal + modalIva).toFixed(2));
  const selectedSupplierObj = suppliers.find((s) => s.id === selectedSupplierId);

  // KPIs de compras
  const totalOrdersCount = purchaseOrders.length;
  const pendingOrdersCount = purchaseOrders.filter((o) => o.status === 'borrador' || o.status === 'aprobada').length;
  const totalAmountCommitted = purchaseOrders.reduce((acc, o) => acc + o.total_amount, 0);
  const uniqueSuppliersCount = new Set(purchaseOrders.map((o) => o.supplier_id)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              MÓDULO DE COMPRAS • ERP ECUADOR
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Abastecimiento Oficial & Cotizaciones</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Órdenes de Compra a Proveedores
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control institucional de pedidos programados, cotizaciones autorizadas y seguimiento de recepción física en bodega.
          </p>
        </div>

        {hasPermission('manage_purchases') && (
          <Button
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewOrderModalOpen(true)}
          >
            Nueva Orden de Compra
          </Button>
        )}
      </div>

      {/* KPI Ribbon Superior */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Órdenes</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalOrdersCount}</span>
          <span className="text-[10px] text-slate-400">Emitidas históricamente</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">En Proceso / Pendiente</span>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1 block font-mono">{pendingOrdersCount}</span>
          <span className="text-[10px] text-slate-400">Por recibir en tienda</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Proveedores Activos</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{uniqueSuppliersCount}</span>
          <span className="text-[10px] text-slate-400">Con órdenes generadas</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Comprometido</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">${totalAmountCommitted.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">USD facturado/proyectado</span>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <DataTable
          columns={columns}
          data={purchaseOrders}
          searchPlaceholder="Buscar por N° orden o proveedor..."
          searchableKeys={['order_number', 'supplier_name']}
          emptyMessage="No se registran órdenes de compra emitidas en el período actual. Utilice el botón superior para crear un requerimiento formal."
        />
      </div>

      {/* Modal Nueva Orden de Compra — Master Detail Formal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Emisión de Orden de Compra Institucional"
        subtitle="Documento comercial vinculante para requerimiento formal de mercadería a proveedores autorizados"
        maxWidth="3xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewOrderModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrder} icon={<Plus className="w-4 h-4" />}>
              Aprobar & Generar Orden Oficial
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOrder} className="py-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Panel Izquierdo: Formularios y Tabla */}
            <div className="lg:col-span-8 space-y-4">
              {/* Sección 1: Datos de Cabecera */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  1. Selección de Proveedor & Términos de Despacho
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Empresa Proveedora *
                    </label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- Seleccionar Proveedor --</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.trade_name || s.business_name} (RUC: {s.ruc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Fecha Prevista de Despacho / Visita *
                    </label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Agregar Productos */}
              <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  2. Líneas de Mercadería Requeridas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Producto en Catálogo
                    </label>
                    <select
                      value={addItemProdId}
                      onChange={(e) => setAddItemProdId(e.target.value)}
                      className="input-field"
                    >
                      <option value="">-- Seleccionar Producto --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.internal_code}) — Stock: {p.current_stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cant."
                      value={addItemQty}
                      onChange={(e) => setAddItemQty(parseInt(e.target.value) || 1)}
                      className="input-field text-center font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Button type="button" size="md" className="w-full" onClick={handleAddItemToOrder}>
                      Añadir
                    </Button>
                  </div>
                </div>

                {/* Tabla de Productos Añadidos */}
                {orderItems.length > 0 ? (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                      <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Producto</th>
                          <th className="px-3 py-2 text-center">Cant.</th>
                          <th className="px-3 py-2 text-right">Costo Unit. Ref</th>
                          <th className="px-3 py-2 text-right">Subtotal</th>
                          <th className="px-3 py-2 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                        {orderItems.map((item, idx) => {
                          const prod = products.find((p) => p.id === item.productId);
                          return (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{prod?.name}</td>
                              <td className="px-3 py-2 text-center font-mono font-bold">{item.qty}</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-500">${item.unitCost.toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                                ${(item.qty * item.unitCost).toFixed(2)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                                  className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                                >
                                  Quitar
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-4 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                    Agregue las líneas de producto requeridas para esta orden.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Instrucciones Especiales o Condiciones de Despacho
                </label>
                <input
                  type="text"
                  placeholder="Ej: Entrega antes de las 11:00 am, revisar precintos de seguridad de empaque..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Panel Derecho: Resumen Ejecutivo de Liquidación */}
            <div className="lg:col-span-4 space-y-3.5">
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 border border-slate-800 shadow-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2">
                  Liquidación Estimada de Compra
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Líneas Solicitadas:</span>
                    <span className="font-mono text-white font-bold">{orderItems.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Unidades Totales:</span>
                    <span className="font-mono text-white font-bold">
                      {orderItems.reduce((acc, it) => acc + it.qty, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal Neto:</span>
                    <span className="font-mono text-white font-bold">${modalSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IVA Estimado (15%):</span>
                    <span className="font-mono text-white font-bold">${modalIva.toFixed(2)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">TOTAL ESTIMADO:</span>
                    <span className="text-xl font-bold font-mono text-white tracking-tight">${modalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Ficha Proveedor Seleccionado */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Información Fiscal del Proveedor
                </span>
                {selectedSupplierObj ? (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {selectedSupplierObj.trade_name || selectedSupplierObj.business_name}
                    </p>
                    <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      RUC: {selectedSupplierObj.ruc}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ciudad: {selectedSupplierObj.city} • Tel: {selectedSupplierObj.phone || 'N/A'}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px]">
                    Seleccione un proveedor para verificar sus datos tributarios de facturación.
                  </p>
                )}
              </div>

              {/* Cláusula Legal */}
              <div className="p-3 rounded-lg bg-slate-100/60 dark:bg-slate-850/60 text-[10px] text-slate-500 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                Esta orden se registrará con código consecutivo inmutable para auditar el cumplimiento del transportista durante la recepción física.
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
