import React, { useState, useEffect } from 'react';
import { Product } from '../../types/database';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';
import { Camera } from 'lucide-react';
import { toast } from 'sonner';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, suppliers, createProduct, updateProduct } = useStore();
  const { hasPermission } = useAuth();

  const [internalCode, setInternalCode] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('unidad');
  const [unitPurchase, setUnitPurchase] = useState('caja x 12');
  const [unitConversion, setUnitConversion] = useState(1);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [ivaRate, setIvaRate] = useState<number>(15.00);
  const [minStock, setMinStock] = useState<number>(5);
  const [maxStock, setMaxStock] = useState<number>(100);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [auditReason, setAuditReason] = useState('Actualización ordinaria de catálogo');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setInternalCode(productToEdit.internal_code);
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setCategoryId(productToEdit.category_id || '');
      setBrand(productToEdit.brand || '');
      setUnitOfMeasure(productToEdit.unit_of_measure);
      setUnitPurchase(productToEdit.unit_purchase);
      setUnitConversion(productToEdit.unit_conversion_ratio);
      setCostPrice(productToEdit.cost_price);
      setSalePrice(productToEdit.sale_price);
      setWholesalePrice(productToEdit.wholesale_price || 0);
      setIvaRate(productToEdit.iva_rate);
      setMinStock(productToEdit.min_stock);
      setMaxStock(productToEdit.max_stock);
      setLocation(productToEdit.location || '');
      setSupplierId(productToEdit.main_supplier_id || '');
    } else {
      // Valores por defecto para nuevo producto
      setInternalCode(`PRD-${Math.floor(1000 + Math.random() * 9000)}`);
      setSku('');
      setBarcode('');
      setName('');
      setDescription('');
      setCategoryId('');
      setBrand('');
      setUnitOfMeasure('unidad');
      setUnitPurchase('unidad');
      setUnitConversion(1);
      setCostPrice(1.0);
      setSalePrice(1.5);
      setWholesalePrice(1.35);
      setIvaRate(15.0);
      setMinStock(5);
      setMaxStock(100);
      setInitialStock(0);
      setLocation('');
      setSupplierId('');
    }
  }, [productToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!internalCode || !name) {
      toast.error('Código y Nombre son obligatorios');
      return;
    }

    // Validar permiso de cambio de precio
    if (productToEdit && productToEdit.sale_price !== salePrice && !hasPermission('change_prices')) {
      toast.error('No tiene permisos para modificar precios de venta.');
      return;
    }

    if (productToEdit) {
      updateProduct(
        productToEdit.id,
        {
          internal_code: internalCode,
          sku: sku || undefined,
          barcode: barcode || undefined,
          name,
          description,
          category_id: categoryId || undefined,
          brand,
          unit_of_measure: unitOfMeasure,
          unit_purchase: unitPurchase,
          unit_conversion_ratio: unitConversion,
          cost_price: costPrice,
          sale_price: salePrice,
          wholesale_price: wholesalePrice || undefined,
          iva_rate: ivaRate,
          min_stock: minStock,
          max_stock: maxStock,
          location,
          main_supplier_id: supplierId || undefined,
        },
        auditReason
      );
    } else {
      createProduct(
        {
          internal_code: internalCode,
          sku: sku || undefined,
          barcode: barcode || undefined,
          name,
          description,
          category_id: categoryId || undefined,
          brand,
          unit_of_measure: unitOfMeasure,
          unit_purchase: unitPurchase,
          unit_conversion_ratio: unitConversion,
          cost_price: costPrice,
          avg_cost: costPrice,
          sale_price: salePrice,
          wholesale_price: wholesalePrice || undefined,
          iva_rate: ivaRate,
          min_stock: minStock,
          max_stock: maxStock,
          location,
          main_supplier_id: supplierId || undefined,
          is_active: true,
        },
        initialStock
      );
    }

    onClose();
  };

  const marginPct = salePrice > 0 ? (((salePrice - costPrice) / salePrice) * 100).toFixed(1) : '0.0';
  const profitUnit = (salePrice - costPrice).toFixed(2);

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? `Ficha Técnica: ${productToEdit.name}` : 'Registro de Nuevo Artículo en Catálogo'}
      subtitle={productToEdit ? `Código Interno: ${productToEdit.internal_code}` : 'Los saldos y existencias físicas se gestionan de forma inmutable mediante movimientos de Kardex'}
      maxWidth="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {productToEdit ? 'Guardar Modificación' : 'Registrar Artículo en Catálogo'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1 text-xs">
        {/* Sección 1: Identificación & Clasificación */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
            1. Identificación & Clasificación del Artículo
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Código Interno Único *"
              value={internalCode}
              onChange={(e) => setInternalCode(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Código de Barras (EAN-13)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  type="text"
                  placeholder="786..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pl-3 pr-22 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors shadow-xs"
                  title="Escanear con cámara del dispositivo"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Cámara</span>
                </button>
              </div>
            </div>

            <Input
              label="SKU Comercial"
              placeholder="Ej: BEB-COC-3L"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />

            <div className="sm:col-span-2">
              <Input
                label="Nombre Oficial del Producto *"
                placeholder="Ej: Aceite Vegetal La Favorita 1 Litro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría Oficial
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Sin categoría --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Marca"
                placeholder="Ej: Nestlé, Deja"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Unidad de Venta"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proveedor Principal
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Seleccionar --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.trade_name || s.business_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sección 2: Precios, Costos y Tributación */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              2. Esquema de Precios, Rentabilidad & IVA (SRI Ecuador)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Margen Estimado: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{marginPct}%</strong> (Ganancia: ${profitUnit}/ud)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Costo de Compra ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="input-field font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1">
                Precio Venta PVP ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="input-field font-mono font-bold text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Precio Mayorista ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tarifa IVA Ecuador
              </label>
              <select
                value={ivaRate}
                onChange={(e) => setIvaRate(parseFloat(e.target.value))}
                className="input-field"
              >
                <option value={15.0}>15% (Tarifa General)</option>
                <option value={0.0}>0% (Canasta Básica)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sección 3: Stock y Almacenamiento */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
            3. Control de Existencias & Ubicación en Almacén
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Stock Máximo
              </label>
              <input
                type="number"
                min="1"
                value={maxStock}
                onChange={(e) => setMaxStock(parseInt(e.target.value) || 100)}
                className="input-field font-mono"
              />
            </div>

            <Input
              label="Ubicación en Tienda"
              placeholder="Pasillo 2, Estante B"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            {!productToEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Stock Inicial en Kardex
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                  className="input-field font-mono font-bold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Motivo de auditoría al editar */}
        {productToEdit && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Justificación de Auditoría para Modificación
            </label>
            <input
              type="text"
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              className="input-field"
              placeholder="Indique motivo del cambio de precio o datos..."
              required
            />
          </div>
        )}
      </form>
    </Modal>

    <BarcodeScannerModal
      isOpen={isScannerOpen}
      onClose={() => setIsScannerOpen(false)}
      title="Capturar Código de Barras — Ficha Técnica"
      continuous={false}
      onScan={(scanned) => {
        setBarcode(scanned);
        toast.success(`Código de barras ${scanned} asignado`);
      }}
    />
  </>
);
};
