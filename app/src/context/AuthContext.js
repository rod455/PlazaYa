// src/context/AuthContext.js
// Contexto de autenticación - email/nombre via AsyncStorage + Supabase
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

const STORAGE_KEY_USER = '@plazaya:user_profile';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_USER);
      if (stored) setUser(JSON.parse(stored));
    } catch {} finally { setLoading(false); }
  }

  async function cadastrar(nome, email) {
    const profile = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      criadoEm: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
    setUser(profile);
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (deviceId) {
        await supabase.from('usuarios').update({
          nome: profile.nome, email: profile.email,
          conta_criada: true, conta_criada_em: new Date().toISOString(),
        }).eq('device_id', deviceId);
      }
    } catch {}
    return profile;
  }

  async function login(email) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const d = data[0];
        const profile = {
          nome: d.nome || '', email: d.email || email.trim().toLowerCase(),
          criadoEm: d.conta_criada_em || new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(profile));
        if (d.device_id) await AsyncStorage.setItem('device_id', d.device_id);
        if (d.quizzes_done) await AsyncStorage.setItem('@plazaya:quizzes_done', String(d.quizzes_done));
        if (d.total_correct) await AsyncStorage.setItem('@plazaya:total_correct', String(d.total_correct));
        if (d.total_questions) await AsyncStorage.setItem('@plazaya:total_questions', String(d.total_questions));
        if (d.concursos_viewed) await AsyncStorage.setItem('@plazaya:concursos_viewed', String(d.concursos_viewed));
        setUser(profile);
        return { success: true };
      }
      return { success: false, error: 'Email no encontrado. Crea una cuenta primero.' };
    } catch {
      return { success: false, error: 'Error al conectar. Intenta de nuevo.' };
    }
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
    setUser(null);
  }

  async function syncProgressToFirestore() {
    try {
      const deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId || !user) return;
      const quizzesDone = parseInt(await AsyncStorage.getItem('@plazaya:quizzes_done')) || 0;
      const totalCorrect = parseInt(await AsyncStorage.getItem('@plazaya:total_correct')) || 0;
      const totalQuestions = parseInt(await AsyncStorage.getItem('@plazaya:total_questions')) || 0;
      const concursosViewed = parseInt(await AsyncStorage.getItem('@plazaya:concursos_viewed')) || 0;
      await supabase.from('usuarios').update({
        quizzes_done: quizzesDone, total_correct: totalCorrect,
        total_questions: totalQuestions, concursos_viewed: concursosViewed,
        ultimo_sync: new Date().toISOString(),
      }).eq('device_id', deviceId);
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, loading, cadastrar, login, logout, syncProgressToFirestore }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
