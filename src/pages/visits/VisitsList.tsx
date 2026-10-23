import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SupplierVisit } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { VisitDetailModal } from './VisitDetailModal';
import { NewVisitModal } from './NewVisitModal';
import {
  Truck,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Eye,
  FileCheck2,
} from 'lucide-react';

export const VisitsList: React.FC = () => {
  const { visits, suppliers, incidents, replacements } = useStore();

  const [selectedVisit, setSelectedVisit] = useState<SupplierVisit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewVisitOpen, setIsNewVisitOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisitsCount = visits.filter((v) => v.check_in_time.startsWith(todayStr)).length;
  const activeVisitsCount = visits.filter((v) => v.status === 'en_curso' || v.status === 'en_recepcion').length;
  const incidentVisitsCount = visits.filter((v) => v.has_incidents).length;

  const filteredVisits = visits.filter((v) => {
    if (statusFilter === 'todos') return true;
    return v.status === statusFilter;
  });

  const columns: Column<SupplierVisit>[] = [
    {
      key: 'visit_number',
      header: 'N° Visita',
      sortable: true,
      render: (v) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {v.visit_number}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: 'Proveedor',
      render: (v) => {
        const s = suppliers.find((sup) => sup.id === v.supplier_id);
        return (
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {s?.trade_name || s?.business_name || 'Proveedor'}
            </p>
            <p className="text-[11px] text-slate-400">RUC: {s?.ruc || 'N/A'}</p>
          </div>
        );
      },
    },
    {
      key: 'sales_rep_name',
      header: 'Vendedor / Chofer',
      sortable: true,
      render: (v) => (
        <div>
          <p className="font-medium text-slate-700 dark:text-slate-200">{v.sales_rep_name}</p>
          <p className="text-[11px] text-slate-400">Ref: {v.invoice_or_doc_ref || 'S/N'}</p>
        </div>
      ),
    },
    {
      key: 'check_in_time',
      header: 'Llegada',
      sortable: true,
      render: (v) => (
        <div className="text-xs">
          <p className="font-medium text-slate-700 dark:text-slate-200">
            {new Date(v.check_in_time).toLocaleDateString('es-EC')}
          </p>
          <p className="text-[11px] text-slate-400">
            {new Date(v.check_in_time).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado Expediente',
      sortable: true,
      render: (v) => {
        const variantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
          en_curso: 'warning',
          en_recepcion: 'info',
          con_incidencias: 'danger',
          finalizada: 'success',
          anulada: 'neutral',
        };
        return (
          <div className="space-y-1">
            <Badge variant={variantMap[v.status] || 'neutral'}>
              {v.status.replace('_', ' ')}
            </Badge>
            {v.has_incidents && (
              <span className="block text-[10px] text-rose-500 font-semibold">
                ● Con Daños
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (v) => (
        <Button
          size="sm"
          variant="outline"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedVisit(v);
            setIsDetailOpen(true);
          }}
        >
          Abrir Expediente
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              OPERACIONES & LOGÍSTICA • RECEPCIÓN FÍSICA
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Expediente Digital 360°</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Control de Visitas de Proveedores
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Expediente digital completo: recepción, mercadería nueva, productos dañados, retiros, cambios mano a mano y actas firmadas.
          </p>
        </div>

        <Button
          onClick={() => setIsNewVisitOpen(true)}
          icon={<Plus className="w-4 h-4" />}
          size="md"
        >
          Registrar Llegada de Proveedor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Visitas de Hoy"
          value={todayVisitsCount}
          subtitle="Registradas hoy en tienda"
          icon={<Calendar className="w-5 h-5" />}
        />

        <StatCard
          title="En Curso / Bodega"
          value={activeVisitsCount}
          subtitle="Personal recibiendo mercadería"
          icon={<Clock className="w-5 h-5" />}
        />

        <StatCard
          title="Con Incidencias / Daños"
          value={incidentVisitsCount}
          subtitle="Mercadería segregada a cuarentena"
          icon={<AlertTriangle className="w-5 h-5" />}
        />

        <StatCard
          title="Reposiciones Pendientes"
          value={replacements.filter((r) => r.status === 'pendiente_entrega').length}
          subtitle="Compromisos pactados por cobrar"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>

      {/* Filtros y Tabla */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">Filtrar por estado:</span>
          {['todos', 'en_curso', 'en_recepcion', 'con_incidencias', 'finalizada'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-subtle'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'todos' ? 'Todos los expedientes' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filteredVisits}
          searchPlaceholder="Buscar por N° de visita, proveedor, vendedor, factura..."
          searchableKeys={['visit_number', 'sales_rep_name', 'invoice_or_doc_ref']}
          onRowClick={(row) => {
            setSelectedVisit(row);
            setIsDetailOpen(true);
          }}
          emptyMessage="No se encontraron visitas de proveedores registradas."
        />
      </div>

      {/* Modal de Detalle de Visita */}
      {selectedVisit && (
        <VisitDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedVisit(null);
          }}
          visit={selectedVisit}
        />
      )}

      {/* Modal de Nueva Visita */}
      <NewVisitModal
        isOpen={isNewVisitOpen}
        onClose={() => setIsNewVisitOpen(false)}
        onVisitCreated={(v) => {
          setSelectedVisit(v);
          setIsDetailOpen(true);
        }}
      />
    </div>
  );
};
