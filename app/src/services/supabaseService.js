// src/services/supabaseService.js
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── PlazaYa Supabase ──────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://urbvlzfafpdxwlvzexww.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVyYnZsemZhZnBkeHdsdnpleHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDAwMDAsImV4cCI6MjA4ODc3NjAwMH0.placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Device ID único ───────────────────────────────────────────────────────────
export async function getOrCreateDeviceId() {
  let deviceId = await AsyncStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    await AsyncStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

// ── Verifica versão mínima ────────────────────────────────────────────────────
export async function checkAppVersion(versaoAtual) {
  try {
    const { data, error } = await supabase
      .from('config')
      .select('versao_minima, forcar, mensagem')
      .eq('id', 'app')
      .single();

    if (error || !data) return null;

    const atual = versaoAtual.split('.').map(Number);
    const minima = data.versao_minima.split('.').map(Number);

    let precisaAtualizar = false;
    for (let i = 0; i < 3; i++) {
      if ((atual[i] || 0) < (minima[i] || 0)) { precisaAtualizar = true; break; }
      if ((atual[i] || 0) > (minima[i] || 0)) break;
    }

    return precisaAtualizar ? data : null;
  } catch (e) {
    console.log('Supabase version check error:', e);
    return null;
  }
}

// ── Upsert usuário ────────────────────────────────────────────────────────────
export async function upsertUsuario({ pushToken, estado, areas, salarioMin, escolaridade, onboardingCompleto, versaoApp }) {
  try {
    const deviceId = await getOrCreateDeviceId();
    const { error } = await supabase
      .from('usuarios')
      .upsert({
        device_id: deviceId,
        push_token: pushToken,
        estado,
        areas,
        salario_min: salarioMin,
        escolaridade,
        onboarding_completo: onboardingCompleto,
        versao_app: versaoApp,
        ultimo_acesso: new Date().toISOString(),
      }, { onConflict: 'device_id' });

    if (error) console.log('Supabase upsert error:', error);
  } catch (e) {
    console.log('Supabase upsertUsuario error:', e);
  }
}

// ── Atualizar último acesso ───────────────────────────────────────────────────
export async function updateUltimoAcesso() {
  try {
    const deviceId = await getOrCreateDeviceId();
    await supabase
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('device_id', deviceId);
  } catch (e) {
    console.log('Supabase updateUltimoAcesso error:', e);
  }
}

// ── Upsert perfil (Auth) ─────────────────────────────────────────────────────
export async function upsertProfile(userId, data) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...data, updated_at: new Date().toISOString() });
    if (error) console.log('upsertProfile error:', error);
  } catch (e) {
    console.log('upsertProfile error:', e);
  }
}
