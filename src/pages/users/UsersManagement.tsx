import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, UserRole } from '../../types/database';
import { ROLE_LABELS } from '../../types/auth';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { UserCog, Plus, ShieldCheck, UserX, UserCheck, KeyRound, Eye, EyeOff, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../lib/databaseState';

export const UsersManagement: React.FC = () => {
  const { profiles, deleteProfile } = useStore();
  const { user, hasPermission } = useAuth();

  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cajero');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('demo123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Nombre y correo son obligatorios');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSubmitting(true);
    const result = await db.createProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      role,
      phone: phone.trim(),
      password,
    });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error || 'Error al crear usuario.');
      return;
    }

    toast.success(`Usuario "${fullName}" creado exitosamente con rol ${ROLE_LABELS[role]}.`);
    setIsNewUserModalOpen(false);
    // Reset
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('demo123456');
  };

  const toggleUserStatus = async (targetUser: UserProfile) => {
    if (targetUser.id === user?.id) {
      toast.error('No puedes desactivar tu propia cuenta activa.');
      return;
    }

    const newStatus = !targetUser.is_active;
    await db.updateProfileStatus(targetUser.id, newStatus, {
      id: user?.id || 'usr-admin',
      name: user?.full_name || 'Administrador',
    });
    toast.success(`Cuenta de ${targetUser.full_name} ${newStatus ? 'activada' : 'desactivada'}.`);
  };

  const columns: Column<UserProfile>[] = [
    {
      key: 'full_name',
      header: 'Nombre Completo / Correo',
      sortable: true,
      render: (u) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-xs block">
            {u.full_name}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {u.email}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol Asignado',
      sortable: true,
      render: (u) => (
        <span className="font-semibold text-xs text-brand-600 dark:text-brand-400">
          {ROLE_LABELS[u.role] || u.role}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      sortable: true,
      render: (u) => (
        <Badge variant={u.is_active ? 'success' : 'danger'}>
          {u.is_active ? 'ACTIVO' : 'INACTIVO'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha Registro',
      sortable: true,
      render: (u) => (
        <span className="text-xs text-slate-500">
          {new Date(u.created_at).toLocaleDateString('es-EC')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (u) => {
        const isSelf = u.id === user?.id;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={u.is_active ? 'secondary' : 'primary'}
              icon={u.is_active ? <UserX className="w-3.5 h-3.5 text-amber-500" /> : <UserCheck className="w-3.5 h-3.5" />}
              onClick={() => toggleUserStatus(u)}
              disabled={isSelf}
              title={isSelf ? 'No puedes desactivar tu propia cuenta activa' : (u.is_active ? 'Desactivar cuenta' : 'Activar cuenta')}
            >
              {u.is_active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setUserToDelete(u)}
              disabled={isSelf}
              title={isSelf ? 'No puedes eliminar tu propia cuenta en sesión' : 'Eliminar usuario permanentemente'}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Usuarios, Roles & Permisos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administración de accesos con perfiles de seguridad: Administrador, Gerente, Supervisor, Cajero, Bodega, Compras y Auditor.
          </p>
        </div>

        {hasPermission('manage_users') && (
          <Button
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewUserModalOpen(true)}
          >
            Invitar / Crear Usuario
          </Button>
        )}
      </div>

      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800">
        <DataTable
          columns={columns}
          data={profiles}
          searchPlaceholder="Buscar por nombre, correo o rol..."
          searchableKeys={['full_name', 'email', 'role']}
          emptyMessage="No se encontraron usuarios registrados."
        />
      </div>

      {/* Modal Crear Usuario */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => setIsNewUserModalOpen(false)}
        title="Crear Nuevo Usuario"
        subtitle="Asigne el rol y credenciales de acceso institucional"
        maxWidth="2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsNewUserModalOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser} isLoading={isSubmitting}>
              Registrar Usuario
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-4 py-2 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo *"
              placeholder="Ej: Lic. Elena Zambrano"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Correo Electrónico Corporativo *"
              type="email"
              placeholder="usuario@erpposecuador.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Contraseña de Acceso Inicial *"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-7 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rol del Sistema *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="input-field"
              >
                <option value="administrador">Administrador General (Acceso Total)</option>
                <option value="gerente">Gerente Comercial</option>
                <option value="supervisor">Supervisor de Operaciones</option>
                <option value="cajero">Cajero / Punto de Venta</option>
                <option value="encargado_inventario">Encargado de Inventario / Bodega</option>
                <option value="responsable_compras">Responsable de Compras</option>
                <option value="auditor">Auditor y Control Interno</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Teléfono Celular"
                placeholder="099..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Esta cuenta se registrará sincronizada directamente en Supabase Auth y permitirá el acceso inmediato con su respectivo rol de seguridad.
              </p>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación de Eliminación Permanente de Usuario */}
      {userToDelete && (
        <Modal
          isOpen={!!userToDelete}
          onClose={() => !isDeleting && setUserToDelete(null)}
          title="Confirmar Eliminación Permanente de Usuario"
          maxWidth="sm"
        >
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
                <p className="font-bold text-sm">¿Estás seguro de eliminar este usuario?</p>
                <p>
                  El usuario <span className="font-bold">{userToDelete.full_name}</span> ({userToDelete.email}) será borrado permanentemente de la base de datos de Supabase.
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  Perderá inmediatamente el acceso a todos los módulos y funciones del sistema.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 className="w-4 h-4" />}
                isLoading={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteProfile(userToDelete.id);
                    setUserToDelete(null);
                  } catch (err) {
                    // El error ya es reportado por toast en StoreContext
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                Sí, Eliminar Usuario
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
