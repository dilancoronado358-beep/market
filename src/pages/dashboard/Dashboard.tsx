import React from 'react';
import { clsx } from 'clsx';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import {
  DollarSign,
  ShoppingCart,
  Boxes,
  Truck,
  AlertTriangle,
  FileCode2,
  Package,
  Clock,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardProps {
  onNavigate: (route: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const {
    sales,
    products,
    visits,
    replacements,
    incidents,
    electronicDocs,
    emailQueue,
    cashSessions,
  } = useStore();

  // Utilidad para comparar fechas en horario local del usuario
  const isSameDay = (dateStr: string | null | undefined, targetDate: Date) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return (
      d.getFullYear() === targetDate.getFullYear() &&
      d.getMonth() === targetDate.getMonth() &&
      d.getDate() === targetDate.getDate()
    );
  };

  const now = new Date();

  // 1. Indicadores de Ventas (solo ventas completadas válidas)
  const validSales = sales.filter((s) => s.status === 'completada');
  const todaySales = validSales.filter((s) => isSameDay(s.created_at, now));
  const todayRevenue = todaySales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const totalSalesRevenue = validSales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
  const avgTicket = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;

  // Comparativa real de ventas con el día anterior
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdaySales = validSales.filter((s) => isSameDay(s.created_at, yesterday));
  const yesterdayRevenue = yesterdaySales.reduce((acc, s) => acc + (s.total_amount || 0), 0);

  let salesTrend: { value: number; isPositive: boolean } | undefined = undefined;
  if (yesterdayRevenue > 0) {
    const diff = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    salesTrend = {
      value: Math.abs(Number(diff.toFixed(1))),
      isPositive: diff >= 0,
    };
  } else if (todayRevenue > 0) {
    salesTrend = {
      value: 100,
      isPositive: true,
    };
  }

  // 2. Indicadores de Inventario
  const lowStockProducts = products.filter((p) => p.current_stock <= p.min_stock && p.is_active);
  const zeroStockProducts = products.filter((p) => p.current_stock <= 0 && p.is_active);
  const totalCostValuation = products.reduce((acc, p) => {
    const stock = Math.max(0, p.current_stock || 0);
    const cost = p.avg_cost && p.avg_cost > 0 ? p.avg_cost : (p.cost_price || 0);
    return acc + (stock * cost);
  }, 0);
  const totalRetailValuation = products.reduce((acc, p) => {
    const stock = Math.max(0, p.current_stock || 0);
    const price = p.sale_price || 0;
    return acc + (stock * price);
  }, 0);
  const totalQuarantineUnits = products.reduce((acc, p) => acc + (p.quarantine_stock || 0), 0);

  // 3. Indicadores de Proveedores y Visitas
  const todayVisits = visits.filter((v) => isSameDay(v.check_in_time, now));
  const activeVisits = visits.filter((v) => v.status === 'en_curso' || v.status === 'en_recepcion');
  const pendingReplacements = replacements.filter((r) => r.status === 'pendiente_entrega' || r.status === 'solicitada');
  const openIncidents = incidents.filter((i) => i.status !== 'resuelto' && i.status !== 'cerrado_sin_compensacion');

  // 4. Indicadores Administrativos y SRI
  const pendingSriDocs = electronicDocs.filter((d) => d.status === 'pendiente' || d.status === 'enviado');
  const failedEmails = emailQueue.filter((e) => e.status === 'fallido');
  const activeCashSession = cashSessions.find((cs) => cs.status === 'abierta');

  // 5. Datos Reales para Gráfico de Ventas de la Semana en Curso (Lunes a Domingo)
  const currentDayOfWeek = now.getDay();
  const mondayOffset = (currentDayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const weeklyData = dayNames.map((dayName, idx) => {
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + idx);
    const daySales = validSales.filter((s) => isSameDay(s.created_at, targetDate));
    const total = daySales.reduce((acc, s) => acc + (s.total_amount || 0), 0);
    return {
      day: dayName,
      date: `${targetDate.getDate()}/${targetDate.getMonth() + 1}`,
      total: Number(total.toFixed(2)),
      count: daySales.length,
    };
  });

  // 6. Métodos de Pago Reales (solo ventas completadas)
  const cashSalesCount = validSales.filter((s) => s.payment_method === 'efectivo').length;
  const cardSalesCount = validSales.filter((s) => s.payment_method === 'tarjeta').length;
  const transferSalesCount = validSales.filter((s) => s.payment_method === 'transferencia').length;
  const totalPaymentOperations = cashSalesCount + cardSalesCount + transferSalesCount;

  const paymentData = [
    { name: 'Efectivo', value: cashSalesCount, color: '#0f172a' },
    { name: 'Tarjeta', value: cardSalesCount, color: '#1d4ed8' },
    { name: 'Transferencia', value: transferSalesCount, color: '#64748b' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner de Bienvenida y Acciones Rápidas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-slate-900 text-white shadow-card relative overflow-hidden border border-slate-800">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            <span>Tienda Operativa Matriz • Quito, Ecuador</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Panel Ejecutivo: {user?.full_name}
          </h1>
          <p className="text-xs text-slate-400">
            Consolidado general en tiempo real de operaciones comerciales, recepción de proveedores, Kardex y caja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 z-10">
          <button
            onClick={() => onNavigate('pos')}
            className="btn-primary text-xs font-bold"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Punto de Venta</span>
          </button>
          <button
            onClick={() => onNavigate('productos')}
            className="px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
          >
            <Boxes className="w-4 h-4" />
            <span>Catálogo</span>
          </button>
          <button
            onClick={() => onNavigate('caja')}
            className="px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
          >
            <Wallet className="w-4 h-4" />
            <span>Caja</span>
          </button>
          <button
            onClick={() => onNavigate('visitas')}
            className="px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span>Visitas</span>
          </button>
        </div>
      </div>

      {/* Grid de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas de Hoy"
          value={`$${todayRevenue.toFixed(2)}`}
          subtitle={`${todaySales.length} transacciones registradas`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={salesTrend}
          onClick={() => onNavigate('ventas')}
        />

        <StatCard
          title="Stock Bajo / Crítico"
          value={lowStockProducts.length}
          subtitle={`${zeroStockProducts.length} agotados`}
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg={lowStockProducts.length > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-brand-500/10 text-brand-600'}
          onClick={() => onNavigate('productos')}
        />

        <StatCard
          title="Visitas Proveedor Hoy"
          value={todayVisits.length}
          subtitle={`${activeVisits.length} en curso ahora`}
          icon={<Truck className="w-5 h-5" />}
          iconBg="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          onClick={() => onNavigate('visitas')}
        />

        <StatCard
          title="Valor Inventario (Costo)"
          value={`$${totalCostValuation.toFixed(2)}`}
          subtitle={`PVP Estimado: $${totalRetailValuation.toFixed(2)}`}
          icon={<Boxes className="w-5 h-5" />}
          iconBg="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          onClick={() => onNavigate('inventario')}
        />
      </div>

      {/* Fila Secundaria de KPIs Específicos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ticket Promedio</p>
          <p className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            ${avgTicket.toFixed(2)}
          </p>
          <span className="text-[10px] text-slate-400">Por venta registrada hoy</span>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">En Cuarentena / Dañado</p>
          <p className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {totalQuarantineUnits} <span className="text-xs font-sans text-slate-500 font-normal">unid.</span>
          </p>
          <span className="text-[10px] text-slate-400">{openIncidents.length} incidencias abiertas</span>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reposiciones Proveedor</p>
          <p className="text-xl font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {pendingReplacements.length} <span className="text-xs font-sans text-slate-500 font-normal">pendientes</span>
          </p>
          <span className="text-[10px] text-slate-400">Compromisos de entrega</span>
        </div>

        <div className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Turno de Caja</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
            <span className={clsx('w-2 h-2 rounded-full', activeCashSession ? 'bg-blue-500' : 'bg-slate-400')} />
            {activeCashSession ? 'Abierto' : 'Cerrado'}
          </p>
          <span className="text-[10px] text-slate-400">
            {activeCashSession ? `Fondo inicial: $${activeCashSession.opening_float}` : 'Requiere apertura'}
          </span>
        </div>
      </div>

      {/* Gráficos y Desglose Visual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico de Ventas Semanales */}
        <div className="lg:col-span-2 rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Evolución de Ventas Semanales
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ingresos diarios consolidados en dólares estadounidenses (USD)
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Semana en Curso</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(value: any, _name: any, item: any) => {
                    const count = item?.payload?.count || 0;
                    return [`$${Number(value).toFixed(2)} (${count} venta${count === 1 ? '' : 's'})`, 'Ventas'];
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="total" fill="#1e3a8a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Métodos de Pago y Resumen de Caja */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
            Ventas por Método de Pago
          </h2>
          <div className="h-44 w-full flex items-center justify-center">
            {totalPaymentOperations > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData.filter((p) => p.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentData.filter((p) => p.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [val, 'Operaciones']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 py-6">
                Sin ventas registradas
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {paymentData.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-slate-600 dark:text-slate-300 text-[11px]">{p.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">{p.value} ventas</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tablas Inferiores: Visitas Recientes y Productos con Alerta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Visitas de Proveedores de Atención Inmediata */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Expedientes de Visitas Recientes
              </h2>
            </div>
            <button
              onClick={() => onNavigate('visitas')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5"
            >
              <span>Ver todas</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {visits.slice(0, 4).map((v) => (
              <div
                key={v.id}
                onClick={() => onNavigate('visitas')}
                className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {v.visit_number}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase">
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rep: {v.sales_rep_name} • Ref: {v.invoice_or_doc_ref || 'S/N'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-slate-400 block">
                    {new Date(v.check_in_time).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {v.has_incidents && (
                    <span className="text-[10px] text-rose-500 font-semibold block">
                      Con incidencias
                    </span>
                  )}
                </div>
              </div>
            ))}
            {visits.length === 0 && (
              <div className="py-8 px-4 text-center rounded-lg bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                No se registran visitas de proveedores en la jornada actual.
              </div>
            )}
          </div>
        </div>

        {/* Productos Críticos para Reordenar */}
        <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                Productos con Stock Crítico
              </h2>
            </div>
            <button
              onClick={() => onNavigate('productos')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-0.5"
            >
              <span>Ver catálogo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {lowStockProducts.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {p.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {p.internal_code} • {p.brand || 'General'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {p.current_stock} / min {p.min_stock} {p.unit_of_measure}
                  </span>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="py-8 px-4 text-center rounded-lg bg-slate-50/50 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                Todo el inventario se encuentra dentro de los márgenes óptimos de seguridad.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
