import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { CashSession, CashMovement } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import {
  Wallet,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';

export const CashRegister: React.FC = () => {
  const { cashSessions, cashMovements, openCashSession, registerCashMovement, closeCashSession } = useStore();
  const { user, hasPermission } = useAuth();

  // Estados de Modales
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  // Formulario Apertura
  const [floatAmount, setFloatAmount] = useState<number>(50.0);
  const [openNotes, setOpenNotes] = useState('Apertura turno regular con fondo de cambio');

  // Formulario Movimiento (Ingreso / Egreso)
  const [movementType, setMovementType] = useState<'ingreso' | 'egreso' | 'retiro_parcial'>('egreso');
  const [movementAmount, setMovementAmount] = useState<number>(10.0);
  const [movementReason, setMovementReason] = useState('');

  // Formulario Cierre y Arqueo Ciego
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [supervisorId, setSupervisorId] = useState('');

  // Sesión activa del usuario
  const activeSession = cashSessions.find((s) => s.status === 'abierta');

  // Movimientos de la sesión activa
  const activeMovements = activeSession
    ? cashMovements.filter((m) => m.session_id === activeSession.id)
    : [];

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      openCashSession('caja-1', floatAmount, openNotes);
      setIsOpenShiftModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir turno');
    }
  };

  const handleRegisterMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    if (!movementReason.trim()) {
      toast.error('Indique el motivo del movimiento de dinero');
      return;
    }

    try {
      registerCashMovement(activeSession.id, movementType, movementAmount, movementReason);
      setIsCashMovementModalOpen(false);
      setMovementReason('');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar movimiento');
    }
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    try {
      closeCashSession(
        activeSession.id,
        countedCash,
        closingNotes,
        supervisorId || user?.id || 'usr-system'
      );
      setIsCloseShiftModalOpen(false);
      setCountedCash(0);
      setClosingNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar turno');
    }
  };

  const sessionColumns: Column<CashSession>[] = [
    {
      key: 'session_number',
      header: 'N° Turno',
      sortable: true,
      render: (s) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          {s.session_number}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Cajero Responsable',
      render: (s) => (
        <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">
          {s.user_name || 'Cajero'}
        </span>
      ),
    },
    {
      key: 'opened_at',
      header: 'Apertura',
      sortable: true,
      render: (s) => (
        <span className="text-xs text-slate-500">
          {new Date(s.opened_at).toLocaleString('es-EC')}
        </span>
      ),
    },
    {
      key: 'opening_float',
      header: 'Fondo Inicial',
      render: (s) => (
        <span className="font-mono text-xs">${s.opening_float.toFixed(2)}</span>
      ),
    },
    {
      key: 'cash_sales_total',
      header: 'Ventas Efectivo',
      render: (s) => (
        <span className="font-mono text-emerald-600 font-bold text-xs">
          ${s.cash_sales_total.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'expected_cash',
      header: 'Efectivo Esperado',
      render: (s) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          ${s.expected_cash.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'actual_counted_cash',
      header: 'Conteo Real',
      render: (s) => (
        <span className="font-mono text-xs">
          {s.actual_counted_cash !== undefined ? `$${s.actual_counted_cash.toFixed(2)}` : 'En curso'}
        </span>
      ),
    },
    {
      key: 'difference',
      header: 'Diferencia (Arqueo)',
      render: (s) => {
        if (s.difference === undefined) return <span className="text-slate-400">-</span>;
        const diff = s.difference;
        return (
          <span
            className={`font-mono font-bold text-xs ${
              diff === 0 ? 'text-slate-900 dark:text-white' : diff > 0 ? 'text-blue-700' : 'text-rose-600'
            }`}
          >
            {diff > 0 ? `+$${diff.toFixed(2)} (Sobrante)` : diff < 0 ? `-$${Math.abs(diff).toFixed(2)} (Faltante)` : '$0.00 (Cuadrado)'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Estado',
      render: (s) => (
        <Badge variant={s.status === 'abierta' ? 'info' : s.status === 'cerrada' ? 'neutral' : 'warning'}>
          {s.status.toUpperCase()}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              TESORERÍA & CAJA • ARQUEO AUDITABLE
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Control de Efectivo & Conciliación</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Caja Registradora & Cierres de Turno
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aperturas con fondo inicial, registro justificado de egresos/ingresos y arqueos de conciliación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!activeSession ? (
            <Button
              onClick={() => setIsOpenShiftModalOpen(true)}
              icon={<Unlock className="w-4 h-4" />}
            >
              Abrir Turno de Caja
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                onClick={() => setIsCashMovementModalOpen(true)}
              >
                Ingreso / Egreso
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Lock className="w-3.5 h-3.5" />}
                onClick={() => {
                  setCountedCash(activeSession.expected_cash);
                  setIsCloseShiftModalOpen(true);
                }}
              >
                Cerrar Turno y Arqueo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banner de Estado del Turno Activo */}
      {activeSession ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Turno en Operación: {activeSession.session_number}
              </h3>
              <Badge variant="info">ACTIVO</Badge>
            </div>
            <span className="text-xs text-slate-500">
              Apertura: {new Date(activeSession.opened_at).toLocaleTimeString('es-EC')} • Responsable: {activeSession.user_name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Fondo Inicial</span>
              <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                ${activeSession.opening_float.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Ventas Efectivo</span>
              <span className="text-base font-extrabold font-mono text-emerald-600">
                +${activeSession.cash_sales_total.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Ventas Tarjeta / Transf.</span>
              <span className="text-base font-extrabold font-mono text-blue-600">
                ${(activeSession.card_sales_total + activeSession.transfer_sales_total).toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Egresos / Gastos Menores</span>
              <span className="text-base font-extrabold font-mono text-rose-600">
                -${activeSession.outflows_total.toFixed(2)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800">
              <span className="text-emerald-700 dark:text-emerald-300 block text-[10px] font-bold uppercase">
                Efectivo Teórico en Gaveta
              </span>
              <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300">
                ${activeSession.expected_cash.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
          <Lock className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">
            No hay ningún turno de caja abierto en este momento
          </h3>
          <p className="text-xs text-slate-500">
            Abra un turno ingresando el fondo de monedas y billetes para habilitar cobros en efectivo en el POS.
          </p>
        </div>
      )}

      {/* Historial de Turnos */}
      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Historial de Turnos & Arqueos Realizados
        </h3>
        <DataTable
          columns={sessionColumns}
          data={cashSessions}
          searchPlaceholder="Buscar por turno o cajero..."
          searchableKeys={['session_number', 'user_name']}
          emptyMessage="No se han registrado turnos de caja."
        />
      </div>

      {/* Modal Apertura de Turno */}
      <Modal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        title="Apertura de Turno de Caja"
        subtitle="Declare el fondo inicial asignado en efectivo para dar cambio"
        maxWidth="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpenShiftModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenShift}>
              Abrir Turno de Caja
            </Button>
          </>
        }
      >
        <form onSubmit={handleOpenShift} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fondo Inicial en Billetes y Monedas ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={floatAmount}
                onChange={(e) => setFloatAmount(parseFloat(e.target.value) || 0)}
                className="input-field font-bold text-base font-mono text-emerald-600"
                required
              />
            </div>

            <div>
              <Input
                label="Notas de Apertura"
                placeholder="Observaciones de apertura, cajero responsable..."
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Movimiento de Caja (Ingreso / Egreso) */}
      <Modal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        title="Movimiento de Efectivo en Caja"
        subtitle="Todo egreso o retiro debe contar con justificación y comprobante de soporte"
        maxWidth="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCashMovementModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterMovement}>
              Registrar Movimiento
            </Button>
          </>
        }
      >
        <form onSubmit={handleRegisterMovement} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Movimiento *
              </label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as any)}
                className="input-field"
              >
                <option value="egreso">Egreso / Gasto Menor de Tienda (-)</option>
                <option value="retiro_parcial">Retiro Parcial de Custodia / Blindaje (-)</option>
                <option value="ingreso">Ingreso Adicional de Efectivo (+)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monto en Dólares ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={movementAmount}
                onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                className="input-field font-mono font-bold"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Motivo Detallado y Documento de Respaldo *
              </label>
              <input
                type="text"
                placeholder="Ej: Compra de cinta de embalaje, recibo N° 45"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Cierre de Turno y Arqueo Ciego */}
      <Modal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        title="Cierre de Turno & Arqueo de Caja"
        subtitle="Realice el conteo físico de billetes y monedas para conciliar diferencias"
        maxWidth="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCloseShiftModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleCloseShift}>
              Confirmar Cierre Formal
            </Button>
          </>
        }
      >
        <form onSubmit={handleCloseShift} className="space-y-4 py-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              Efectivo Esperado según Sistema:
            </span>
            <span className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
              ${activeSession?.expected_cash.toFixed(2)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Efectivo Físico Contado ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={countedCash}
              onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
              className="input-field font-mono text-base font-bold text-emerald-600"
              required
            />
          </div>

          {activeSession && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold">Diferencia Estimada:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  Number((countedCash - activeSession.expected_cash).toFixed(2)) === 0
                    ? 'text-emerald-600'
                    : 'text-rose-600'
                }`}
              >
                ${(countedCash - activeSession.expected_cash).toFixed(2)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones de Cierre / Novedades
            </label>
            <textarea
              rows={2}
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
              className="input-field"
              placeholder="Detalles sobre el arqueo o justificación de diferencias..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
