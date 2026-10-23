import React from 'react';
import { useStore } from '../../context/StoreContext';
import { InternalDocument } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { FileCheck2, ShieldAlert } from 'lucide-react';

export const InternalDocsList: React.FC = () => {
  const { internalDocs } = useStore();

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
    </div>
  );
};
