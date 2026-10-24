import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Sale } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { generatePosReceiptPdf } from '../../lib/pdfGenerator';
import { Receipt, Printer, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const SalesHistory: React.FC = () => {
  const { sales, saleItems, cancelSale } = useStore();
  const { hasPermission } = useAuth();

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handlePrint = (sale: Sale) => {
    const items = saleItems.filter((i) => i.sale_id === sale.id);
    const doc = generatePosReceiptPdf(sale, items);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  const handleConfirmCancel = async () => {
    if (!selectedSale) return;
    if (!cancelReason.trim()) {
      toast.error('Debe indicar el motivo de la anulación');
      return;
    }

    try {
      await cancelSale(selectedSale.id, cancelReason);
      setIsCancelModalOpen(false);
      setIsDetailModalOpen(false);
      setCancelReason('');
    } catch (err: any) {
      toast.error(err.message || 'Error al anular venta');
    }
  };

  const columns: Column<Sale>[] = [
    {
      key: 'sale_number',
      header: 'N° Venta / Ticket',
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
            {s.sale_number}
          </span>
          <span className="block text-[10px] text-slate-400 font-mono">
            {s.internal_doc_number || 'S/N'}
          </span>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {s.customer_name || 'CONSUMIDOR FINAL'}
          </p>
          <p className="text-[10px] text-slate-400">ID: {s.customer_id_number || '9999999999999'}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha y Hora',
      sortable: true,
      render: (s) => (
        <span className="text-xs text-slate-500">
          {new Date(s.created_at).toLocaleString('es-EC')}
        </span>
      ),
    },
    {
      key: 'payment_method',
      header: 'Pago',
      render: (s) => (
        <span className="text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
          {s.payment_method}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Cobrado',
      sortable: true,
      render: (s) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
          ${s.total_amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (s) => (
        <Badge variant={s.status === 'completada' ? 'success' : 'danger'}>
          {s.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (s) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedSale(s);
              setIsDetailModalOpen(true);
            }}
          >
            Detalle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => handlePrint(s)}
            title="Reimprimir Ticket"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Historial de Ventas & Comprobantes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Registro detallado de transacciones comerciales, reimpresión de tickets y anulaciones controladas.
          </p>
        </div>
      </div>

      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={sales}
          searchPlaceholder="Buscar por número de venta, cliente o cédula..."
          searchableKeys={['sale_number', 'customer_name', 'customer_id_number', 'internal_doc_number']}
          emptyMessage="No se han registrado ventas en el sistema."
        />
      </div>

      {/* Modal Detalle de Venta */}
      {selectedSale && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detalle de Venta: ${selectedSale.sale_number}`}
          subtitle={`Cliente: ${selectedSale.customer_name} • Fecha: ${new Date(selectedSale.created_at).toLocaleString('es-EC')}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div>
                {selectedSale.status === 'completada' && hasPermission('cancel_sales') && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<XCircle className="w-4 h-4" />}
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    Anular Venta & Revertir Stock
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handlePrint(selectedSale)} icon={<Printer className="w-4 h-4" />}>
                  Reimprimir Ticket
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 py-2 text-xs">
            {selectedSale.status === 'anulada' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400">
                <p className="font-bold">Esta venta fue anulada.</p>
                <p className="text-[11px]">{selectedSale.notes}</p>
              </div>
            )}

            {/* Líneas de la venta */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {saleItems
                .filter((i) => i.sale_id === selectedSale.id)
                .map((i) => (
                  <div key={i.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{i.product_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {i.quantity} x ${i.unit_price.toFixed(2)} (IVA {i.iva_rate}%)
                      </p>
                    </div>
                    <span className="font-mono font-bold">${i.total.toFixed(2)}</span>
                  </div>
                ))}
            </div>

            {/* Resumen de totales */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal 0% IVA:</span>
                <span className="font-mono">${selectedSale.subtotal_0.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Subtotal 15% IVA:</span>
                <span className="font-mono">${selectedSale.subtotal_iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>IVA (15%):</span>
                <span className="font-mono">${selectedSale.iva_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                <span>Total:</span>
                <span className="font-mono text-slate-900 dark:text-white font-extrabold">${selectedSale.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmación de Anulación */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Anulación de Venta & Reversión de Stock"
        subtitle="Esta acción devolverá las unidades al inventario vendible a través de Kardex"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmCancel}>
              Confirmar Anulación
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Indique la razón justificada para la anulación de la venta{' '}
            <strong className="text-slate-900 dark:text-white">{selectedSale?.sale_number}</strong>:
          </p>
          <input
            type="text"
            placeholder="Ej: Cliente canceló la compra antes de retirarse, error en cobro..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="input-field"
            required
          />
        </div>
      </Modal>
    </div>
  );
};
