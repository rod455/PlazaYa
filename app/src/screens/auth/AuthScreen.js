// src/screens/auth/AuthScreen.js
// Cadastro e Login — Supabase Auth

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp, signIn, resetPassword } from '../../services/authService';
import { useQuiz } from '../../context/QuizContext';

export default function AuthScreen({ navigation, route }) {
  const fromQuiz = route?.params?.fromKnowledgeQuiz ?? false;
  const { answers } = useQuiz();

  const [modo,     setModo]     = useState('login');   // login | cadastro | reset
  const [email,    setEmail]    = useState('');
  const [senha,    setSenha]    = useState('');
  const [nome,     setNome]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [senhaVis, setSenhaVis] = useState(false);

  async function handleCadastro() {
    if (!nome.trim() || !email.trim() || senha.length < 6) {
      Alert.alert('Datos incompletos', 'Completa nombre, email y contraseña (mínimo 6 caracteres).');
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: email.trim().toLowerCase(),
        password: senha,
        nome: nome.trim(),
        perfil: answers,  // passa o perfil do quiz de onboarding
      });
      Alert.alert(
        '¡Cuenta creada! 🎉',
        'Revisa tu email para confirmar tu cuenta.',
        [{ text: 'OK', onPress: () => navigation.replace('MainApp') }]
      );
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email.trim() || !senha) {
      Alert.alert('Datos incompletos', 'Ingresa email y contraseña.');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: email.trim().toLowerCase(), password: senha });
      navigation.replace('MainApp');
    } catch (e) {
      Alert.alert('Error', 'Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Ingresa tu email para recuperar la contraseña.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      Alert.alert('Email enviado', 'Revisa tu bandeja de entrada para resetear tu contraseña.');
      setModo('login');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <Text style={styles.logo}>🏛️</Text>
          <Text style={styles.titulo}>
            {modo === 'cadastro' ? 'Crea tu cuenta' : modo === 'reset' ? 'Recuperar contraseña' : 'Bienvenido de vuelta'}
          </Text>

          {fromQuiz && modo === 'cadastro' && (
            <View style={styles.tipBox}>
              <Text style={styles.tipTxt}>
                📚 Crea tu cuenta para acceder a cientos de preguntas y simulacros completos.
              </Text>
            </View>
          )}

          {/* Campos */}
          {modo === 'cadastro' && (
            <View style={styles.campo}>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.campo}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {modo !== 'reset' && (
            <View style={styles.campo}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.senhaWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder={modo === 'cadastro' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  value={senha}
                  onChangeText={setSenha}
                  secureTextEntry={!senhaVis}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setSenhaVis(v => !v)} style={styles.olho}>
                  <Text style={{ fontSize: 18 }}>{senhaVis ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Botão principal */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={modo === 'cadastro' ? handleCadastro : modo === 'reset' ? handleReset : handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnTxt}>
                  {modo === 'cadastro' ? 'Crear cuenta 🚀' : modo === 'reset' ? 'Enviar email' : 'Entrar →'}
                </Text>
            }
          </TouchableOpacity>

          {/* Links de alternância */}
          {modo === 'login' && (
            <>
              <TouchableOpacity onPress={() => setModo('cadastro')} style={styles.link}>
                <Text style={styles.linkTxt}>¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate gratis</Text></Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModo('reset')} style={styles.link}>
                <Text style={styles.linkTxt}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </>
          )}

          {modo === 'cadastro' && (
            <TouchableOpacity onPress={() => setModo('login')} style={styles.link}>
              <Text style={styles.linkTxt}>¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia sesión</Text></Text>
            </TouchableOpacity>
          )}

          {modo === 'reset' && (
            <TouchableOpacity onPress={() => setModo('login')} style={styles.link}>
              <Text style={styles.linkTxt}>← Volver al inicio de sesión</Text>
            </TouchableOpacity>
          )}

          {/* Pular (ir sem conta) */}
          <TouchableOpacity onPress={() => navigation.replace('MainApp')} style={styles.pular}>
            <Text style={styles.pularTxt}>Continuar sin cuenta →</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#f9fafb' },
  container:   { padding: 24, paddingTop: 48 },
  logo:        { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  titulo:      { fontSize: 26, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 28 },

  tipBox:      { backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#01497a' },
  tipTxt:      { fontSize: 14, color: '#1e40af', lineHeight: 20 },

  campo:       { marginBottom: 16 },
  label:       { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input:       { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 12,
                 paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#111827' },
  senhaWrap:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  olho:        { padding: 10 },

  btn:         { backgroundColor: '#01497a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnTxt:      { color: '#fff', fontSize: 17, fontWeight: '800' },

  link:        { alignItems: 'center', marginTop: 16 },
  linkTxt:     { fontSize: 14, color: '#6b7280' },
  linkBold:    { color: '#01497a', fontWeight: '700' },

  pular:       { alignItems: 'center', marginTop: 32, paddingBottom: 20 },
  pularTxt:    { fontSize: 13, color: '#9ca3af' },
});
