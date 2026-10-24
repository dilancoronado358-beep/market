import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Customer, Sale } from '../../types/database';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { generatePosReceiptPdf } from '../../lib/pdfGenerator';
import {
  ShoppingCart,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Building,
  User,
  Printer,
  CheckCircle,
  AlertCircle,
  Receipt,
  UserPlus,
  Camera,
} from 'lucide-react';
import { BarcodeScannerModal } from '../../components/common/BarcodeScannerModal';
import { clsx } from 'clsx';
import { toast } from 'sonner';

interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number;
}

export const PointOfSale: React.FC = () => {
  const { products, customers, cashSessions, processSale, createCustomer } = useStore();
  const { user, hasPermission } = useAuth();

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-cf');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'mixto'>('efectivo');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'ticket'>('catalog');

  // Modal de venta exitosa / impresión de ticket
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Modal de nuevo cliente rápido
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustType, setNewCustType] = useState<'cedula' | 'ruc'>('cedula');
  const [newCustId, setNewCustId] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const handleCreateQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newCustId.trim();
    const cleanName = newCustName.trim().toUpperCase();

    if (!cleanId) {
      toast.error('Ingrese el número de Cédula o RUC del cliente');
      return;
    }
    if (!cleanName) {
      toast.error('Ingrese los nombres o razón social del cliente');
      return;
    }

    if (newCustType === 'cedula' && cleanId.length !== 10) {
      toast.error('La cédula ecuatoriana debe tener 10 dígitos numéricos');
      return;
    }
    if (newCustType === 'ruc' && cleanId.length !== 13) {
      toast.error('El RUC ecuatoriano debe tener 13 dígitos numéricos');
      return;
    }

    try {
      setIsSavingCustomer(true);
      const created = await createCustomer({
        identification_type: newCustType,
        identification_number: cleanId,
        full_name: cleanName,
        email: newCustEmail.trim() || undefined,
        phone: newCustPhone.trim() || undefined,
        address: newCustAddress.trim() || 'Ecuador',
      });

      toast.success(`Cliente ${cleanName} registrado y seleccionado`);
      if (created && created.id) {
        setSelectedCustomerId(created.id);
      }
      // Limpiar formulario y cerrar modal
      setNewCustId('');
      setNewCustName('');
      setNewCustEmail('');
      setNewCustPhone('');
      setNewCustAddress('');
      setIsNewCustomerModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar nuevo cliente');
    } finally {
      setIsSavingCustomer(false);
    }
  };

  // Encontrar sesión de caja activa del cajero
  const activeSession = cashSessions.find((s) => s.status === 'abierta');

  // Cálculo de totales
  let subtotal0 = 0;
  let subtotalIva = 0;
  let ivaAmount = 0;
  let discountTotal = 0;

  cart.forEach((item) => {
    const rawTotal = item.product.sale_price * item.quantity;
    const discount = Number((rawTotal * (item.discountPercent / 100)).toFixed(2));
    const net = rawTotal - discount;
    discountTotal += discount;

    if (item.product.iva_rate > 0) {
      subtotalIva += net;
      ivaAmount += Number((net * (item.product.iva_rate / 100)).toFixed(2));
    } else {
      subtotal0 += net;
    }
  });

  const grandTotal = Number((subtotal0 + subtotalIva + ivaAmount).toFixed(2));
  const changeGiven = paymentMethod === 'efectivo' ? Math.max(0, Number((amountPaid - grandTotal).toFixed(2))) : 0;

  // Agregar al carrito por código de barras o búsqueda (admite cámara)
  const handleBarcodeSubmit = (e?: React.FormEvent, customBarcode?: string) => {
    if (e) e.preventDefault();
    const query = (customBarcode !== undefined ? customBarcode : barcodeQuery).trim();
    if (!query) return;

    const found = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) ||
        p.internal_code.toLowerCase() === query.toLowerCase()
    );

    if (found) {
      addToCart(found);
      setBarcodeQuery('');
    } else {
      toast.error(`Producto con código "${query}" no encontrado en catálogo.`);
    }
  };

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      toast.error(`"${product.name}" está agotado en inventario.`);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx !== -1) {
        if (prev[idx].quantity + 1 > product.current_stock) {
          toast.error(`Stock máximo disponible alcanzado (${product.current_stock} unidades).`);
          return prev;
        }
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { product, quantity: 1, discountPercent: 0 }];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > prod.current_stock) {
      toast.error(`Solo hay ${prod.current_stock} unidades disponibles.`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleApplyDiscount = (productId: string, percent: number) => {
    if (percent > 5 && !hasPermission('apply_discounts')) {
      toast.error('Descuentos mayores al 5% requieren autorización de supervisor.');
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, discountPercent: Math.min(100, Math.max(0, percent)) } : item
      )
    );
  };

  // Procesar Cobro
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito de compras está vacío');
      return;
    }

    if (paymentMethod === 'efectivo' && amountPaid < grandTotal) {
      toast.error(`El monto pagado ($${amountPaid.toFixed(2)}) es insuficiente para cubrir $${grandTotal.toFixed(2)}`);
      return;
    }

    try {
      const sale = await processSale({
        customerId: selectedCustomerId,
        sessionId: activeSession?.id,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          discountPercent: i.discountPercent,
        })),
        paymentMethod,
        amountPaid: paymentMethod === 'efectivo' ? amountPaid : grandTotal,
        notes: saleNotes || undefined,
      });

      setCompletedSale(sale);
      setIsSuccessModalOpen(true);
      // Limpiar carrito
      setCart([]);
      setAmountPaid(0);
      setSaleNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta');
    }
  };

  const handlePrintTicket = () => {
    if (!completedSale) return;
    const saleItems = completedSale.items || [];
    const doc = generatePosReceiptPdf(completedSale, saleItems);
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  };

  // Filtrado de productos para el catálogo visual rápido
  const searchedProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const term = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.internal_code.toLowerCase().includes(term) ||
      (p.barcode && p.barcode.includes(term))
    );
  });

  const totalCartItems = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:h-[calc(100vh-6.5rem)] animate-fade-in pb-16 lg:pb-0">
      {/* Pestañas de Navegación en Pantallas Móviles */}
      <div className="flex lg:hidden items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={clsx(
            'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
            mobileTab === 'catalog'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Catálogo & Escáner</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('ticket')}
          className={clsx(
            'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5',
            mobileTab === 'ticket'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          )}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Ticket ({totalCartItems})</span>
          {grandTotal > 0 && (
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold ml-1">
              ${grandTotal.toFixed(2)}
            </span>
          )}
        </button>
      </div>

      {/* Columna Izquierda: Búsqueda rápida y catálogo en grilla */}
      <div className={clsx(
        "flex-1 flex flex-col gap-4 overflow-hidden",
        mobileTab === 'ticket' ? 'hidden lg:flex' : 'flex'
      )}>
        {/* Barra de escáner y búsqueda */}
        <div className="glass-card p-3 sm:p-4 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
          <form onSubmit={handleBarcodeSubmit} className="relative w-full sm:w-80">
            <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              placeholder="Escanear código de barras..."
              className="w-full pl-9 pr-22 py-2.5 text-xs font-mono rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors shadow-xs"
              title="Escanear con cámara del dispositivo"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cámara</span>
            </button>
          </form>

          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar por nombre, código interno o categoría..."
              className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Grilla visual de productos */}
        <div className="flex-1 overflow-y-auto p-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {searchedProducts.map((p) => {
            const isOutOfStock = p.current_stock <= 0;
            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`glass-card p-3 flex flex-col justify-between rounded-xl border transition-all duration-150 select-none ${
                  isOutOfStock
                    ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : 'cursor-pointer hover:border-brand-500 hover:shadow-md active:scale-95 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold truncate">
                      {p.internal_code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isOutOfStock ? 'text-rose-500 bg-rose-50' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {p.current_stock} disp.
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">
                    {p.name}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    ${p.sale_price.toFixed(2)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">
                    IVA {p.iva_rate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Columna Derecha: Carrito de Venta y Cobro */}
      <div className={clsx(
        "w-full lg:w-96 glass-card p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between rounded-2xl shadow-lg",
        mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
      )}>
        {/* Botón volver a catálogo en móvil */}
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className="lg:hidden text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-2 flex items-center gap-1"
        >
          <span>← Continuar seleccionando productos</span>
        </button>

        {/* Header Carrito & Selección de Cliente */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand-600" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Ticket de Venta
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>

          {/* Selector de Cliente */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Cliente</span>
              </label>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Nuevo
              </button>
            </div>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="input-field py-2 text-xs"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.identification_number})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Items en Carrito */}
        <div className="flex-1 overflow-y-auto my-3 divide-y divide-slate-100 dark:divide-slate-800/80 pr-1 max-h-56">
          {cart.map((item) => (
            <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {item.product.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  ${item.product.sale_price.toFixed(2)} c/u • Total: ${(item.product.sale_price * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Botones de Cantidad */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold font-mono px-1 min-w-6 text-center text-slate-900 dark:text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-8 h-8 opacity-30 mb-2" />
              <p className="text-xs">Escanee un código de barras o haga clic en un producto.</p>
            </div>
          )}
        </div>

        {/* Totales y Métodos de Cobro */}
        <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Desglose tributario */}
          <div className="space-y-1 text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal 0% IVA:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">${subtotal0.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal 15% IVA:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">${subtotalIva.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA (15%):</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">${ivaAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>TOTAL:</span>
            <span className="font-mono text-xl text-slate-900 dark:text-white font-extrabold">
              ${grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Método de Pago */}
          <div className="grid grid-cols-3 gap-1 pt-1">
            {[
              { id: 'efectivo', label: 'Efectivo', icon: <DollarSign className="w-3.5 h-3.5" /> },
              { id: 'tarjeta', label: 'Tarjeta', icon: <CreditCard className="w-3.5 h-3.5" /> },
              { id: 'transferencia', label: 'Transf.', icon: <Building className="w-3.5 h-3.5" /> },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id as any)}
                className={`py-2 px-1 rounded-md border flex flex-col items-center gap-1 font-semibold text-[11px] transition-colors ${
                  paymentMethod === m.id
                    ? 'border-slate-900 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Cálculo de Cambio si es Efectivo */}
          {paymentMethod === 'efectivo' && (
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Paga con ($):</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  placeholder="20.00"
                  className="w-24 px-2 py-1 text-right font-mono font-bold text-xs rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Cambio a entregar:</span>
                <span className="font-mono text-sm text-slate-900 dark:text-white font-extrabold">
                  ${changeGiven.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Botón Principal de Cobro */}
          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            size="lg"
            className="w-full text-xs font-bold uppercase tracking-wider py-3"
          >
            Cobrar ${grandTotal.toFixed(2)}
          </Button>
        </div>
      </div>

      {/* Modal de Venta Exitosa */}
      {completedSale && (
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Venta Procesada Exitosamente"
          subtitle={`Ticket N°: ${completedSale.internal_doc_number || completedSale.sale_number}`}
          maxWidth="md"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsSuccessModalOpen(false)}>
                Nueva Venta
              </Button>
              <Button onClick={handlePrintTicket} icon={<Printer className="w-4 h-4" />}>
                Imprimir Ticket
              </Button>
            </>
          }
        >
          <div className="py-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>

            <h4 className="text-xl font-bold text-slate-900 dark:text-white font-mono">
              ${completedSale.total_amount.toFixed(2)}
            </h4>

            <p className="text-xs text-slate-500">
              Método: <span className="font-bold capitalize">{completedSale.payment_method}</span>
              {completedSale.payment_method === 'efectivo' && (
                <> • Cambio entregado: <span className="font-bold text-emerald-600">${completedSale.change_given.toFixed(2)}</span></>
              )}
            </p>

            <p className="text-[11px] text-slate-400">
              El inventario ha sido actualizado en tiempo real en el Kardex y asignado a la sesión de caja abierta.
            </p>
          </div>
        </Modal>
      )}

      {/* Modal de Registro Rápido de Cliente */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Registrar Nuevo Cliente en POS"
      >
        <form onSubmit={handleCreateQuickCustomer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Identificación *
              </label>
              <select
                value={newCustType}
                onChange={(e) => setNewCustType(e.target.value as 'cedula' | 'ruc')}
                className="input-field"
              >
                <option value="cedula">Cédula de Identidad (10 dígitos)</option>
                <option value="ruc">RUC Comercial (13 dígitos)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Número de {newCustType === 'cedula' ? 'Cédula' : 'RUC'} *
              </label>
              <input
                type="text"
                autoFocus
                maxLength={newCustType === 'cedula' ? 10 : 13}
                placeholder={newCustType === 'cedula' ? 'Ej: 1723456789' : 'Ej: 1723456789001'}
                value={newCustId}
                onChange={(e) => setNewCustId(e.target.value.replace(/\D/g, ''))}
                className="input-field font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nombre Completo / Razón Social *
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Carlos Pérez o Corporación La Favorita C.A."
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="input-field uppercase"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Teléfono / Celular
              </label>
              <input
                type="tel"
                placeholder="Ej: 0991234567"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico (Para Factura SRI)
              </label>
              <input
                type="email"
                placeholder="cliente@ejemplo.com"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Dirección Domiciliaria / Comercial
            </label>
            <input
              type="text"
              placeholder="Ej: Av. Amazonas y República, Quito"
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsNewCustomerModalOpen(false)}
              disabled={isSavingCustomer}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSavingCustomer}>
              {isSavingCustomer ? 'Guardando en Supabase...' : 'Guardar y Asignar al Ticket'}
            </Button>
          </div>
        </form>
      </Modal>
      {/* Barra flotante inferior en móvil cuando se está en catálogo y hay items */}
      {mobileTab === 'catalog' && totalCartItems > 0 && (
        <div className="fixed bottom-3 inset-x-3 z-30 lg:hidden animate-slide-up">
          <button
            type="button"
            onClick={() => setMobileTab('ticket')}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 text-white dark:bg-brand-600 shadow-2xl flex items-center justify-between font-bold text-xs active:scale-98 transition-transform border border-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-extrabold">
                {totalCartItems}
              </span>
              <span>Revisar Ticket & Cobro</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-sm font-extrabold text-emerald-400">
              <span>${grandTotal.toFixed(2)}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      {/* Escáner de código de barras por cámara */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Escáner POS — Cámara del Dispositivo"
        continuous={true}
        onScan={(code) => {
          handleBarcodeSubmit(undefined, code);
        }}
      />
    </div>
  );
};
