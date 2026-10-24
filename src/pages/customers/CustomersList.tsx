import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types/database';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { validateEcuadorianId } from '../../lib/sriUtils';
import { Users2, Plus, Phone, Mail, MapPin, DollarSign, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/databaseState';

export const CustomersList: React.FC = () => {
  const { customers, createCustomer, deleteCustomer, refresh } = useStore();

  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isNewCustModalOpen, setIsNewCustModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [idType, setIdType] = useState<'cedula' | 'ruc' | 'pasaporte' | 'consumidor_final'>('cedula');
  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      toast.error('El número de identificación es obligatorio');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Los nombres / razón social son obligatorios');
      return;
    }

    if (idType === 'cedula' || idType === 'ruc') {
      const val = validateEcuadorianId(idNumber);
      if (!val.isValid && val.type !== 'consumidor_final') {
        toast.warning(`Aviso tributario: ${val.message} (Se guardará para control comercial).`);
      }
    }

    setIsSubmitting(true);
    try {
      await createCustomer({
        identification_type: idType,
        identification_number: idNumber.trim(),
        full_name: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        is_active: true,
      });

      setIsNewCustModalOpen(false);
      // Reset
      setIdNumber('');
      setFullName('');
      setEmail('');
      setPhone('');
      setAddress('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar cliente en Supabase');
    } finally {
      setIsSubmitting(false);
    }
  };


  const columns: Column<Customer>[] = [
    {
      key: 'full_name',
      header: 'Cliente / Razón Social',
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-xs">{c.full_name}</p>
          <p className="text-[10px] text-slate-400 capitalize">Tipo: {c.identification_type.replace('_', ' ')}</p>
        </div>
      ),
    },
    {
      key: 'identification_number',
      header: 'N° Identificación',
      sortable: true,
      render: (c) => (
        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-100">
          {c.identification_number}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contacto',
      render: (c) => (
        <div className="text-xs text-slate-500">
          {c.email && <p className="flex items-center gap-1 text-[11px]"><Mail className="w-3 h-3" /> {c.email}</p>}
          {c.phone && <p className="flex items-center gap-1 text-[11px]"><Phone className="w-3 h-3" /> {c.phone}</p>}
        </div>
      ),
    },
    {
      key: 'total_purchases_count',
      header: 'Compras Realizadas',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
          {c.total_purchases_count} compras
        </span>
      ),
    },
    {
      key: 'total_spent',
      header: 'Total Facturado',
      sortable: true,
      render: (c) => (
        <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
          ${c.total_spent.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (c) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => setCustomerToDelete(c)}
            title="Eliminar cliente"
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  // Métricas institucionales
  const totalCustomers = customers.length;
  const rucCustomers = customers.filter((c) => c.identification_type === 'ruc').length;
  const totalPurchases = customers.reduce((acc, c) => acc + c.total_purchases_count, 0);
  const totalSpentAll = customers.reduce((acc, c) => acc + c.total_spent, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              DIRECTORIO COMERCIAL • SRI ECUADOR
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-slate-500 font-medium">Validación Oficial Cédula / RUC</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Padrón de Clientes Registrados
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administración centralizada de compradores con validación de algoritmo módulo 10 y 11 del SRI.
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

          <Button
            onClick={() => setIsNewCustModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            size="md"
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Clientes</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalCustomers}</span>
          <span className="text-[10px] text-slate-400">En base de datos</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Contribuyentes RUC</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{rucCustomers}</span>
          <span className="text-[10px] text-slate-400">Empresas con RUC 13 dígitos</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Transacciones Emitidas</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">{totalPurchases}</span>
          <span className="text-[10px] text-slate-400">Tickets y facturas</span>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Volumen Facturado</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block font-mono">${totalSpentAll.toFixed(2)}</span>
          <span className="text-[10px] text-slate-400">Total histórico en tienda</span>
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-subtle">
        <DataTable
          columns={columns}
          data={customers}
          searchPlaceholder="Buscar por nombre o número de cédula/RUC..."
          searchableKeys={['full_name', 'identification_number', 'email', 'phone']}
          emptyMessage="No se registran clientes en la base de datos institucional. Utilice el botón superior para ingresar un registro."
        />
      </div>

      {/* Modal Nuevo Cliente */}
      <Modal
        isOpen={isNewCustModalOpen}
        onClose={() => setIsNewCustModalOpen(false)}
        title="Ficha de Registro: Nuevo Cliente"
        subtitle="Validación de algoritmo tributario ecuatoriano del SRI para comprobantes electrónicos"
        maxWidth="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewCustModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button form="form-new-customer" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando en Supabase...' : 'Guardar Cliente'}
            </Button>
          </>
        }
      >
        <form id="form-new-customer" onSubmit={handleCreateCustomer} className="space-y-4 py-1 text-xs">
          {/* Sección 1: Identificación Legal */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              1. Identificación Legal & Tributaria
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Identificación *
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="cedula">Cédula de Identidad (10 dígitos)</option>
                  <option value="ruc">RUC Persona Natural / Jurídica (13 dígitos)</option>
                  <option value="pasaporte">Pasaporte Internacional</option>
                  <option value="consumidor_final">Consumidor Final</option>
                </select>
              </div>

              <Input
                label="Número de Identificación *"
                placeholder="Ej: 1713334445"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                required
              />

              <div className="md:col-span-2">
                <Input
                  label="Razón Social o Nombres Completos *"
                  placeholder="Ej: CORPORACIÓN COMERCIAL ANDINA S.A."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Domicilio & Contacto */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              2. Domicilio Comercial & Contacto
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Correo Electrónico para Facturación"
                type="email"
                placeholder="facturas@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Teléfono Celular / Contacto"
                placeholder="099..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div className="md:col-span-2">
                <Input
                  label="Dirección Fiscal o Domiciliaria"
                  placeholder="Av. Amazonas y Naciones Unidas, Quito"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmación de Eliminación de Cliente */}
      {customerToDelete && (
        <Modal
          isOpen={Boolean(customerToDelete)}
          onClose={() => setCustomerToDelete(null)}
          title="Confirmar Eliminación de Cliente"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setCustomerToDelete(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={async () => {
                  try {
                    await deleteCustomer(customerToDelete.id);
                    setCustomerToDelete(null);
                  } catch (err: any) {
                    toast.error(err.message || 'Error al eliminar cliente');
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
              ¿Estás seguro de que deseas eliminar permanentemente al cliente{' '}
              <strong className="text-rose-600 dark:text-rose-400">
                {customerToDelete.full_name}
              </strong>{' '}
              ({customerToDelete.identification_type.toUpperCase()}: {customerToDelete.identification_number})?
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Esta acción eliminará al cliente de Supabase y de la lista en pantalla de forma inmediata.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
