import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { CashSession, CashMovement } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { exportToExcel } from '../../lib/excelUtils';
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
  Calendar,
  CreditCard,
  Send,
  Coins,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export const CashRegister: React.FC = () => {
  const { cashSessions, cashMovements, sales, openCashSession, registerCashMovement, closeCashSession } = useStore();
  const { user, hasPermission } = useAuth();

  // Estados de Modales
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  // Pestaña activa: turnos o caja cuadrada del día
  const [activeTab, setActiveTab] = useState<'turnos' | 'cuadre_dia'>('turnos');
  const [reconciliationDate, setReconciliationDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('todos');
  const [countedPhysicalInput, setCountedPhysicalInput] = useState<string>('');

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

  // ============================================================================
  // CÁLCULOS AUDITABLES DE CAJA CUADRADA DEL DÍA (EFECTIVO, TRANSFERENCIA, TARJETA)
  // ============================================================================
  const daySales = sales.filter((s) => {
    if (s.status === 'anulada') return false;
    const saleDateStr = new Date(s.created_at).toISOString().split('T')[0];
    return saleDateStr === reconciliationDate;
  });

  const cashSales = daySales.filter((s) => s.payment_method === 'efectivo');
  const transferSales = daySales.filter((s) => s.payment_method === 'transferencia');
  const cardSales = daySales.filter((s) => s.payment_method === 'tarjeta');
  const otherSales = daySales.filter((s) => !['efectivo', 'transferencia', 'tarjeta'].includes(s.payment_method));

  const cashTotal = cashSales.reduce((acc, s) => acc + s.total_amount, 0);
  const transferTotal = transferSales.reduce((acc, s) => acc + s.total_amount, 0);
  const cardTotal = cardSales.reduce((acc, s) => acc + s.total_amount, 0);
  const otherTotal = otherSales.reduce((acc, s) => acc + s.total_amount, 0);

  // TOTAL DE LOS TRES UNIDOS
  const grandTotalAllMethods = cashTotal + transferTotal + cardTotal + otherTotal;

  // Movimientos de efectivo del día
  const dayMovements = cashMovements.filter((m) => {
    const movDateStr = new Date(m.created_at).toISOString().split('T')[0];
    return movDateStr === reconciliationDate;
  });

  const dayCashIn = dayMovements.filter((m) => m.movement_type === 'ingreso').reduce((acc, m) => acc + m.amount, 0);
  const dayCashOut = dayMovements.filter((m) => m.movement_type !== 'ingreso').reduce((acc, m) => acc + m.amount, 0);

  // Fondos iniciales de los turnos abiertos en la fecha
  const daySessions = cashSessions.filter((s) => {
    const sessDateStr = new Date(s.opened_at).toISOString().split('T')[0];
    return sessDateStr === reconciliationDate;
  });
  const dayOpeningFloat = daySessions.reduce((acc, s) => acc + s.opening_float, 0);

  // Efectivo físico esperado en gaveta
  const expectedPhysicalCash = dayOpeningFloat + cashTotal + dayCashIn - dayCashOut;
  const actualPhysicalCounted = countedPhysicalInput === '' ? expectedPhysicalCash : parseFloat(countedPhysicalInput) || 0;
  const cashDifference = actualPhysicalCounted - expectedPhysicalCash;

  // Filtrado de ventas del día por medio de pago seleccionado
  const filteredDaySales = daySales.filter((s) => {
    if (paymentMethodFilter === 'todos') return true;
    return s.payment_method === paymentMethodFilter;
  });

  // Exportar reporte de caja cuadrada a Excel (.xlsx)
  const handleExportDailySquare = () => {
    try {
      const summaryRows = [
        { 'Tipo de Registro': 'ENCABEZADO', 'Concepto': 'FECHA DE CONCILIACIÓN', 'Detalle': reconciliationDate, 'Transacciones': daySales.length, 'Monto Total ($)': grandTotalAllMethods },
        { 'Tipo de Registro': 'MEDIO DE PAGO', 'Concepto': 'VENTAS EN EFECTIVO', 'Detalle': 'Cobros en efectivo en POS', 'Transacciones': cashSales.length, 'Monto Total ($)': cashTotal },
        { 'Tipo de Registro': 'MEDIO DE PAGO', 'Concepto': 'VENTAS EN TRANSFERENCIA', 'Detalle': 'Depósitos / Transferencias bancarias', 'Transacciones': transferSales.length, 'Monto Total ($)': transferTotal },
        { 'Tipo de Registro': 'MEDIO DE PAGO', 'Concepto': 'VENTAS EN TARJETA', 'Detalle': 'Tarjetas de débito y crédito', 'Transacciones': cardSales.length, 'Monto Total ($)': cardTotal },
        { 'Tipo de Registro': 'CONSOLIDADO', 'Concepto': 'TOTAL DE LOS TRES MÉTODOS UNIDOS', 'Detalle': 'Total Facturación Diaria Recaudada', 'Transacciones': daySales.length, 'Monto Total ($)': grandTotalAllMethods },
        { 'Tipo de Registro': 'ARQUEO EFECTIVO', 'Concepto': 'Fondo Inicial de Turnos', 'Detalle': 'Fondo de apertura de cajeros', 'Transacciones': daySessions.length, 'Monto Total ($)': dayOpeningFloat },
        { 'Tipo de Registro': 'ARQUEO EFECTIVO', 'Concepto': 'Ingresos Manuales Efectivo', 'Detalle': 'Reposiciones o ingresos varios', 'Transacciones': dayMovements.filter(m => m.movement_type === 'ingreso').length, 'Monto Total ($)': dayCashIn },
        { 'Tipo de Registro': 'ARQUEO EFECTIVO', 'Concepto': 'Egresos / Gastos Menores', 'Detalle': 'Salidas justificadas de gaveta', 'Transacciones': dayMovements.filter(m => m.movement_type !== 'ingreso').length, 'Monto Total ($)': dayCashOut },
        { 'Tipo de Registro': 'ARQUEO EFECTIVO', 'Concepto': 'EFECTIVO TEÓRICO ESPERADO', 'Detalle': 'Fondo + Ventas Efectivo + Ingresos - Egresos', 'Transacciones': '-', 'Monto Total ($)': expectedPhysicalCash },
        { 'Tipo de Registro': 'ARQUEO EFECTIVO', 'Concepto': 'CONTEO FÍSICO REAL', 'Detalle': 'Billetes y monedas en arqueo', 'Transacciones': '-', 'Monto Total ($)': actualPhysicalCounted },
        { 'Tipo de Registro': 'RESULTADO', 'Concepto': 'ESTADO DE CUADRE', 'Detalle': cashDifference === 0 ? 'CAJA CUADRADA' : cashDifference > 0 ? 'SOBRANTE' : 'FALTANTE', 'Transacciones': '-', 'Monto Total ($)': cashDifference },
      ];

      exportToExcel(summaryRows, `Caja_Cuadrada_${reconciliationDate}_ERP_POS_Ecuador`, 'Conciliación Diaria');
      toast.success('Cuadre de caja exportado exitosamente a Excel (.xlsx)');
    } catch (err: any) {
      toast.error(err.message || 'Error al exportar cuadre de caja');
    }
  };

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

  const dailySaleColumns: Column<any>[] = [
    {
      key: 'sale_number',
      header: 'N° Ticket / Factura',
      sortable: true,
      render: (s) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
          {s.sale_number}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Hora',
      sortable: true,
      render: (s) => (
        <span className="text-xs text-slate-500 font-mono">
          {new Date(s.created_at).toLocaleTimeString('es-EC')}
        </span>
      ),
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      render: (s) => (
        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
          {s.customer_name}
        </span>
      ),
    },
    {
      key: 'payment_method',
      header: 'Método de Pago',
      render: (s) => {
        const isCash = s.payment_method === 'efectivo';
        const isTransfer = s.payment_method === 'transferencia';
        const isCard = s.payment_method === 'tarjeta';
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
              isCash
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : isTransfer
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                : isCard
                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}
          >
            {s.payment_method}
          </span>
        );
      },
    },
    {
      key: 'subtotal_iva',
      header: 'Subtotal ($)',
      render: (s) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
          ${(s.subtotal_0 + s.subtotal_iva).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'iva_amount',
      header: 'IVA 15% ($)',
      render: (s) => (
        <span className="font-mono text-xs text-slate-500">
          ${s.iva_amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Cobrado ($)',
      sortable: true,
      render: (s) => (
        <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
          ${s.total_amount.toFixed(2)}
        </span>
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
            Caja Registradora & Conciliación
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de turnos, arqueos ciegos y caja cuadrada del día por efectivo, transferencia y tarjeta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            id="btn-header-cuadre-dia"
            variant={activeTab === 'cuadre_dia' ? 'primary' : 'outline'}
            size="sm"
            icon={<Calculator className="w-4 h-4" />}
            onClick={() => setActiveTab(activeTab === 'cuadre_dia' ? 'turnos' : 'cuadre_dia')}
          >
            {activeTab === 'cuadre_dia' ? 'Ver Turnos de Caja' : 'Caja Cuadrada del Día'}
          </Button>

          {activeTab === 'turnos' && (
            !activeSession ? (
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
            )
          )}
        </div>
      </div>

      {/* Selector de Pestañas Principales */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          id="tab-btn-turnos"
          type="button"
          onClick={() => setActiveTab('turnos')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'turnos'
              ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Turnos de Operación ({cashSessions.length})</span>
        </button>

        <button
          id="tab-btn-cuadre-dia"
          type="button"
          onClick={() => setActiveTab('cuadre_dia')}
          className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
            activeTab === 'cuadre_dia'
              ? 'text-slate-900 dark:text-white border-b-2 border-slate-900 dark:border-white'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Caja Cuadrada del Día (Efectivo / Transferencia / Tarjeta)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* PESTAÑA 1: TURNOS DE OPERACIÓN                                        */}
      {/* ==================================================================== */}
      {activeTab === 'turnos' && (
        <div className="space-y-6 animate-fade-in">
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
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 2: CAJA CUADRADA DEL DÍA (CONCILIACIÓN DIARIA CONSOLIDADA)   */}
      {/* ==================================================================== */}
      {activeTab === 'cuadre_dia' && (
        <div className="space-y-6 animate-fade-in">
          {/* Barra de Controles de Fecha y Exportación */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Fecha de Conciliación:</span>
              </div>
              <input
                type="date"
                value={reconciliationDate}
                onChange={(e) => setReconciliationDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="button"
                onClick={() => setReconciliationDate(new Date().toISOString().split('T')[0])}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                Hoy
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
              onClick={handleExportDailySquare}
            >
              Exportar Cuadre a Excel (.xlsx)
            </Button>
          </div>

          {/* 4 Tarjetas de Métodos de Pago: Efectivo, Transferencia, Tarjeta y Total Unido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. VENTAS EN EFECTIVO */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4" />
                  Ventas en Efectivo
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {cashSales.length} cobros
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                ${cashTotal.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">
                Dinero cobrado directamente en caja física
              </p>
            </div>

            {/* 2. VENTAS EN TRANSFERENCIA */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Send className="w-4 h-4" />
                  Ventas Transferencia
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {transferSales.length} cobros
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-blue-700 dark:text-blue-300">
                ${transferTotal.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">
                Depósitos bancarios y transferencias directas
              </p>
            </div>

            {/* 3. VENTAS EN TARJETA */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  Ventas en Tarjeta
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                  {cardSales.length} cobros
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-purple-700 dark:text-purple-300">
                ${cardTotal.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">
                Datafast / Medianet (Débito y Crédito)
              </p>
            </div>

            {/* 4. TOTAL DE LOS TRES UNIDOS */}
            <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 shadow-md space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Total de los 3 Unidos
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-white">
                  {daySales.length} ventas
                </span>
              </div>
              <div className="text-3xl font-black font-mono text-white">
                ${grandTotalAllMethods.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Efectivo + Transferencia + Tarjeta
              </p>
            </div>
          </div>

          {/* Panel de Conciliación & Arqueo de Efectivo Físico del Día */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Arqueo de Cuadre de Gaveta (Efectivo Físico)
                </h3>
                <p className="text-xs text-slate-500">
                  Comparación entre el efectivo que el sistema calculó y el dinero real contado en billetes y monedas.
                </p>
              </div>

              {/* Badge Dinámico de Estado de Cuadre */}
              <div>
                {cashDifference === 0 ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    CAJA CUADRADA EXITOSAMENTE ($0.00 DIFERENCIA)
                  </span>
                ) : cashDifference > 0 ? (
                  <span className="px-3 py-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 text-xs font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-blue-600" />
                    SOBRANTE EN CAJA: +${cashDifference.toFixed(2)}
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    FALTANTE EN CAJA: -${Math.abs(cashDifference).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Desglose de Operaciones de Efectivo */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">1. Fondo Inicial</span>
                <span className="text-base font-extrabold font-mono text-slate-800 dark:text-slate-200">
                  ${dayOpeningFloat.toFixed(2)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Apertura de turnos</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] font-bold uppercase">2. (+) Ventas Efectivo</span>
                <span className="text-base font-extrabold font-mono text-emerald-600">
                  +${cashTotal.toFixed(2)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">{cashSales.length} transacciones</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 block text-[10px] font-bold uppercase">3. (+) Ingresos Manuales</span>
                <span className="text-base font-extrabold font-mono text-blue-600">
                  +${dayCashIn.toFixed(2)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Entradas autorizadas</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60">
                <span className="text-rose-700 dark:text-rose-400 block text-[10px] font-bold uppercase">4. (-) Egresos / Gastos</span>
                <span className="text-base font-extrabold font-mono text-rose-600">
                  -${dayCashOut.toFixed(2)}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">Retiros justificados</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700">
                <span className="text-emerald-800 dark:text-emerald-300 block text-[10px] font-extrabold uppercase">
                  5. (=) Efectivo Esperado
                </span>
                <span className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-200">
                  ${expectedPhysicalCash.toFixed(2)}
                </span>
                <span className="block text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Teórico en gaveta</span>
              </div>
            </div>

            {/* Input para Conteo Real Físico */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-brand-600" />
                  Validar Conteo Físico Real de Dinero:
                </span>
                <p className="text-[11px] text-slate-500">
                  Ingresa el total de monedas y billetes que tienes físicamente en la gaveta para calcular si la caja cuadra exactamente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={expectedPhysicalCash.toFixed(2)}
                    value={countedPhysicalInput}
                    onChange={(e) => setCountedPhysicalInput(e.target.value)}
                    className="w-40 pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-mono font-black text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCountedPhysicalInput(expectedPhysicalCash.toFixed(2))}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Auto-cuadrar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla de Detalle de Ventas del Día con Filtro de Medio de Pago */}
          <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Detalle de Ventas del Día ({filteredDaySales.length} comprobantes)
                </h3>
                <p className="text-xs text-slate-500">
                  Listado auditado de transacciones con desglose de subtotal, IVA y monto total.
                </p>
              </div>

              {/* Filtro por Medio de Pago */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['todos', 'efectivo', 'transferencia', 'tarjeta'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethodFilter(method)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all capitalize ${
                      paymentMethodFilter === method
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <DataTable
              columns={dailySaleColumns}
              data={filteredDaySales}
              searchPlaceholder="Buscar por factura o cliente..."
              searchableKeys={['sale_number', 'customer_name']}
              emptyMessage={`No hay ventas registradas el ${reconciliationDate} con el filtro seleccionado.`}
            />
          </div>
        </div>
      )}

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
