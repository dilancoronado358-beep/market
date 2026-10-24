import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ProductFormModal } from './ProductFormModal';
import { exportToExcel, exportToCsv, parseExcelFile } from '../../lib/excelUtils';
import {
  Package,
  Plus,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  Edit,
  DollarSign,
  Boxes,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProductsList: React.FC = () => {
  const { products, categories, suppliers, createProduct, isStoreLoading, refresh } = useStore();
  const { hasPermission } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<string>('todos');


  const filteredProducts = products.filter((p) => {
    if (categoryFilter === 'todos') return true;
    return p.category_id === categoryFilter;
  });

  const handleExportExcel = () => {
    const exportData = filteredProducts.map((p) => ({
      'Código Interno': p.internal_code,
      'Código de Barras': p.barcode || '',
      Nombre: p.name,
      Categoría: categories.find((c) => c.id === p.category_id)?.name || 'General',
      Marca: p.brand || '',
      'Stock Actual': p.current_stock,
      'Stock Mínimo': p.min_stock,
      'En Cuarentena': p.quarantine_stock || 0,
      'Costo Compra ($)': p.cost_price,
      'Costo Promedio ($)': p.avg_cost || p.cost_price,
      'Precio Venta ($)': p.sale_price,
      'Tarifa IVA (%)': p.iva_rate,
      Ubicación: p.location || '',
    }));
    exportToExcel(exportData, `Catalogo_Productos_ERP_POS_Ecuador_${new Date().toISOString().split('T')[0]}`);
    toast.success('Catálogo exportado exitosamente a Excel');
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rows = await parseExcelFile(file);
      let count = 0;
      for (const row of rows) {
        if (row['Código Interno'] && row['Nombre']) {
          await createProduct(
            {
              internal_code: String(row['Código Interno']),
              barcode: row['Código de Barras'] ? String(row['Código de Barras']) : undefined,
              name: String(row['Nombre']),
              brand: row['Marca'] ? String(row['Marca']) : undefined,
              unit_of_measure: 'unidad',
              unit_purchase: 'unidad',
              unit_conversion_ratio: 1,
              cost_price: parseFloat(row['Costo Compra ($)']) || 1.0,
              avg_cost: parseFloat(row['Costo Compra ($)']) || 1.0,
              sale_price: parseFloat(row['Precio Venta ($)']) || 1.5,
              iva_rate: parseFloat(row['Tarifa IVA (%)']) || 15.0,
              min_stock: parseInt(row['Stock Mínimo']) || 5,
              max_stock: 100,
              is_active: true,
            },
            parseInt(row['Stock Actual']) || 0
          );
          count++;
        }
      }
      toast.success(`${count} productos importados correctamente a Supabase.`);
    } catch (err: any) {
      toast.error('Error al importar archivo Excel: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'internal_code',
      header: 'Código / Barras',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {p.internal_code}
          </span>
          <span className="block text-[11px] text-slate-400 font-mono">
            {p.barcode || 'Sin código de barra'}
          </span>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Producto & Marca',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
          <p className="text-[11px] text-slate-400">
            {categories.find((c) => c.id === p.category_id)?.name || 'General'} • {p.brand || 'Genérico'}
          </p>
        </div>
      ),
    },
    {
      key: 'current_stock',
      header: 'Existencias',
      sortable: true,
      render: (p) => {
        const isLow = p.current_stock <= p.min_stock;
        const isZero = p.current_stock <= 0;
        return (
          <div className="space-y-0.5">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isZero
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : isLow
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {p.current_stock} {p.unit_of_measure}
            </span>
            {p.quarantine_stock > 0 && (
              <span className="block text-[10px] text-rose-500 font-semibold">
                {p.quarantine_stock} en cuarentena
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'cost_price',
      header: 'Costo Promedio',
      sortable: true,
      render: (p) => (
        <span className="font-mono text-slate-600 dark:text-slate-300">
          ${(p.avg_cost || p.cost_price).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'sale_price',
      header: 'Precio Venta (PVP)',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
            ${p.sale_price.toFixed(2)}
          </span>
          <span className="block text-[10px] text-slate-400 font-medium">
            IVA {p.iva_rate}%
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (p) => (
        <Button
          size="sm"
          variant="ghost"
          icon={<Edit className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            setProductToEdit(p);
            setIsFormOpen(true);
          }}
        >
          Editar
        </Button>
      ),
    },
  ];

  // KPIs de catálogo
  const totalItemsCount = products.length;
  const totalCostValuation = products.reduce((acc, p) => acc + (p.current_stock * (p.avg_cost || p.cost_price)), 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + (p.current_stock * p.sale_price), 0);
  const lowStockCount = products.filter((p) => p.current_stock <= p.min_stock).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              INVENTARIO & VALORIZACIÓN • ERP ECUADOR
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Catálogo Maestro de Artículos</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Catálogo Integral de Productos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control de códigos de barra, conversiones de unidades, valoración de inventario e IVA vigente en Ecuador.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Input oculto para importación de Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportExcel}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isStoreLoading ? 'animate-spin text-brand-600' : ''}`} />}
            onClick={handleManualSync}
            disabled={isSyncing || isStoreLoading}
            title="Sincronizar en vivo con la base de datos de Supabase"
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={() => fileInputRef.current?.click()}
          >
            Importar Excel
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
            onClick={handleExportExcel}
          >
            Exportar Catálogo
          </Button>

          {hasPermission('manage_products') && (
            <Button
              onClick={() => {
                setProductToEdit(null);
                setIsFormOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
              size="sm"
            >
              Nuevo Producto
            </Button>
          )}
        </div>
      </div>

      {/* KPI Ribbon Superior */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Artículos</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalItemsCount}</span>
          <span className="text-[10px] text-slate-400">Productos registrados</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Valorización (Costo)</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">${totalCostValuation.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">Costo Promedio Ponderado</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Valorización (PVP)</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">${totalRetailValuation.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">Precio de Venta al Público</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">Alerta Stock Mínimo</span>
          <span className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1 block font-mono">{lowStockCount}</span>
          <span className="text-[10px] text-slate-400">Requieren reposición</span>
        </div>
      </div>

      {/* Filtro por Categorías */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setCategoryFilter('todos')}
          className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap text-[11px] ${
            categoryFilter === 'todos'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-subtle'
              : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          Todas las categorías ({products.length})
        </button>
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1 rounded-md transition-colors whitespace-nowrap text-[11px] ${
                categoryFilter === c.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-subtle'
                  : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              {c.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchPlaceholder="Buscar por nombre, código interno, código de barras o marca..."
          searchableKeys={['internal_code', 'barcode', 'name', 'brand']}
          emptyMessage="No se encontraron productos en el catálogo."
          enableBarcodeScanner={true}
        />
      </div>

      {/* Modal de Crear / Editar Producto */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />
    </div>
  );
};
