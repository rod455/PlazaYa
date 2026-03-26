// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);
const STORAGE_KEY_USER = '@plazaya:user_profile';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadUser(); }, []);
  async function loadUser() { try { const s = await AsyncStorage.getItem(STORAGE_KEY_USER); if (s) setUser(JSON.parse(s)); } catch {} finally { setLoading(false); } }
  async function cadastrar(nome, email) {
    const profile = { nome: nome.trim(), email: email.trim().toLowerCase(), criadoEm: new Date().toISOString() };
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile)); setUser(profile);
    try { const did = await AsyncStorage.getItem('device_id'); if (did) await supabase.from('usuarios').update({ nome: profile.nome, email: profile.email, conta_criada: true, conta_criada_em: new Date().toISOString() }).eq('device_id', did); } catch {}
    return profile;
  }
  async function login(email) {
    try {
      const { data, error } = await supabase.from('usuarios').select('*').eq('email', email.trim().toLowerCase()).limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const d = data[0]; const profile = { nome: d.nome || '', email: d.email || email.trim().toLowerCase(), criadoEm: d.conta_criada_em || new Date().toISOString() };
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
        if (d.device_id) await AsyncStorage.setItem('device_id', d.device_id);
        setUser(profile); return { success: true };
      }
      return { success: false, error: 'Email no encontrado. Crea una cuenta primero.' };
    } catch { return { success: false, error: 'Error al conectar. Intenta de nuevo.' }; }
  }
  async function logout() { await AsyncStorage.removeItem(STORAGE_KEY_USER); setUser(null); }
  async function syncProgressToFirestore() {
    try { const did = await AsyncStorage.getItem('device_id'); if (!did || !user) return;
      const qd = parseInt(await AsyncStorage.getItem('@plazaya:quizzes_done')) || 0;
      const tc = parseInt(await AsyncStorage.getItem('@plazaya:total_correct')) || 0;
      const tq = parseInt(await AsyncStorage.getItem('@plazaya:total_questions')) || 0;
      const cv = parseInt(await AsyncStorage.getItem('@plazaya:concursos_viewed')) || 0;
      await supabase.from('usuarios').update({ quizzes_done: qd, total_correct: tc, total_questions: tq, concursos_viewed: cv, ultimo_sync: new Date().toISOString() }).eq('device_id', did);
    } catch {}
  }
  return <AuthContext.Provider value={{ user, loading, cadastrar, login, logout, syncProgressToFirestore }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const c = useContext(AuthContext); if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider'); return c; };
