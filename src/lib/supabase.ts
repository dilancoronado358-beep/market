import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Credenciales oficiales de Supabase para ERP / POS Ecuador (Tienda Katy)
const DEFAULT_SUPABASE_URL = 'https://lyoxpekdnrurlvcisbhe.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Sb2bNdyXiH6u7UXkeM9BCQ_zl_-HS77';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

export const isSupabaseConfigured = !isTestEnv && Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-ref')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

