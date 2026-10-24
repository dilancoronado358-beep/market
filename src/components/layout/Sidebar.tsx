import React from 'react';
import {
  LayoutDashboard,
  Truck,
  ShoppingCart,
  Boxes,
  Package,
  Users2,
  FileSpreadsheet,
  Receipt,
  Wallet,
  FileCheck2,
  FileCode2,
  BarChart3,
  Mail,
  Zap,
  ShieldCheck,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../types/auth';
import { clsx } from 'clsx';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  permission?: import('../../types/auth').PermissionKey;
  badge?: string | number;
  highlight?: boolean;
}

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  collapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { user, hasPermission, logout } = useAuth();

  const navGroups: { group: string; items: NavItem[] }[] = [
    {
      group: 'Operaciones Clave',
      items: [
        { id: 'dashboard', label: 'Dashboard Ejecutivo', icon: <LayoutDashboard className="w-5 h-5" />, permission: 'view_dashboard' },
        { id: 'visitas', label: 'Visitas Proveedores', icon: <Truck className="w-5 h-5" />, permission: 'manage_visits', highlight: true },
        { id: 'pos', label: 'Punto de Venta (POS)', icon: <ShoppingCart className="w-5 h-5" />, permission: 'pos_sales' },
        { id: 'inventario', label: 'Inventario & Kardex', icon: <Boxes className="w-5 h-5" />, permission: 'view_inventory' },
        { id: 'productos', label: 'Catálogo Productos', icon: <Package className="w-5 h-5" />, permission: 'view_products' },
      ],
    },
    {
      group: 'Gestión Comercial',
      items: [
        { id: 'proveedores', label: 'Proveedores', icon: <Truck className="w-5 h-5" />, permission: 'view_suppliers' },
        { id: 'compras', label: 'Órdenes de Compra', icon: <FileSpreadsheet className="w-5 h-5" />, permission: 'view_purchases' },
        { id: 'ventas', label: 'Historial de Ventas', icon: <Receipt className="w-5 h-5" />, permission: 'view_reports' },
        { id: 'clientes', label: 'Clientes', icon: <Users2 className="w-5 h-5" />, permission: 'view_customers' },
      ],
    },
    {
      group: 'Caja & Facturación',
      items: [
        { id: 'caja', label: 'Caja & Turnos', icon: <Wallet className="w-5 h-5" />, permission: 'view_cash' },
        { id: 'docs-internos', label: 'Documentos Internos', icon: <FileCheck2 className="w-5 h-5" />, permission: 'view_internal_docs' },
        { id: 'sri', label: 'Facturación SRI', icon: <FileCode2 className="w-5 h-5" />, permission: 'sri_invoicing' },
      ],
    },
    {
      group: 'Administración & Control',
      items: [
        { id: 'reportes', label: 'Reportes & Métricas', icon: <BarChart3 className="w-5 h-5" />, permission: 'view_reports' },
        { id: 'correos', label: 'Centro de Correos', icon: <Mail className="w-5 h-5" />, permission: 'email_center' },
        { id: 'automatizaciones', label: 'Automatizaciones', icon: <Zap className="w-5 h-5" />, permission: 'automations' },
        { id: 'auditoria', label: 'Bitácora de Auditoría', icon: <ShieldCheck className="w-5 h-5" />, permission: 'access_audit_logs' },
        { id: 'usuarios', label: 'Usuarios & Permisos', icon: <UserCog className="w-5 h-5" />, permission: 'manage_users' },
        { id: 'configuracion', label: 'Configuración Tienda', icon: <Settings className="w-5 h-5" />, permission: 'system_settings' },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop para oscurecer y desenfocar el fondo en móviles */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-screen transition-transform lg:transition-all duration-300 bg-white dark:bg-navy-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl lg:shadow-none',
          isMobileOpen ? 'translate-x-0 w-80 max-w-[88vw]' : '-translate-x-full lg:translate-x-0',
          collapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        {/* Brand Header con soporte para Notch de iPhone */}
        <div className="min-h-16 pt-[env(safe-area-inset-top,0px)] flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png"
              alt="Logo"
              className={clsx(
                'object-contain rounded-xl shadow-sm shrink-0 bg-slate-900 p-0.5',
                collapsed ? 'mx-auto w-9 h-9' : 'w-9 h-9'
              )}
            />
            {(!collapsed || isMobileOpen) && (
              <div className="leading-tight truncate">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block truncate">
                  ERP / POS Ecuador
                </span>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                  Gestión Integral
                </p>
              </div>
            )}
          </div>

          {/* Botón cerrar en móvil */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Botón colapsar en desktop */}
          <button
            onClick={onToggleCollapse}
            className={clsx(
              'hidden lg:block p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
              collapsed && 'mx-auto'
            )}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        {navGroups.map((group, gIdx) => {
          // Filtrar items según permisos
          const visibleItems = group.items.filter((item) => !item.permission || hasPermission(item.permission));
          if (visibleItems.length === 0) return null;

          return (
            <div key={gIdx} className="space-y-1">
              {(!collapsed || isMobileOpen) && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  {group.group}
                </p>
              )}
              {visibleItems.map((item) => {
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    title={collapsed && !isMobileOpen ? item.label : undefined}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 relative group cursor-pointer',
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white',
                      collapsed && !isMobileOpen && 'justify-center px-0'
                    )}
                  >
                    <span className={clsx('shrink-0', isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200')}>
                      {item.icon}
                    </span>

                    {(!collapsed || isMobileOpen) && <span className="truncate">{item.label}</span>}

                    {item.highlight && (!collapsed || isMobileOpen) && (
                      <span className="ml-auto inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <Sparkles className="w-2.5 h-2.5" /> Clave
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Botón para instalar PWA en celular */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            window.dispatchEvent(new CustomEvent('open-pwa-install'));
          }}
          className={clsx(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
            'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm',
            collapsed && !isMobileOpen && 'justify-center px-0'
          )}
          title="Descargar e instalar aplicación en tu celular"
        >
          <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {(!collapsed || isMobileOpen) && (
            <span className="truncate text-[11px]">
              Descargar App Celular
            </span>
          )}
        </button>
      </div>

      {/* User profile compact footer */}
      {user && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-850/40 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user.full_name.slice(0, 2)}
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.full_name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              if (onCloseMobile) onCloseMobile();
              await logout();
            }}
            className={clsx(
              'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer',
              collapsed && !isMobileOpen && 'justify-center px-0'
            )}
            title="Cerrar Sesión del sistema"
          >
            <LogOut className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            {(!collapsed || isMobileOpen) && <span>Cerrar Sesión</span>}
          </button>
        </div>
      )}
    </aside>
    </>
  );
};
