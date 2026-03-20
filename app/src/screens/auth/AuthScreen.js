// src/screens/auth/AuthScreen.js
// Login e cadastro — Supabase Auth

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signUp, signIn, resetPassword } from '../../services/authService';
import { useQuiz } from '../../context/QuizContext';
import { COLORS } from '../../constants/colors';

export default function AuthScreen({ navigation, route }) {
  const fromQuiz = route?.params?.fromKnowledgeQuiz ?? false;
  const { answers } = useQuiz();

  const [modo,     setModo]     = useState('login');
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
        perfil: answers,
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
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
            <Text style={s.backTxt}>← Volver</Text>
          </TouchableOpacity>

          <Text style={s.logo}>Plaza<Text style={{ color: COLORS.red }}>Ya</Text></Text>
          <Text style={s.title}>{modo === 'login' ? 'Iniciar sesión' : modo === 'cadastro' ? 'Crear cuenta' : 'Recuperar contraseña'}</Text>

          {modo === 'cadastro' && (
            <>
              <Text style={s.label}>Nombre</Text>
              <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Tu nombre" placeholderTextColor="#999" />
            </>
          )}

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />

          {modo !== 'reset' && (
            <>
              <Text style={s.label}>Contraseña</Text>
              <View style={s.senhaRow}>
                <TextInput style={[s.input, { flex: 1 }]} value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" placeholderTextColor="#999" secureTextEntry={!senhaVis} />
                <TouchableOpacity onPress={() => setSenhaVis(!senhaVis)} style={s.eyeBtn}>
                  <Text>{senhaVis ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Botão principal */}
          <TouchableOpacity
            style={s.btn}
            onPress={modo === 'login' ? handleLogin : modo === 'cadastro' ? handleCadastro : handleReset}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={s.btnTxt}>
                {modo === 'login' ? 'Entrar' : modo === 'cadastro' ? 'Crear cuenta' : 'Enviar email'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Links */}
          {modo === 'login' && (
            <>
              <TouchableOpacity onPress={() => setModo('reset')} style={s.link}>
                <Text style={s.linkTxt}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModo('cadastro')} style={s.link}>
                <Text style={s.linkTxt}>¿No tienes cuenta? <Text style={{ fontWeight: '800' }}>Crear cuenta</Text></Text>
              </TouchableOpacity>
            </>
          )}
          {modo === 'cadastro' && (
            <TouchableOpacity onPress={() => setModo('login')} style={s.link}>
              <Text style={s.linkTxt}>¿Ya tienes cuenta? <Text style={{ fontWeight: '800' }}>Iniciar sesión</Text></Text>
            </TouchableOpacity>
          )}
          {modo === 'reset' && (
            <TouchableOpacity onPress={() => setModo('login')} style={s.link}>
              <Text style={s.linkTxt}>← Volver a iniciar sesión</Text>
            </TouchableOpacity>
          )}

          {/* Skip */}
          <TouchableOpacity onPress={() => navigation.replace('MainApp')} style={s.skipBtn}>
            <Text style={s.skipTxt}>Continuar sin cuenta →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingTop: 10 },
  back: { paddingVertical: 8 },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  logo: { fontSize: 32, fontWeight: '900', color: COLORS.primary, textAlign: 'center', marginTop: 20, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  senhaRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { padding: 10, marginLeft: -44 },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24, elevation: 3,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  link: { alignItems: 'center', marginTop: 16 },
  linkTxt: { color: COLORS.primary, fontSize: 14 },
  skipBtn: { alignItems: 'center', marginTop: 24, padding: 10 },
  skipTxt: { color: '#999', fontSize: 13 },
});
