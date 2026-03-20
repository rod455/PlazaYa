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
import { COLORS } from '../../constants/colors';

export default function CadastroScreen() {
  const nav = useNavigation();
  const [nome, setNome]         = useState('');
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [confirma, setConfirma] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showSenha, setShowSenha]       = useState(false);
  const [showConfirma, setShowConfirma] = useState(false);

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
        options: { data: { nome: nome.trim() } },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email.trim().toLowerCase(),
          nome: nome.trim(),
        });
      }

      Alert.alert(
        '¡Cuenta creada! ✅',
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => nav.goBack()} style={s.back}>
          <Text style={s.backTxt}>← Volver</Text>
        </TouchableOpacity>

        <Text style={s.title}>Crear cuenta</Text>
        <Text style={s.sub}>Crea tu cuenta para guardar progreso y recibir notificaciones personalizadas.</Text>

        {/* Nome */}
        <Text style={s.label}>Nombre</Text>
        <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Tu nombre" placeholderTextColor="#999" />
        {erros.nome && <Text style={s.erro}>{erros.nome}</Text>}

        {/* Email */}
        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor="#999" keyboardType="email-address" autoCapitalize="none" />
        {erros.email && <Text style={s.erro}>{erros.email}</Text>}

        {/* Senha */}
        <Text style={s.label}>Contraseña</Text>
        <View style={s.senhaRow}>
          <TextInput style={[s.input, { flex: 1 }]} value={senha} onChangeText={setSenha} placeholder="Mínimo 6 caracteres" placeholderTextColor="#999" secureTextEntry={!showSenha} />
          <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={s.eyeBtn}>
            <Text>{showSenha ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {erros.senha && <Text style={s.erro}>{erros.senha}</Text>}

        {/* Confirmar senha */}
        <Text style={s.label}>Confirmar contraseña</Text>
        <View style={s.senhaRow}>
          <TextInput style={[s.input, { flex: 1 }]} value={confirma} onChangeText={setConfirma} placeholder="Repite tu contraseña" placeholderTextColor="#999" secureTextEntry={!showConfirma} />
          <TouchableOpacity onPress={() => setShowConfirma(!showConfirma)} style={s.eyeBtn}>
            <Text>{showConfirma ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {erros.confirma && <Text style={s.erro}>{erros.confirma}</Text>}

        {/* Botão */}
        <TouchableOpacity
          style={[s.btn, !formValido && s.btnDisabled]}
          onPress={handleCadastro}
          disabled={!formValido || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Crear cuenta</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
  back: { paddingVertical: 8 },
  backTxt: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.primary, marginTop: 12, marginBottom: 4 },
  sub: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    fontSize: 15, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  senhaRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { padding: 10, marginLeft: -44 },
  erro: { color: COLORS.danger, fontSize: 12, marginTop: 4, fontWeight: '600' },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 28, elevation: 3,
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
