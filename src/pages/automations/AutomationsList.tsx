import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { AutomationRule } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Zap, Plus, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';

export const AutomationsList: React.FC = () => {
  const { automations, toggleAutomationRule, createAutomationRule } = useStore();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [eventTrigger, setEventTrigger] = useState('inventory.low_stock');
  const [actionType, setActionType] = useState('notify_and_alert');
  const [conditionDesc, setConditionDesc] = useState('');

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      toast.error('El nombre de la regla es obligatorio');
      return;
    }

    createAutomationRule({
      name: ruleName.trim(),
      event_trigger: eventTrigger,
      action_type: actionType,
      conditionDescription: conditionDesc.trim() || undefined,
    });

    setIsNewModalOpen(false);
    setRuleName('');
    setConditionDesc('');
  };

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
          {a.last_triggered_at ? new Date(a.last_triggered_at).toLocaleString('es-EC') : 'En monitoreo activo'}
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
    {
      key: 'actions',
      header: 'Acciones',
      render: (a) => (
        <Button
          size="sm"
          variant={a.is_active ? 'secondary' : 'primary'}
          icon={a.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          onClick={() => toggleAutomationRule(a.id)}
        >
          {a.is_active ? 'Pausar' : 'Activar'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        <Button
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          + Nueva Regla
        </Button>
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

      {/* Modal Nueva Regla de Automatización */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Nueva Regla de Automatización"
        subtitle="Configure un disparador automático ante eventos operativos del sistema"
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewModalOpen(false)}>
              Cancelar
            </Button>
            <Button form="form-new-automation" type="submit" icon={<Plus className="w-4 h-4" />}>
              Guardar Regla
            </Button>
          </>
        }
      >
        <form id="form-new-automation" onSubmit={handleCreateRule} className="space-y-4 py-2 text-xs">
          <Input
            label="Nombre de la Regla *"
            placeholder="Ej: Notificar gerencia cuando un producto llegue a 0"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Evento Disparador *
              </label>
              <select
                value={eventTrigger}
                onChange={(e) => setEventTrigger(e.target.value)}
                className="input-field"
              >
                <option value="inventory.low_stock">Stock Crítico en Inventario</option>
                <option value="supplier.replacement_due">Reposición de Proveedor Pendiente</option>
                <option value="visit.closed">Cierre de Visita de Proveedor</option>
                <option value="cash.session_closed_diff">Diferencia en Arqueo de Caja</option>
                <option value="sale.completed">Venta POS Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Acción a Ejecutar *
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="input-field"
              >
                <option value="notify_and_alert">Alerta y Notificación Interna</option>
                <option value="notify_supervisor">Escalar a Supervisor / Gerencia</option>
                <option value="enqueue_email_acta">Encolar Correo Automático</option>
                <option value="log_audit_alert">Registrar Alerta de Auditoría</option>
              </select>
            </div>
          </div>

          <Input
            label="Condición / Detalle Adicional"
            placeholder="Ej: Enviar notificación cuando stock <= stock mínimo"
            value={conditionDesc}
            onChange={(e) => setConditionDesc(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
