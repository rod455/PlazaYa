// src/screens/auth/CadastroScreen.js
// Tela de cadastro: Nome, Email, Senha, Confirmar Senha

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, ScrollView,
  Platform, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const COLORS = {
  primary: '#0177b5', primaryDark: '#01497a',
  bg: '#f4f6f9', text: '#1a2332', textMuted: '#6b7280',
  border: '#e5e7eb', danger: '#dc2626', success: '#16a34a',
};

export default function CadastroScreen() {
  const nav = useNavigation();
  const [nome, setNome]         = useState('');
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [confirma, setConfirma] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showSenha, setShowSenha]       = useState(false);
  const [showConfirma, setShowConfirma] = useState(false);

  // Validações
  const erros = {
    nome:     nome.trim().length > 0 && nome.trim().length < 3 ? 'Nombre muy corto' : null,
    email:    email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Email inválido' : null,
    senha:    senha.length > 0 && senha.length < 6 ? 'Mínimo 6 caracteres' : null,
    confirma: confirma.length > 0 && confirma !== senha ? 'Las contraseñas no coinciden' : null,
  };

  const formValido = nome.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && senha.length >= 6 && senha === confirma;

  const handleCadastro = async () => {
    if (!formValido) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
        options: {
          data: { nome: nome.trim() },
        },
      });

      if (error) throw error;

      // Atualiza perfil com nome
      if (data.user) {
        await supabase
          .from('profiles')
          .upsert({ id: data.user.id, email: email.trim().toLowerCase(), nome: nome.trim() });
      }

      Alert.alert(
        '✅ ¡Cuenta creada!',
        'Revisa tu email para confirmar tu cuenta. Luego podrás iniciar sesión.',
        [{ text: 'Entendido', onPress: () => nav.navigate('Auth') }]
      );
    } catch (e) {
      const msg = e.message?.includes('already registered')
        ? 'Este email ya está registrado.'
        : e.message ?? 'Error al crear cuenta.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <TouchableOpacity style={s.backBtn} onPress={() => nav.goBack()}>
          <Text style={s.backTxt}>← Volver</Text>
        </TouchableOpacity>

        <View style={s.topSection}>
          <Text style={s.logo}>🏛️</Text>
          <Text style={s.title}>Crear cuenta</Text>
          <Text style={s.subtitle}>Acceso ilimitado + alertas de nuevas plazas</Text>
        </View>

        {/* Campos */}
        <View style={s.form}>

          {/* Nome */}
          <View style={s.campo}>
            <Text style={s.label}>Nombre completo</Text>
            <TextInput
              style={[s.input, erros.nome && s.inputError]}
              placeholder="Ej. Juan García López"
              placeholderTextColor={COLORS.textMuted}
              value={nome}
              onChangeText={setNome}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {erros.nome && <Text style={s.erro}>{erros.nome}</Text>}
          </View>

          {/* Email */}
          <View style={s.campo}>
            <Text style={s.label}>Correo electrónico</Text>
            <TextInput
              style={[s.input, erros.email && s.inputError]}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            {erros.email && <Text style={s.erro}>{erros.email}</Text>}
          </View>

          {/* Senha */}
          <View style={s.campo}>
            <Text style={s.label}>Contraseña</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.inputFlex, erros.senha && s.inputError]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={COLORS.textMuted}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showSenha}
                returnKeyType="next"
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowSenha(v => !v)}>
                <Text style={s.eyeIcon}>{showSenha ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {erros.senha && <Text style={s.erro}>{erros.senha}</Text>}
          </View>

          {/* Confirmar senha */}
          <View style={s.campo}>
            <Text style={s.label}>Confirmar contraseña</Text>
            <View style={s.inputRow}>
              <TextInput
                style={[s.inputFlex, erros.confirma && s.inputError]}
                placeholder="Repite tu contraseña"
                placeholderTextColor={COLORS.textMuted}
                value={confirma}
                onChangeText={setConfirma}
                secureTextEntry={!showConfirma}
                returnKeyType="done"
                onSubmitEditing={handleCadastro}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirma(v => !v)}>
                <Text style={s.eyeIcon}>{showConfirma ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {erros.confirma && <Text style={s.erro}>{erros.confirma}</Text>}
          </View>

          {/* Indicador de força da senha */}
          {senha.length > 0 && (
            <View style={s.forca}>
              {[1,2,3,4].map(i => (
                <View
                  key={i}
                  style={[s.forcaBarra, {
                    backgroundColor: senha.length >= i * 3
                      ? i <= 1 ? COLORS.danger : i <= 2 ? '#f59e0b' : COLORS.success
                      : COLORS.border,
                  }]}
                />
              ))}
              <Text style={s.forcaTxt}>
                {senha.length < 4 ? 'Débil' : senha.length < 8 ? 'Regular' : 'Fuerte'}
              </Text>
            </View>
          )}

          {/* Botão cadastrar */}
          <TouchableOpacity
            style={[s.btnCadastrar, !formValido && s.btnDisabled]}
            onPress={handleCadastro}
            disabled={!formValido || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnCadastrarTxt}>Crear cuenta</Text>}
          </TouchableOpacity>

          {/* Link para login */}
          <View style={s.loginRow}>
            <Text style={s.loginTxt}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => nav.navigate('Auth')}>
              <Text style={s.loginLink}>Iniciar sesión</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Benefícios */}
        <View style={s.beneficios}>
          {[
            '🔔 Alertas de nuevas convocatorias',
            '🔓 Acceso ilimitado a Novedades',
            '📊 Historial de estudios',
            '🆓 100% gratis, siempre',
          ].map((b, i) => (
            <View key={i} style={s.beneficioItem}>
              <Text style={s.beneficioTxt}>{b}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  content:     { paddingHorizontal: 24, paddingBottom: 40 },
  backBtn:     { paddingTop: 56, paddingBottom: 8 },
  backTxt:     { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  topSection:  { alignItems: 'center', paddingVertical: 24 },
  logo:        { fontSize: 48, marginBottom: 12 },
  title:       { fontSize: 26, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  subtitle:    { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  form:        { backgroundColor: '#fff', borderRadius: 20, padding: 20,
                 shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
                 shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  campo:       { marginBottom: 16 },
  label:       { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  input:       { backgroundColor: COLORS.bg, borderRadius: 12, paddingHorizontal: 14,
                 paddingVertical: 13, fontSize: 15, color: COLORS.text,
                 borderWidth: 1.5, borderColor: COLORS.border },
  inputError:  { borderColor: COLORS.danger },
  inputRow:    { flexDirection: 'row', alignItems: 'center',
                 backgroundColor: COLORS.bg, borderRadius: 12,
                 borderWidth: 1.5, borderColor: COLORS.border },
  inputFlex:   { flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: COLORS.text },
  eyeBtn:      { padding: 12 },
  eyeIcon:     { fontSize: 18 },
  erro:        { fontSize: 12, color: COLORS.danger, marginTop: 4, marginLeft: 4 },
  forca:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16, marginTop: -8 },
  forcaBarra:  { flex: 1, height: 4, borderRadius: 2 },
  forcaTxt:    { fontSize: 12, color: COLORS.textMuted, marginLeft: 4 },
  btnCadastrar:{ backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
                 alignItems: 'center', marginTop: 8,
                 shadowColor: COLORS.primaryDark, shadowOpacity: 0.4,
                 shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  btnDisabled: { backgroundColor: COLORS.border, shadowOpacity: 0 },
  btnCadastrarTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  loginRow:    { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginTxt:    { fontSize: 14, color: COLORS.textMuted },
  loginLink:   { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
  beneficios:  { marginTop: 24, gap: 8 },
  beneficioItem: { flexDirection: 'row', alignItems: 'center',
                   backgroundColor: '#fff', borderRadius: 12, padding: 14,
                   shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
                   shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  beneficioTxt:  { fontSize: 14, color: COLORS.text, fontWeight: '600' },
});
