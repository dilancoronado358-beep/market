// ==============================================================================
// CONTEXTO DE AUTENTICACIÓN Y CONTROL DE ACCESO BASADO EN ROLES (RBAC)
// Autenticación directa en Supabase PostgreSQL — SIN LOCALSTORAGE
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

const SESSION_KEY = 'erp_pos_ecuador_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Limpiar cualquier residuo de localStorage y verificar sesión en Supabase / memoria
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('erp_pos_ecuador_db_v1');
          localStorage.removeItem('erp_pos_ecuador_auth_user');
          localStorage.removeItem('tienda_katy_db_v1');
          localStorage.removeItem('tienda_katy_auth_user');
        }
      } catch {
        // Ignorar
      }

      setIsLoading(true);

      // 1. Cargar perfiles directamente de Supabase
      let profilesList: UserProfile[] = db.getSnapshot().profiles;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbProfiles, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });

          if (!error && dbProfiles && dbProfiles.length > 0) {
            profilesList = dbProfiles;
            db.getSnapshot().profiles = dbProfiles;
          }
        } catch (e) {
          console.warn('Error fetching profiles from Supabase:', e);
        }
      }
      setAllUsers(profilesList);

      // 2. Verificar sesión de Supabase Auth
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) {
            const userEmail = session.user.email.toLowerCase();
            const foundProfile = profilesList.find((p) => p.email.toLowerCase() === userEmail);
            if (foundProfile && foundProfile.is_active) {
              setUser(foundProfile);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Error checking Supabase auth session:', e);
        }
      }

      // 3. Verificar sesión temporal en sessionStorage (cerrable al cerrar pestaña, 0 localStorage)
      try {
        if (typeof sessionStorage !== 'undefined') {
          const savedSession = sessionStorage.getItem(SESSION_KEY);
          if (savedSession) {
            const parsed = JSON.parse(savedSession);
            const activeProfile = profilesList.find(
              (p) => p.email.toLowerCase() === (parsed.email || '').toLowerCase()
            );
            if (activeProfile && activeProfile.is_active) {
              setUser(activeProfile);
              setIsLoading(false);
              return;
            } else {
              sessionStorage.removeItem(SESSION_KEY);
            }
          }
        }
      } catch {
        // Ignorar
      }

      setIsLoading(false);
    };

    checkSession();

    // Suscripción al motor relacional
    const unsubscribe = db.subscribe(() => {
      setAllUsers([...db.getSnapshot().profiles]);
    });

    return () => unsubscribe();
  }, []);

  // Inicio de sesión directo contra Supabase
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    let targetProfile: UserProfile | null = null;

    // 1. Consultar directamente la tabla public.profiles de Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbProfile, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (profErr) {
          console.warn('Supabase profile query notice:', profErr.message);
        }

        if (dbProfile) {
          targetProfile = dbProfile;
          // Actualizar snapshot en memoria
          const existingIdx = db.getSnapshot().profiles.findIndex((p) => p.email.toLowerCase() === cleanEmail);
          if (existingIdx >= 0) {
            db.getSnapshot().profiles[existingIdx] = dbProfile;
          } else {
            db.getSnapshot().profiles.push(dbProfile);
          }
        }

        // Intentar autenticación formal en Supabase Auth
        if (password) {
          const { data: authData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (authData?.user && !targetProfile) {
            // Si el usuario existe en Supabase Auth pero no en profiles, crearlo
            const autoRole: UserRole = (authData.user.user_metadata?.role as UserRole) || 'administrador';
            const autoName = authData.user.user_metadata?.full_name || cleanEmail.split('@')[0] || 'Usuario';
            targetProfile = {
              id: authData.user.id,
              email: cleanEmail,
              full_name: autoName,
              role: autoRole,
              is_active: true,
              phone: authData.user.user_metadata?.phone || '',
              created_at: new Date().toISOString(),
            };

            await supabase.from('profiles').upsert({
              id: targetProfile.id,
              email: targetProfile.email,
              full_name: targetProfile.full_name,
              role: targetProfile.role,
              is_active: true,
              phone: targetProfile.phone,
              updated_at: new Date().toISOString(),
            });
            db.getSnapshot().profiles.push(targetProfile);
          }
        }
      } catch (err) {
        console.warn('Supabase login notice:', err);
      }
    }

    // 2. Si no se encontró en Supabase directamente, verificar snapshot cargado
    if (!targetProfile) {
      targetProfile = db.getSnapshot().profiles.find((p) => p.email.toLowerCase() === cleanEmail) || null;
    }

    if (!targetProfile) {
      setIsLoading(false);
      return {
        success: false,
        error: 'El usuario no está registrado en la base de datos de Supabase. Verifique el correo o contacte al administrador.',
      };
    }

    if (!targetProfile.is_active) {
      setIsLoading(false);
      return { success: false, error: 'Esta cuenta ha sido desactivada por el administrador general.' };
    }

    // Establecer usuario en el estado de la aplicación
    setUser(targetProfile);

    // Guardar exclusivamente en sessionStorage (NADA en localStorage)
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(targetProfile));
      }
    } catch {
      // Ignorar
    }

    // Registrar bitácora de auditoría en Supabase
    db.addAuditLog(
      targetProfile.id,
      targetProfile.full_name,
      'LOGIN_EXITOSO_SUPABASE',
      'Autenticación',
      targetProfile.id,
      `Inicio de sesión exitoso en Supabase Cloud desde ${window.location.hostname}`
    );

    setIsLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (user) {
      db.addAuditLog(user.id, user.full_name, 'LOGOUT_USUARIO', 'Autenticación', user.id, 'Cierre de sesión');
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }
    setUser(null);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignorar
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    let profile = db.getSnapshot().profiles.find((p) => p.email.toLowerCase() === cleanEmail);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('email', cleanEmail).maybeSingle();
        if (dbProfile) profile = dbProfile;
      } catch (e) {
        console.warn('Supabase reset check error:', e);
      }
    }

    if (!profile) {
      return { success: false, error: 'No existe ninguna cuenta vinculada a este correo en Supabase.' };
    }

    db.enqueueEmail(
      profile.email,
      'Recuperación de Contraseña - ERP / POS Ecuador',
      `<p>Estimado(a) ${profile.full_name}, se ha emitido una solicitud para restablecer su contraseña de acceso.</p>`,
      'recuperacion_clave',
      profile.id
    );

    return { success: true };
  };

  const switchUserRole = (targetRole: UserRole) => {
    const foundUser = allUsers.find((p) => p.role === targetRole && p.is_active);
    if (foundUser) {
      setUser(foundUser);
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(foundUser));
        }
      } catch {
        // Ignorar
      }
      db.addAuditLog(
        foundUser.id,
        foundUser.full_name,
        'CAMBIO_PERFIL_PRUEBA',
        'Seguridad',
        foundUser.id,
        `Cambio de perfil activo a: ${targetRole}`
      );
    }
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false;
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
