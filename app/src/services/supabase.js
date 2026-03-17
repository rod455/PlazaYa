// src/services/supabase.js
// Cliente central do Supabase — importar em todos os services

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL       = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('⚠️  Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY no .env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,          // persiste sessão no dispositivo
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ─── Helpers genéricos ────────────────────────────────────────────────────────

/** Retorna o usuário logado ou null */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Retorna o profile do usuário logado */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/** Salva/atualiza campos do profile */
export async function upsertProfile(userId, fields) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Lê configuração remota do app */
export async function getAppConfig(chave) {
  const { data } = await supabase
    .from('app_config')
    .select('valor')
    .eq('chave', chave)
    .single();
  return data?.valor ?? null;
}
