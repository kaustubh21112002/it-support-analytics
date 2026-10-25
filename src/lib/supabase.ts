import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = typeof import.meta.env.VITE_SUPABASE_URL === 'string'
  ? import.meta.env.VITE_SUPABASE_URL.trim()
  : '';

const supabaseKey = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string'
  ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
  : '';

export const isSupabaseAvailable: boolean = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseAvailable
  ? createClient(supabaseUrl, supabaseKey)
  : null;
