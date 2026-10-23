import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AuditLog } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { ShieldCheck, Eye, Lock } from 'lucide-react';

export const AuditTrail: React.FC = () => {
  const { auditLogs } = useStore();

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Fecha y Hora',
      sortable: true,
      render: (a) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(a.created_at).toLocaleString('es-EC')}
        </span>
      ),
    },
    {
      key: 'user_name',
      header: 'Usuario Responsable',
      sortable: true,
      render: (a) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
          {a.user_name || 'Sistema'}
        </span>
      ),
    },
    {
      key: 'module',
      header: 'Módulo',
      sortable: true,
      render: (a) => (
        <Badge variant="neutral">
          {a.module}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Operación Registrada',
      sortable: true,
      render: (a) => (
        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
          {a.action}
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Motivo / Detalle',
      render: (a) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate block" title={a.reason}>
          {a.reason || 'Operación ordinaria'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Auditoría',
      render: (a) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => {
            setSelectedLog(a);
            setIsDetailOpen(true);
          }}
        >
          Valores
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Bitácora Criptográfica Inmutable</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Bitácora de Auditoría del Sistema
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Registro inalterable de operaciones sensibles: cambios de precios, movimientos de inventario, recepciones, retiros y sesiones de caja.
        </p>
      </div>

      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={auditLogs}
          searchPlaceholder="Buscar por acción, usuario o motivo..."
          searchableKeys={['action', 'user_name', 'module', 'reason']}
          emptyMessage="No se han registrado eventos de auditoría."
        />
      </div>

      {/* Modal Valores Anteriores y Posteriores */}
      {selectedLog && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Evento de Auditoría: ${selectedLog.action}`}
          subtitle={`Módulo: ${selectedLog.module} • Usuario: ${selectedLog.user_name} • ${new Date(selectedLog.created_at).toLocaleString('es-EC')}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 py-2 text-xs">
            <div>
              <span className="font-bold text-slate-500 block uppercase text-[10px]">Justificación Registrada</span>
              <p className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-200 mt-1 font-medium">
                {selectedLog.reason || 'Sin justificación especificada'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="font-bold text-slate-500 block uppercase text-[10px] mb-1">Valores Anteriores</span>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-[10px] overflow-x-auto max-h-56 border border-slate-800">
                  {selectedLog.previous_values ? JSON.stringify(selectedLog.previous_values, null, 2) : 'null (Registro nuevo)'}
                </pre>
              </div>

              <div>
                <span className="font-bold text-slate-500 block uppercase text-[10px] mb-1 text-emerald-500">Valores Posteriores</span>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-56 border border-slate-800">
                  {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
