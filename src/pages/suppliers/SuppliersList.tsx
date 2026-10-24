import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Supplier } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { validateEcuadorianId } from '../../lib/sriUtils';
import {
  Truck,
  Plus,
  Building2,
  Calendar,
  AlertTriangle,
  History,
  FileText,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/databaseState';

export const SuppliersList: React.FC = () => {
  const { suppliers, visits, products, incidents, returns, replacements, createSupplier, deleteSupplier, refresh } = useStore();
  const { hasPermission } = useAuth();

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Formulario nuevo proveedor
  const [ruc, setRuc] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Quito');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(15);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruc.trim()) {
      toast.error('El número de RUC es obligatorio');
      return;
    }
    if (!businessName.trim()) {
      toast.error('La Razón Social es obligatoria');
      return;
    }

    const idValidation = validateEcuadorianId(ruc);
    if (!idValidation.isValid && idValidation.type !== 'consumidor_final') {
      toast.warning(`Aviso tributario: ${idValidation.message} (Se guardará con fines de gestión).`);
    }

    setIsSubmitting(true);
    try {
      // Guardar directamente en la base de datos de Supabase
      await createSupplier({
        ruc: ruc.trim(),
        business_name: businessName.trim(),
        trade_name: (tradeName || businessName).trim(),
        address: address.trim() || undefined,
        city: city.trim() || 'Quito',
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        payment_terms_days: paymentTerms || 15,
        lead_time_days: 2,
        is_active: true,
      });

      setIsNewSupplierModalOpen(false);
      // Reset
      setRuc('');
      setBusinessName('');
      setTradeName('');
      setAddress('');
      setPhone('');
      setEmail('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al registrar proveedor en Supabase');
    } finally {
      setIsSubmitting(false);
    }
  };


  const columns: Column<Supplier>[] = [
    {
      key: 'trade_name',
      header: 'Nombre Comercial / Razón Social',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-xs">
            {s.trade_name || s.business_name}
          </p>
          <p className="text-[11px] text-slate-400">{s.business_name}</p>
        </div>
      ),
    },
    {
      key: 'ruc',
      header: 'RUC (Ecuador)',
      sortable: true,
      render: (s) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
          {s.ruc}
        </span>
      ),
    },
    {
      key: 'contacts',
      header: 'Contacto / Ciudad',
      render: (s) => (
        <div className="text-xs text-slate-500">
          <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.city}</p>
          {s.phone && <p className="flex items-center gap-1 text-[11px]"><Phone className="w-3 h-3" /> {s.phone}</p>}
        </div>
      ),
    },
    {
      key: 'payment_terms_days',
      header: 'Plazo Pago',
      sortable: true,
      render: (s) => (
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {s.payment_terms_days} días
        </span>
      ),
    },
    {
      key: 'activity',
      header: 'Actividad Reciente',
      render: (s) => {
        const supVisits = visits.filter((v) => v.supplier_id === s.id);
        const supIncidents = incidents.filter((i) => i.supplier_id === s.id && i.status !== 'resuelto');
        return (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-300 font-medium">
              {supVisits.length} visitas
            </span>
            {supIncidents.length > 0 && (
              <Badge variant="danger">
                {supIncidents.length} daño(s)
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (s) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            icon={<History className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedSupplier(s);
              setIs360ModalOpen(true);
            }}
          >
            Historial
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setSupplierToDelete(s)}
            title="Eliminar proveedor de Supabase"
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  // KPIs de proveedores
  const totalSuppliersCount = suppliers.length;
  const suppliersWithVisitsCount = new Set(visits.map((v) => v.supplier_id)).size;
  const openIncidentsCount = incidents.filter((i) => i.status !== 'resuelto' && i.status !== 'cerrado_sin_compensacion').length;
  const pendingReplacementsCount = replacements.filter((r) => r.status === 'pendiente_entrega').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabecera Institucional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              GESTIÓN DE PROVEEDORES • ERP ECUADOR
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Directorio Oficial & Expedientes 360°</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Directorio de Proveedores
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ficha de proveedores, términos comerciales e historial consolidado de visitas, retiros e incidencias.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            variant="outline"
            icon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}
            onClick={handleManualSync}
            disabled={isSyncing}
            title="Recargar datos directamente desde Supabase en la nube"
          >
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>

          {hasPermission('manage_suppliers') && (
            <Button
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsNewSupplierModalOpen(true)}
            >
              Nuevo Proveedor
            </Button>
          )}
        </div>
      </div>

      {/* KPI Ribbon Superior */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Proveedores</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalSuppliersCount}</span>
          <span className="text-[10px] text-slate-400">Registrados en directorio</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Con Visitas Registradas</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{suppliersWithVisitsCount}</span>
          <span className="text-[10px] text-slate-400">Atendidos en tienda</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">Incidencias / Daños</span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 block font-mono">{openIncidentsCount}</span>
          <span className="text-[10px] text-slate-400">Novedades pendientes</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Reposiciones Pendientes</span>
          <span className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1 block font-mono">{pendingReplacementsCount}</span>
          <span className="text-[10px] text-slate-400">Compromisos de entrega</span>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <DataTable
          columns={columns}
          data={suppliers}
          searchPlaceholder="Buscar por nombre, RUC o ciudad..."
          searchableKeys={['business_name', 'trade_name', 'ruc', 'city']}
          emptyMessage="No se registran proveedores autorizados en el directorio comercial institucional. Utilice el botón superior para ingresar un nuevo proveedor."
        />
      </div>

      {/* Modal Historial 360° */}
      {selectedSupplier && (
        <Modal
          isOpen={is360ModalOpen}
          onClose={() => setIs360ModalOpen(false)}
          title={`Expediente 360°: ${selectedSupplier.trade_name || selectedSupplier.business_name}`}
          subtitle={`RUC: ${selectedSupplier.ruc} • ${selectedSupplier.address}, ${selectedSupplier.city}`}
          maxWidth="4xl"
        >
          <div className="space-y-6 py-2 text-xs">
            {/* Resumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Visitas Realizadas</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {visits.filter((v) => v.supplier_id === selectedSupplier.id).length}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Productos Suministrados</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {products.filter((p) => p.main_supplier_id === selectedSupplier.id).length}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Incidencias / Daños</span>
                <span className="text-lg font-bold text-rose-600">
                  {incidents.filter((i) => i.supplier_id === selectedSupplier.id).length}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Reposiciones Pendientes</span>
                <span className="text-lg font-bold text-blue-600">
                  {replacements.filter((r) => r.supplier_id === selectedSupplier.id && r.status === 'pendiente_entrega').length}
                </span>
              </div>
            </div>

            {/* Cronología de Visitas */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Cronología de Visitas de Este Proveedor
              </h4>
              <div className="space-y-2">
                {visits
                  .filter((v) => v.supplier_id === selectedSupplier.id)
                  .map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{v.visit_number}</span>
                        <p className="text-slate-500 text-[11px]">
                          Vendedor: {v.sales_rep_name} • Fecha: {new Date(v.check_in_time).toLocaleString('es-EC')}
                        </p>
                      </div>
                      <Badge variant={v.status === 'finalizada' ? 'success' : 'warning'}>
                        {v.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Nuevo Proveedor — Estructura Formal */}
      <Modal
        isOpen={isNewSupplierModalOpen}
        onClose={() => setIsNewSupplierModalOpen(false)}
        title="Ficha Oficial de Registro de Proveedor"
        subtitle="Ingreso de información jurídica y tributaria para compras, recepciones de mercadería y pagos"
        maxWidth="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewSupplierModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button form="form-new-supplier" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando en Supabase...' : 'Registrar Proveedor Autorizado'}
            </Button>
          </>
        }
      >
        <form id="form-new-supplier" onSubmit={handleCreateSupplier} className="space-y-4 py-1 text-xs">
          {/* Sección 1: Identificación Legal */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              1. Identificación Legal & Tributaria (SRI)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <Input
                label="Número de RUC (13 dígitos) *"
                placeholder="1790012345001"
                value={ruc}
                onChange={(e) => setRuc(e.target.value)}
                required
              />

              <Input
                label="Razón Social Oficial *"
                placeholder="Ej: DISTRIBUIDORA NACIONAL S.A."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />

              <div className="md:col-span-2">
                <Input
                  label="Nombre Comercial / Marca"
                  placeholder="Ej: DISTRINAC ECUADOR"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Domicilio & Contacto */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              2. Domicilio Operativo & Canales de Pedidos
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div>
                <Input
                  label="Ciudad Principal *"
                  placeholder="Ej: Quito, Guayaquil, Cuenca..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Teléfono de Contacto"
                  placeholder="Ej: 022999999 / 0998887777"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Correo para Envíos de OC"
                  type="email"
                  placeholder="pedidos@proveedor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Dirección de Bodega / Matriz Fiscal *"
                  placeholder="Av. 10 de Agosto N34-12 y Mariana de Jesús, Edif. Central"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmación de Eliminación */}
      {supplierToDelete && (
        <Modal
          isOpen={Boolean(supplierToDelete)}
          onClose={() => setSupplierToDelete(null)}
          title="Confirmar Eliminación de Proveedor"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSupplierToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={async () => {
                  try {
                    await deleteSupplier(supplierToDelete.id);
                    setSupplierToDelete(null);
                  } catch (err: any) {
                    toast.error(err.message || 'Error al eliminar proveedor');
                  }
                }}
              >
                Sí, Eliminar
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              ¿Estás seguro de que deseas eliminar permanentemente al proveedor{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                {supplierToDelete.trade_name || supplierToDelete.business_name}
              </strong>{' '}
              (RUC: {supplierToDelete.ruc})?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Esta acción eliminará el proveedor de Supabase y de la lista en pantalla de forma inmediata.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
