import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  Building2,
  ShoppingCart,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { ROLE_LABELS } from '../../types/auth';
import { UserRole } from '../../types/database';
import { clsx } from 'clsx';

interface HeaderProps {
  onOpenSearch: () => void;
  onNavigate: (route: string) => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onNavigate, onToggleMobileMenu }) => {
  const { user, logout, switchUserRole, allUsers } = useAuth();
  const { settings, notifications, markNotificationAsRead } = useStore();

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  // Alternar modo oscuro
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter((n) => !n.is_read);

  return (
    <header className="h-14 px-3 sm:px-6 bg-white dark:bg-[#0c1322] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-subtle">
      {/* Botón menú móvil + Local / Sucursal y Búsqueda */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Botón menú hamburguesa en móviles */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          title="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo y título compacto en móvil */}
        <div className="flex lg:hidden items-center gap-1.5 shrink-0">
          <img
            src="https://res.cloudinary.com/dtmqftcsr/image/upload/v1786329945/ChatGPT_Image_9_ago_2026_08_48_30_p.m._1_slrt42.png"
            alt="Logo"
            className="w-6 h-6 object-contain rounded bg-slate-900 p-0.5"
          />
          <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white sm:inline hidden">
            ERP / POS
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span className="font-semibold truncate max-w-[150px]">{settings.store_name} ({settings.establishment_code})</span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            SRI En Línea
          </span>
        </div>

        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 truncate"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="hidden sm:inline text-slate-500">Buscar producto, visita, venta...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Acciones Rápidas y Perfil */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Atajos de Acción Rápida */}
        <button
          onClick={() => onNavigate('pos')}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-subtle border border-slate-950 transition-colors"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Nueva Venta</span>
        </button>

        <button
          onClick={() => onNavigate('visitas')}
          className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-300 dark:border-slate-700 shadow-subtle transition-colors"
        >
          <Truck className="w-3.5 h-3.5 text-slate-500" />
          <span>Registrar Visita</span>
        </button>

        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifs.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-slide-up">
              <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Notificaciones del Sistema
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  {unreadNotifs.length} nuevas
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifications.length > 0 ? (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.link_url) {
                          onNavigate(n.link_url.replace('/', ''));
                          setIsNotifOpen(false);
                        }
                      }}
                      className={clsx(
                        'p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors',
                        !n.is_read && 'bg-brand-50/30 dark:bg-brand-950/20'
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'warning' || n.type === 'danger' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No hay notificaciones activas.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Toggle Dark Mode */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Selector Rápido de Rol (Simulación y Auditoría de Permisos) */}
        <div className="relative" ref={roleRef}>
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-subtle"
            title="Cambiar rol activo"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">{user?.role ? ROLE_LABELS[user.role] : 'Rol'}</span>
          </button>

          {isRoleMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-lg bg-white dark:bg-slate-900 shadow-modal border border-slate-200 dark:border-slate-800 py-2 z-50 animate-slide-up">
              <div className="px-3 pb-2 mb-1 border-b border-slate-100 dark:border-slate-850">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Simulación de Rol Activo
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Evaluar permisos y vistas del sistema:
                </p>
              </div>

              {(['administrador', 'gerente', 'supervisor', 'cajero', 'encargado_inventario', 'responsable_compras', 'auditor'] as UserRole[]).map((r) => {
                const isActive = user?.role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      switchUserRole(r);
                      setIsRoleMenuOpen(false);
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
                      isActive ? 'text-brand-600 dark:text-brand-400 font-bold bg-brand-50/50 dark:bg-brand-950/30' : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span>{ROLE_LABELS[r]}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 dark:bg-brand-400" />}
                  </button>
                );
              })}

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-3">
                <button
                  onClick={() => {
                    logout();
                    setIsRoleMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
