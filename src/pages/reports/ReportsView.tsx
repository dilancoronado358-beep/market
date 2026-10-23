import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { exportToExcel, exportToCsv } from '../../lib/excelUtils';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';

export const ReportsView: React.FC = () => {
  const { sales, products, visits, suppliers, movements, electronicDocs } = useStore();

  const [reportType, setReportType] = useState<'ventas' | 'inventario' | 'proveedores'>('ventas');

  // Cálculos de Ventas
  const totalSalesRevenue = sales
    .filter((s) => s.status === 'completada')
    .reduce((acc, s) => acc + s.total_amount, 0);

  const totalCostOfSales = sales
    .filter((s) => s.status === 'completada')
    .reduce((acc, s) => {
      const itemsCost = (s.items || []).reduce((sum, i) => sum + (i.unit_cost * i.quantity), 0);
      return acc + itemsCost;
    }, 0);

  const estimatedGrossProfit = totalSalesRevenue - totalCostOfSales;
  const marginPercent = totalSalesRevenue > 0 ? (estimatedGrossProfit / totalSalesRevenue) * 100 : 0;

  // Cálculos de Inventario
  const totalStockUnits = products.reduce((acc, p) => acc + p.current_stock, 0);
  const totalValuationCost = products.reduce((acc, p) => acc + (p.current_stock * (p.avg_cost || p.cost_price)), 0);
  const totalValuationRetail = products.reduce((acc, p) => acc + (p.current_stock * p.sale_price), 0);

  const handleExportCurrentReport = (format: 'excel' | 'csv') => {
    let exportData: any[] = [];
    let filename = '';

    if (reportType === 'ventas') {
      filename = `Reporte_Ventas_${new Date().toISOString().split('T')[0]}`;
      exportData = sales.map((s) => ({
        'N° Venta': s.sale_number,
        Fecha: new Date(s.created_at).toLocaleString('es-EC'),
        Cliente: s.customer_name,
        'Método Pago': s.payment_method,
        'Subtotal 0%': s.subtotal_0,
        'Subtotal 15%': s.subtotal_iva,
        IVA: s.iva_amount,
        Total: s.total_amount,
        Estado: s.status,
      }));
    } else if (reportType === 'inventario') {
      filename = `Reporte_Inventario_Valorizado_${new Date().toISOString().split('T')[0]}`;
      exportData = products.map((p) => ({
        Código: p.internal_code,
        Producto: p.name,
        Marca: p.brand || '',
        'Stock Actual': p.current_stock,
        'Stock Mínimo': p.min_stock,
        'En Cuarentena': p.quarantine_stock,
        'Costo Ponderado ($)': (p.avg_cost || p.cost_price).toFixed(2),
        'PVP ($)': p.sale_price.toFixed(2),
        'Valor Total Costo ($)': (p.current_stock * (p.avg_cost || p.cost_price)).toFixed(2),
      }));
    } else {
      filename = `Reporte_Proveedores_Visitas_${new Date().toISOString().split('T')[0]}`;
      exportData = visits.map((v) => {
        const sup = suppliers.find((s) => s.id === v.supplier_id);
        return {
          'N° Visita': v.visit_number,
          Proveedor: sup?.trade_name || sup?.business_name,
          Vendedor: v.sales_rep_name,
          Llegada: new Date(v.check_in_time).toLocaleString('es-EC'),
          Salida: v.check_out_time ? new Date(v.check_out_time).toLocaleString('es-EC') : 'En curso',
          Estado: v.status,
          'Factura Ref': v.invoice_or_doc_ref || 'S/N',
          'Con Daños': v.has_incidents ? 'SÍ' : 'NO',
        };
      });
    }

    if (format === 'excel') {
      exportToExcel(exportData, filename);
      toast.success('Reporte exportado exitosamente a Excel (.xlsx)');
    } else {
      exportToCsv(exportData, filename);
      toast.success('Reporte exportado exitosamente a CSV (.csv)');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reportes Ejecutivos & Exportaciones
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Métricas financieras, valoración de existencias al costo promedio y cumplimiento comercial.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={() => handleExportCurrentReport('excel')}
          >
            Descargar Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => handleExportCurrentReport('csv')}
          >
            Descargar CSV
          </Button>
        </div>
      </div>

      {/* Selector de Pestañas de Reporte */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        {[
          { id: 'ventas', label: 'Ventas y Rentabilidad', icon: <DollarSign className="w-4 h-4" /> },
          { id: 'inventario', label: 'Inventario & Valoración', icon: <Boxes className="w-4 h-4" /> },
          { id: 'proveedores', label: 'Proveedores & Visitas', icon: <Truck className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setReportType(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-colors ${
              reportType === t.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* KPI Cards del Reporte */}
      {reportType === 'ventas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatCard
              title="Facturación Bruta"
              value={`$${totalSalesRevenue.toFixed(2)}`}
              subtitle={`${sales.length} transacciones`}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <StatCard
              title="Costo de Mercadería"
              value={`$${totalCostOfSales.toFixed(2)}`}
              subtitle="Al costo promedio ponderado"
              icon={<Boxes className="w-5 h-5" />}
              iconBg="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              title="Utilidad Bruta Estimada"
              value={`$${estimatedGrossProfit.toFixed(2)}`}
              subtitle="Margen de contribución"
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              title="Margen Porcentual"
              value={`${marginPercent.toFixed(1)}%`}
              subtitle="Promedio sobre ventas"
              icon={<TrendingUp className="w-5 h-5" />}
            />
          </div>
        </div>
      )}

      {reportType === 'inventario' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Existencias Totales"
              value={`${totalStockUnits} unid.`}
              subtitle="En perchas y bodega"
              icon={<Package className="w-5 h-5" />}
            />
            <StatCard
              title="Valoración al Costo"
              value={`$${totalValuationCost.toFixed(2)}`}
              subtitle="Costo Promedio Ponderado"
              icon={<DollarSign className="w-5 h-5" />}
              iconBg="bg-purple-500/10 text-purple-600"
            />
            <StatCard
              title="Valoración Estimada PVP"
              value={`$${totalValuationRetail.toFixed(2)}`}
              subtitle="A precio de venta al público"
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-emerald-500/10 text-emerald-600"
            />
          </div>
        </div>
      )}

      {reportType === 'proveedores' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Proveedores Activos"
              value={suppliers.length}
              subtitle="Empresas registradas"
              icon={<Truck className="w-5 h-5" />}
            />
            <StatCard
              title="Visitas Realizadas"
              value={visits.length}
              subtitle="Expedientes digitales registrados"
              icon={<Boxes className="w-5 h-5" />}
              iconBg="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              title="Incidencias con Proveedores"
              value={visits.filter((v) => v.has_incidents).length}
              subtitle="Visitas con reclamos o daños"
              icon={<Truck className="w-5 h-5" />}
              iconBg="bg-rose-500/10 text-rose-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};
