import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Wallet,
  Menu,
} from 'lucide-react';
import { clsx } from 'clsx';

interface MobileBottomNavProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRoute,
  onNavigate,
  onOpenMobileMenu,
  isMobileMenuOpen,
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'pos', label: 'Venta', icon: ShoppingCart },
    { id: 'productos', label: 'Catálogo', icon: Boxes },
    { id: 'caja', label: 'Caja', icon: Wallet },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      aria-label="Navegación móvil"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentRoute === tab.id && !isMobileMenuOpen;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onNavigate(tab.id)}
              className={clsx(
                'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 min-w-[56px] min-h-[48px] active:scale-95',
                isActive
                  ? 'text-slate-950 dark:text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              <div
                className={clsx(
                  'p-1 rounded-lg transition-colors',
                  isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs' : ''
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Botón de Menú con Más Opciones */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className={clsx(
            'flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150 min-w-[56px] min-h-[48px] active:scale-95',
            isMobileMenuOpen
              ? 'text-brand-600 dark:text-brand-400 font-bold'
              : 'text-slate-600 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200'
          )}
          title="Ver más opciones y menú completo"
        >
          <div
            className={clsx(
              'p-1 rounded-lg transition-colors',
              isMobileMenuOpen
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            )}
          >
            <Menu className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Más</span>
        </button>
      </div>
    </nav>
  );
};
