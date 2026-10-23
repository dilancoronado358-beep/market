// ==============================================================================
// CONTEXTO DE AUTENTICACIÓN Y CONTROL DE ACCESO BASADO EN ROLES (RBAC)
// ==============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/database';
import { PermissionKey, ROLE_DEFAULT_PERMISSIONS } from '../types/auth';
import { db } from '../lib/databaseState';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  switchUserRole: (role: UserRole) => void;
  hasPermission: (permission: PermissionKey) => boolean;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_STORAGE_KEY = 'erp_pos_ecuador_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Cargar usuarios y sesión persistida
  useEffect(() => {
    const checkSession = async () => {
      try {
        localStorage.removeItem('tienda_katy_auth_user');
      } catch {}
      setIsLoading(true);
      const snapshot = db.getSnapshot();
      setAllUsers(snapshot.profiles);

      if (isSupabaseConfigured && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          let profile = snapshot.profiles.find((p) => p.email.toLowerCase() === session.user.email?.toLowerCase());
          if (!profile) {
            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', session.user.email?.toLowerCase())
              .maybeSingle();
            if (dbProfile) {
              profile = dbProfile;
              snapshot.profiles.push(dbProfile);
              db.persistState();
            }
          }
          if (profile && profile.is_active) {
            setUser(profile);
            setIsLoading(false);
            return;
          }
        }
      }

      // Si no hay Supabase o no hay sesión en Supabase, verificar sesión local guardada
      const savedUserStr = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          const currentProfile = snapshot.profiles.find((p) => p.id === savedUser.id);
          if (currentProfile && currentProfile.is_active) {
            setUser(currentProfile);
          } else {
            localStorage.removeItem(AUTH_USER_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        }
      }

      setIsLoading(false);
    };

    checkSession();

    // Suscribirse a cambios en la base de datos
    const unsubscribe = db.subscribe(() => {
      setAllUsers([...db.getSnapshot().profiles]);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!error && data?.user) {
          let profile = db.getSnapshot().profiles.find((p) => p.email.toLowerCase() === cleanEmail);
          
          if (!profile) {
            // 1. Buscar en la tabla public.profiles de Supabase
            const { data: dbProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('email', cleanEmail)
              .maybeSingle();

            if (dbProfile) {
              profile = {
                id: dbProfile.id,
                email: dbProfile.email,
                full_name: dbProfile.full_name || cleanEmail.split('@')[0],
                role: dbProfile.role || 'cajero',
                is_active: dbProfile.is_active ?? true,
                phone: dbProfile.phone || '',
                created_at: dbProfile.created_at || new Date().toISOString(),
              };
              db.getSnapshot().profiles.push(profile);
              db.persistState();
            } else {
              // 2. Usuario creado directamente en Supabase Auth Dashboard sin fila previa en profiles
              const autoRole: UserRole = (data.user.user_metadata?.role as UserRole) || 'administrador';
              const autoName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0] || 'Usuario Supabase';
              const autoProfile: UserProfile = {
                id: data.user.id,
                email: cleanEmail,
                full_name: autoName,
                role: autoRole,
                is_active: true,
                phone: data.user.user_metadata?.phone || '',
                created_at: new Date().toISOString(),
              };

              try {
                await supabase.from('profiles').upsert({
                  id: autoProfile.id,
                  email: autoProfile.email,
                  full_name: autoProfile.full_name,
                  role: autoProfile.role,
                  is_active: true,
                  phone: autoProfile.phone,
                  updated_at: new Date().toISOString(),
                });
              } catch (e) {
                console.warn('Auto profile upsert warning:', e);
              }

              profile = autoProfile;
              db.getSnapshot().profiles.push(autoProfile);
              db.persistState();
            }
          }

          if (profile) {
            if (!profile.is_active) {
              await supabase.auth.signOut();
              setIsLoading(false);
              return { success: false, error: 'Esta cuenta ha sido desactivada por el administrador.' };
            }
            setUser(profile);
            localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(profile));
            db.addAuditLog(profile.id, profile.full_name, 'LOGIN_EXITOSO_SUPABASE', 'Autenticación', profile.id, 'Inicio de sesión con Supabase Auth');
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (err) {
        console.warn('Supabase auth attempt:', err);
      }
    }

    // Modo autenticación con perfiles del sistema
    const profile = db.getSnapshot().profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) {
      setIsLoading(false);
      return { success: false, error: 'Usuario no encontrado en el sistema.' };
    }

    if (!profile.is_active) {
      setIsLoading(false);
      return { success: false, error: 'La cuenta está desactivada por el administrador.' };
    }

    setUser(profile);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(profile));

    // Registrar auditoría de inicio de sesión
    db.addAuditLog(profile.id, profile.full_name, 'LOGIN_EXITOSO', 'Autenticación', profile.id, 'Inicio de sesión correcto');

    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (user) {
      db.addAuditLog(user.id, user.full_name, 'LOGOUT_USUARIO', 'Autenticación', user.id, 'Cierre de sesión');
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const profile = db.getSnapshot().profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
    if (!profile) {
      return { success: false, error: 'No existe ninguna cuenta vinculada a este correo.' };
    }

    // Enviar correo a la cola del sistema
    db.enqueueEmail(
      profile.email,
      'Recuperación de Contraseña - ERP / POS Ecuador',
      `<p>Hola ${profile.full_name}, hemos recibido una solicitud para restablecer tu contraseña. Ingresa al enlace seguro de tu empresa para cambiarla.</p>`,
      'recuperacion_clave',
      profile.id
    );

    return { success: true };
  };

  // Cambio rápido entre roles para pruebas y supervisión
  const switchUserRole = (targetRole: UserRole) => {
    const foundUser = db.getSnapshot().profiles.find((p) => p.role === targetRole && p.is_active);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(foundUser));
      db.addAuditLog(foundUser.id, foundUser.full_name, 'CAMBIO_PERFIL_PRUEBA', 'Seguridad', foundUser.id, `Cambio de perfil activo a: ${targetRole}`);
    }
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
    // Administrador siempre tiene acceso total
    if (user.role === 'administrador') return true;

    const allowedPermissions = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
    return allowedPermissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        resetPassword,
        switchUserRole,
        hasPermission,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
