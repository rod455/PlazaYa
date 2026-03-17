// src/services/authService.js
// Cadastro, login e logout via Supabase Auth

import { supabase, upsertProfile } from './supabase';

// ─── CADASTRO ────────────────────────────────────────────────────────────────
export async function signUp({ email, password, nome, perfil }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const userId = data.user?.id;
  if (userId && perfil) {
    // salva perfil do quiz de onboarding
    await upsertProfile(userId, {
      nome,
      email,
      area:         perfil.area     || null,
      estado:       perfil.estado   || null,
      escolaridade: perfil.escolaridade || null,
      salario_min:  perfil.salarioMin ?? null,
      salario_max:  perfil.salarioMax ?? null,
      preparacao:   perfil.preparacao || null,
      onboarding_ok: true,
    });
  }

  return data;
}

// ─── LOGIN ───────────────────────────────────────────────────────────────────
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ─── RECUPERAR SENHA ─────────────────────────────────────────────────────────
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ─── SESSÃO ATUAL ────────────────────────────────────────────────────────────
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── LISTENER DE AUTH ────────────────────────────────────────────────────────
// Use no App.js para reagir a login/logout
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
