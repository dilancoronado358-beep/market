import React from 'react';
import { useStore } from '../../context/StoreContext';
import { AutomationRule } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Zap, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export const AutomationsList: React.FC = () => {
  const { automations } = useStore();

  const columns: Column<AutomationRule>[] = [
    {
      key: 'name',
      header: 'Regla de Automatización',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs block">
            {a.name}
          </span>
          <span className="text-[10px] text-slate-400">
            Evento: {a.event_trigger}
          </span>
        </div>
      ),
    },
    {
      key: 'action_type',
      header: 'Acción Ejecutada',
      render: (a) => (
        <span className="text-xs font-mono text-brand-600 dark:text-brand-400">
          {a.action_type}
        </span>
      ),
    },
    {
      key: 'last_triggered_at',
      header: 'Última Activación',
      render: (a) => (
        <span className="text-xs text-slate-500">
          {a.last_triggered_at ? new Date(a.last_triggered_at).toLocaleString('es-EC') : 'Sin disparos'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (a) => (
        <Badge variant={a.is_active ? 'success' : 'neutral'}>
          {a.is_active ? 'ACTIVO' : 'PAUSADO'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">
          <Zap className="w-3.5 h-3.5" />
          <span>Motor Concurrente de Eventos</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reglas de Automatización Comercial
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Disparadores automáticos ante stock bajo, compromisos de reposición vencidos y recepción de mercadería.
        </p>
      </div>

      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={automations}
          searchPlaceholder="Buscar por nombre de regla o disparador..."
          searchableKeys={['name', 'event_trigger', 'action_type']}
          emptyMessage="No se han configurado reglas de automatización."
        />
      </div>
    </div>
  );
};
