import React, { useState, useEffect } from 'react';
import { Search, X, Package, Truck, ShoppingCart, Users2, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const { products, suppliers, visits, sales, customers } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredProducts = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.internal_code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.includes(q))
      ).slice(0, 4)
    : [];

  const filteredSuppliers = q
    ? suppliers.filter(
        (s) =>
          s.business_name.toLowerCase().includes(q) ||
          (s.trade_name && s.trade_name.toLowerCase().includes(q)) ||
          s.ruc.includes(q)
      ).slice(0, 3)
    : [];

  const filteredVisits = q
    ? visits.filter(
        (v) =>
          v.visit_number.toLowerCase().includes(q) ||
          v.sales_rep_name.toLowerCase().includes(q) ||
          (v.invoice_or_doc_ref && v.invoice_or_doc_ref.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  const filteredCustomers = q
    ? customers.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.identification_number.includes(q)
      ).slice(0, 3)
    : [];

  const handleSelect = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-4 pt-20">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
          {/* Input Header */}
          <div className="relative border-b border-slate-200 dark:border-slate-800 flex items-center px-4">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe para buscar productos, visitas, proveedores, ventas..."
              className="w-full px-3 py-4 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results list */}
          <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
            {q ? (
              <>
                {/* Productos */}
                {filteredProducts.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-2">
                      Productos ({filteredProducts.length})
                    </p>
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect('productos')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                            <p className="text-slate-400 text-[11px] font-mono">
                              {p.internal_code} • {p.barcode || 'Sin barra'} • Stock: {p.current_stock}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${p.sale_price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Proveedores */}
                {filteredSuppliers.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-2">
                      Proveedores ({filteredSuppliers.length})
                    </p>
                    {filteredSuppliers.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => handleSelect('proveedores')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {s.trade_name || s.business_name}
                            </p>
                            <p className="text-slate-400 text-[11px]">RUC: {s.ruc}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Visitas */}
                {filteredVisits.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-2">
                      Visitas de Proveedores ({filteredVisits.length})
                    </p>
                    {filteredVisits.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelect('visitas')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {v.visit_number} — {v.sales_rep_name}
                            </p>
                            <p className="text-slate-400 text-[11px]">{v.reason}</p>
                          </div>
                        </div>
                        <span className="font-medium text-brand-600">{v.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clientes */}
                {filteredCustomers.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] px-2">
                      Clientes ({filteredCustomers.length})
                    </p>
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelect('clientes')}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                            <Users2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{c.full_name}</p>
                            <p className="text-slate-400 text-[11px]">ID: {c.identification_number}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {filteredProducts.length === 0 &&
                  filteredSuppliers.length === 0 &&
                  filteredVisits.length === 0 &&
                  filteredCustomers.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      No se encontraron resultados para &ldquo;{query}&rdquo;.
                    </div>
                  )}
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 space-y-1">
                <p className="font-medium">Acceso rápido a cualquier sección</p>
                <p className="text-[11px]">Busca por nombre de producto, SKU, RUC, o número de visita.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
