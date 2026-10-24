import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { VisitsList } from './pages/visits/VisitsList';
import { PointOfSale } from './pages/pos/PointOfSale';
import { KardexView } from './pages/inventory/KardexView';
import { ProductsList } from './pages/products/ProductsList';
import { SuppliersList } from './pages/suppliers/SuppliersList';
import { PurchaseOrdersList } from './pages/purchases/PurchaseOrdersList';
import { SalesHistory } from './pages/sales/SalesHistory';
import { CustomersList } from './pages/customers/CustomersList';
import { CashRegister } from './pages/cash/CashRegister';
import { InternalDocsList } from './pages/internal-docs/InternalDocsList';
import { SriInvoicing } from './pages/sri/SriInvoicing';
import { ReportsView } from './pages/reports/ReportsView';
import { EmailCenter } from './pages/emails/EmailCenter';
import { AutomationsList } from './pages/automations/AutomationsList';
import { AuditTrail } from './pages/audit/AuditTrail';
import { UsersManagement } from './pages/users/UsersManagement';
import { SystemSettings } from './pages/settings/SystemSettings';
import { PermissionKey } from './types/auth';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { Toaster } from 'sonner';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  permission?: PermissionKey;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, children }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Cargando entorno seguro de ERP / POS Ecuador...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <LayoutWrapper>
        <div className="glass-card p-12 text-center max-w-lg mx-auto space-y-4 my-12 border border-rose-200 dark:border-rose-900/50">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Acceso Restringido por Nivel de Rol
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Su perfil actual no dispone del permiso <code>{permission}</code> para operar este módulo. Si requiere acceso, contacte con el Administrador General o cambie de rol en el selector superior.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary text-xs"
          >
            Volver al Dashboard
          </button>
        </div>
      </LayoutWrapper>
    );
  }

  return <LayoutWrapper>{children}</LayoutWrapper>;
};

const LayoutWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRoute = location.pathname.replace(/^\//, '') || 'dashboard';

  return (
    <AppShell currentRoute={currentRoute} onNavigate={(route) => navigate('/' + route)}>
      {children}
    </AppShell>
  );
};

const LoginRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Cargando entorno seguro...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Login />;
};

function AppRoutes() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute permission="view_dashboard">
            <Dashboard onNavigate={(route) => navigate('/' + route)} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/visitas"
        element={
          <ProtectedRoute permission="manage_visits">
            <VisitsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/pos"
        element={
          <ProtectedRoute permission="pos_sales">
            <PointOfSale />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventario"
        element={
          <ProtectedRoute permission="view_inventory">
            <KardexView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/productos"
        element={
          <ProtectedRoute permission="view_products">
            <ProductsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/proveedores"
        element={
          <ProtectedRoute permission="view_suppliers">
            <SuppliersList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/compras"
        element={
          <ProtectedRoute permission="view_purchases">
            <PurchaseOrdersList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/ventas"
        element={
          <ProtectedRoute permission="view_reports">
            <SalesHistory />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clientes"
        element={
          <ProtectedRoute permission="view_customers">
            <CustomersList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/caja"
        element={
          <ProtectedRoute permission="view_cash">
            <CashRegister />
          </ProtectedRoute>
        }
      />

      <Route
        path="/docs-internos"
        element={
          <ProtectedRoute permission="view_internal_docs">
            <InternalDocsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sri"
        element={
          <ProtectedRoute permission="sri_invoicing">
            <SriInvoicing />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reportes"
        element={
          <ProtectedRoute permission="view_reports">
            <ReportsView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/correos"
        element={
          <ProtectedRoute permission="email_center">
            <EmailCenter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/automatizaciones"
        element={
          <ProtectedRoute permission="automations">
            <AutomationsList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/auditoria"
        element={
          <ProtectedRoute permission="access_audit_logs">
            <AuditTrail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute permission="manage_users">
            <UsersManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracion"
        element={
          <ProtectedRoute permission="system_settings">
            <SystemSettings />
          </ProtectedRoute>
        }
      />

      {/* Fallback de ruta no encontrada */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <AppRoutes />
          <PwaInstallPrompt />
          <Toaster position="top-right" richColors />
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
