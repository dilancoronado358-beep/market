import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { InventoryMovement, MovementType } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { exportToExcel } from '../../lib/excelUtils';
import {
  Boxes,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/databaseState';

export const KardexView: React.FC = () => {
  const { movements, products, refresh } = useStore();
  const { user, hasPermission } = useAuth();

  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [productFilter, setProductFilter] = useState<string>('todos');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Formulario de Ajuste Manual
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustType, setAdjustType] = useState<MovementType>('ajuste_positivo');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const filteredMovements = movements.filter((m) => {
    if (typeFilter !== 'todos' && m.movement_type !== typeFilter) return false;
    if (productFilter !== 'todos' && m.product_id !== productFilter) return false;
    return true;
  });

  const handleExportExcel = () => {
    const data = filteredMovements.map((m) => ({
      'N° Movimiento': m.movement_number,
      Fecha: new Date(m.movement_date).toLocaleString('es-EC'),
      Producto: m.product_name,
      'Tipo de Movimiento': m.movement_type,
      'Entrada (+)': m.quantity_in,
      'Salida (-)': m.quantity_out,
      'Stock Anterior': m.previous_stock,
      'Nuevo Saldo': m.new_stock,
      'Costo Unitario ($)': m.unit_cost,
      'Costo Total ($)': m.total_cost,
      Documento: `${m.doc_type || ''} ${m.doc_number || ''}`,
      Usuario: m.user_name || 'Sistema',
      Motivo: m.reason,
    }));
    exportToExcel(data, `Kardex_Inventario_ERP_POS_Ecuador_${new Date().toISOString().split('T')[0]}`);
    toast.success('Kardex exportado exitosamente a Excel');
  };

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      toast.error('Seleccione el producto a ajustar');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('La justificación de auditoría es obligatoria');
      return;
    }

    const prod = products.find((p) => p.id === adjustProductId);
    if (!prod) return;

    try {
      const isNegative = ['ajuste_negativo', 'perdida', 'consumo_interno', 'producto_dañado', 'producto_vencido'].includes(adjustType);
      
      db.executeKardexMovement({
        productId: prod.id,
        movementType: adjustType,
        quantityIn: isNegative ? 0 : adjustQty,
        quantityOut: isNegative ? adjustQty : 0,
        unitCost: prod.avg_cost || prod.cost_price,
        docType: 'ajuste_manual_autorizado',
        userId: user?.id || 'usr-system',
        userName: user?.full_name || 'Personal',
        reason: adjustReason,
      });

      refresh();
      toast.success(`Ajuste de inventario ejecutado e impactado en Kardex.`);
      setIsAdjustModalOpen(false);
      // Reset
      setAdjustProductId('');
      setAdjustQty(1);
      setAdjustReason('');
    } catch (err: any) {
      toast.error(err.message || 'Error al ejecutar ajuste');
    }
  };

  const columns: Column<InventoryMovement>[] = [
    {
      key: 'movement_number',
      header: 'N° Movimiento',
      sortable: true,
      render: (m) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {m.movement_number}
          </span>
          <span className="block text-[10px] text-slate-400">
            {new Date(m.movement_date).toLocaleString('es-EC')}
          </span>
        </div>
      ),
    },
    {
      key: 'product_name',
      header: 'Producto',
      sortable: true,
      render: (m) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          {m.product_name}
        </span>
      ),
    },
    {
      key: 'movement_type',
      header: 'Tipo de Movimiento',
      sortable: true,
      render: (m) => {
        const isEntry = m.quantity_in > 0;
        return (
          <div className="flex items-center gap-1.5">
            {isEntry ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <Badge variant={isEntry ? 'success' : 'danger'}>
              {m.movement_type.replace('_', ' ')}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'quantities',
      header: 'Entrada / Salida',
      render: (m) => (
        <div className="font-mono text-xs">
          {m.quantity_in > 0 && (
            <span className="font-bold text-emerald-600">+{m.quantity_in}</span>
          )}
          {m.quantity_out > 0 && (
            <span className="font-bold text-rose-600">-{m.quantity_out}</span>
          )}
          {m.quantity_in === 0 && m.quantity_out === 0 && (
            <span className="text-slate-400">0</span>
          )}
        </div>
      ),
    },
    {
      key: 'new_stock',
      header: 'Saldo Resultante',
      sortable: true,
      render: (m) => (
        <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">
          {m.new_stock}
        </span>
      ),
    },
    {
      key: 'unit_cost',
      header: 'Costo Unit.',
      sortable: true,
      render: (m) => (
        <span className="font-mono text-slate-600 dark:text-slate-300">
          ${m.unit_cost.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Referencia / Justificación',
      render: (m) => (
        <div className="max-w-xs truncate text-xs">
          <p className="truncate font-medium text-slate-700 dark:text-slate-200">{m.reason}</p>
          <p className="text-[10px] text-slate-400 truncate">
            {m.doc_type ? `${m.doc_type}: ${m.doc_number || ''}` : ''} • Por: {m.user_name || 'Sistema'}
          </p>
        </div>
      ),
    },
  ];

  // Métricas institucionales de inventario
  const totalCostValuation = products.reduce((acc, p) => acc + (p.current_stock * (p.avg_cost || p.cost_price)), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.current_stock * p.sale_price), 0);
  const totalMovementsCount = movements.length;
  const totalQuarantine = products.reduce((acc, p) => acc + (p.quarantine_stock || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              KARDEX & LOGÍSTICA • MÉTODO CPP
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Costo Promedio Ponderado Inmutable</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Inventario & Kardex Valorizado
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trazabilidad rigurosa de cada entrada, salida, venta, recepción y devolución con saldos inmutables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={handleExportExcel}
          >
            Exportar Kardex (Excel)
          </Button>

          {hasPermission('adjust_inventory') && (
            <Button
              size="sm"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setIsAdjustModalOpen(true)}
            >
              Ajuste Manual Autorizado
            </Button>
          )}
        </div>
      </div>

      {/* KPI Ribbon de Inventario */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Valorización (Costo)</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">${totalCostValuation.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">Costo Promedio Ponderado</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Valorización (PVP)</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">${totalRetailValuation.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">Proyección venta al público</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Movimientos Kardex</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalMovementsCount}</span>
          <span className="text-[10px] text-slate-400">Registros auditables</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Stock en Cuarentena</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalQuarantine} unid.</span>
          <span className="text-[10px] text-slate-400">Retenidos por garantía/daño</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-subtle grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Filtrar por Producto
          </label>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="input-field"
          >
            <option value="todos">Todos los productos del catálogo</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.internal_code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Filtrar por Tipo de Operación
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field"
          >
            <option value="todos">Todos los tipos de movimiento</option>
            <option value="compra_recibida">Compra / Recepción Proveedor</option>
            <option value="venta">Venta POS</option>
            <option value="devolucion_proveedor">Devolución a Proveedor</option>
            <option value="producto_cambiado">Cambio Mano a Mano</option>
            <option value="reposicion">Reposición Proveedor</option>
            <option value="producto_dañado">Producto Dañado (Cuarentena)</option>
            <option value="ajuste_positivo">Ajuste Positivo</option>
            <option value="ajuste_negativo">Ajuste Negativo</option>
            <option value="reversion_autorizada">Reversión Autorizada</option>
          </select>
        </div>
      </div>

      {/* Tabla Kardex */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <DataTable
          columns={columns}
          data={filteredMovements}
          searchPlaceholder="Buscar por movimiento, producto, factura, motivo..."
          searchableKeys={['movement_number', 'product_name', 'reason', 'doc_number']}
          emptyMessage="No se registran movimientos en el Kardex para los filtros seleccionados."
        />
      </div>

      {/* Modal de Ajuste Manual Autorizado */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Ajuste de Inventario Autorizado"
        subtitle="Todo ajuste genera un registro inmutable en el Kardex y en la bitácora de auditoría"
        maxWidth="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExecuteAdjustment}>
              Confirmar Ajuste en Kardex
            </Button>
          </>
        }
      >
        <form onSubmit={handleExecuteAdjustment} className="space-y-4 py-1 text-xs">
          {/* Sección 1: Parámetros del Ajuste */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              1. Parámetros de Existencias Físicas
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Producto a Ajustar *
                </label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">-- Seleccionar Producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock Actual: {p.current_stock} {p.unit_of_measure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Operación de Ajuste *
                </label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as MovementType)}
                  className="input-field"
                >
                  <option value="ajuste_positivo">Ajuste Positivo (+ Ingreso Físico)</option>
                  <option value="ajuste_negativo">Ajuste Negativo (- Salida Física)</option>
                  <option value="perdida">Pérdida / Merma (-)</option>
                  <option value="consumo_interno">Consumo Interno (-)</option>
                  <option value="producto_dañado">Producto Dañado (- a Cuarentena)</option>
                  <option value="producto_vencido">Producto Vencido (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cantidad a Ajustar *
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 1)}
                  className="input-field font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Justificación */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              2. Justificación Legal de Auditoría & Trazabilidad
            </span>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo / Justificación Obligatoria *
              </label>
              <input
                type="text"
                placeholder="Ej: Conteo físico mensual de existencias, merma por rotura en percha..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
