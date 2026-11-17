import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { InternalDocument } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FileCheck2, ShieldAlert, Eye } from 'lucide-react';

export const InternalDocsList: React.FC = () => {
  const { internalDocs } = useStore();
  const [selectedDoc, setSelectedDoc] = useState<InternalDocument | null>(null);

  const columns: Column<InternalDocument>[] = [
    {
      key: 'doc_number',
      header: 'N° Documento Interno',
      sortable: true,
      render: (d) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          {d.doc_number}
        </span>
      ),
    },
    {
      key: 'doc_type',
      header: 'Tipo de Documento',
      sortable: true,
      render: (d) => (
        <Badge variant="neutral">
          {d.doc_type.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'recipient_name',
      header: 'Destinatario / Receptor',
      sortable: true,
      render: (d) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
          {d.recipient_name}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Importe ($)',
      sortable: true,
      render: (d) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          ${d.total_amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'issued_by',
      header: 'Emitido Por',
      render: (d) => (
        <span className="text-xs text-slate-500">{d.issuer_name || 'Personal'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha y Hora',
      sortable: true,
      render: (d) => (
        <span className="text-xs text-slate-500">
          {new Date(d.created_at).toLocaleString('es-EC')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (d) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setSelectedDoc(d)}
        >
          Ver Detalle
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Control Operativo No Tributario</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Documentos Internos de Control
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Comprobantes de venta de mostrador, notas de entrega y actas internas de control de inventario.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
        <p>
          <strong>AVISO DE CONFORMIDAD:</strong> Estos documentos son únicamente para fines de control administrativo interno y no constituyen comprobantes autorizados por el SRI ni dan derecho a crédito tributario.
        </p>
      </div>

      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={internalDocs}
          searchPlaceholder="Buscar por número de documento o cliente..."
          searchableKeys={['doc_number', 'recipient_name']}
          emptyMessage="No se han registrado documentos internos."
        />
      </div>

      {/* Modal Detalle de Documento Interno */}
      {selectedDoc && (
        <Modal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          title={`Documento Interno: ${selectedDoc.doc_number}`}
          subtitle={`Tipo: ${selectedDoc.doc_type.replace(/_/g, ' ').toUpperCase()} • Emitido el ${new Date(selectedDoc.created_at).toLocaleString('es-EC')}`}
          maxWidth="lg"
          footer={
            <Button variant="secondary" onClick={() => setSelectedDoc(null)}>
              Cerrar
            </Button>
          }
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Destinatario / Cliente</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedDoc.recipient_name}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Emitido Por</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedDoc.issuer_name || 'Personal'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Importe Total</span>
                <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">${Number(selectedDoc.total_amount || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Referencia Interna</span>
                <span className="font-mono text-slate-600 dark:text-slate-300">{selectedDoc.details?.saleNumber || selectedDoc.reference_id || 'N/A'}</span>
              </div>
            </div>

            {selectedDoc.details && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Desglose del Comprobante
                </span>
                {selectedDoc.details.paymentMethod !== undefined ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Método de Pago</span>
                      <span className="font-bold capitalize">{String(selectedDoc.details.paymentMethod)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Subtotal 0%</span>
                      <span className="font-mono font-semibold">${Number(selectedDoc.details.subtotal0 || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Subtotal IVA</span>
                      <span className="font-mono font-semibold">${Number(selectedDoc.details.subtotalIva || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">IVA Cobrado</span>
                      <span className="font-mono font-semibold">${Number(selectedDoc.details.ivaAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <pre className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto">
                    {JSON.stringify(selectedDoc.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
