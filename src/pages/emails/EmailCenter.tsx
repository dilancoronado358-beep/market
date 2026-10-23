import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { EmailQueueItem } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Mail, RefreshCw, Send, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export const EmailCenter: React.FC = () => {
  const { emailQueue, retryEmail } = useStore();

  const [selectedEmail, setSelectedEmail] = useState<EmailQueueItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const columns: Column<EmailQueueItem>[] = [
    {
      key: 'recipient',
      header: 'Destinatario',
      sortable: true,
      render: (e) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
            {e.recipient}
          </span>
          <span className="block text-[10px] text-slate-400">
            Plantilla: {e.template_type.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Asunto del Mensaje',
      sortable: true,
      render: (e) => (
        <span className="text-xs text-slate-700 dark:text-slate-200 font-medium max-w-sm truncate block">
          {e.subject}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado Enlace',
      sortable: true,
      render: (e) => (
        <Badge variant={e.status === 'enviado' ? 'success' : e.status === 'fallido' ? 'danger' : 'warning'}>
          {e.status.toUpperCase()} ({e.attempts}/{e.max_attempts})
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha Encolado / Envío',
      sortable: true,
      render: (e) => (
        <span className="text-xs text-slate-500">
          {new Date(e.sent_at || e.created_at).toLocaleString('es-EC')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (e) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedEmail(e);
              setIsPreviewOpen(true);
            }}
          >
            Vista Previa
          </Button>

          {e.status !== 'enviado' && (
            <Button
              size="sm"
              variant="outline"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => retryEmail(e.id)}
            >
              Reintentar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Centro de Correos Electrónicos
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Cola transaccional de notificaciones, comprobantes autorizados y actas de visita enviadas a proveedores y clientes.
        </p>
      </div>

      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={emailQueue}
          searchPlaceholder="Buscar por destinatario o asunto..."
          searchableKeys={['recipient', 'subject', 'template_type']}
          emptyMessage="No hay correos en la cola transaccional."
        />
      </div>

      {/* Modal Vista Previa de Correo */}
      {selectedEmail && (
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={selectedEmail.subject}
          subtitle={`Para: ${selectedEmail.recipient}`}
          maxWidth="2xl"
        >
          <div className="py-2 space-y-3">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs">
              <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
            </div>
            <p className="text-[11px] text-slate-400">
              Despachado a través del servicio SMTP transaccional corporativo de ERP / POS Ecuador.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
