// src/screens/main/CuentaScreen.js
// Pantalla de Login / Registro / Perfil del usuario
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AdBanner from '../../components/AdBanner';
import { useAuth } from '../../context/AuthContext';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';

function TelaLogado({ user, onLogout, onSync }) {
  return (
    <View>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(user.nome || user.email || '?')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{user.nome || 'Usuario'}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
        <Text style={styles.profileSince}>Miembro desde {new Date(user.criadoEm).toLocaleDateString('es-MX')}</Text>
      </View>
      <View style={styles.benefitsBox}>
        <Text style={styles.benefitsTitle}>Beneficios de la cuenta</Text>
        {['Progreso guardado en la nube', 'Push con fechas de tus convocatorias', 'Recupera datos en otro celular', 'Recomendaciones personalizadas'].map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>✅</Text>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.syncBtn} onPress={onSync} activeOpacity={0.85}>
        <Text style={styles.syncBtnText}>🔄 Sincronizar progreso ahora</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.85}>
        <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

function TelaDeslogado({ onCadastrar, onLogin }) {
  const [modo, setModo] = useState('opcoes');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCadastrar() {
    if (!nome.trim()) { Alert.alert('Nombre requerido', 'Escribe tu nombre.'); return; }
    if (!email.trim() || !email.includes('@')) { Alert.alert('Email inválido', 'Escribe un email válido.'); return; }
    setLoading(true);
    try {
      await onCadastrar(nome, email);
      Alert.alert('¡Cuenta creada!', 'Tu progreso se guardará automáticamente.');
    } catch { Alert.alert('Error', 'No fue posible crear la cuenta.'); }
    setLoading(false);
  }

  async function handleLogin() {
    if (!email.trim() || !email.includes('@')) { Alert.alert('Email inválido', 'Escribe un email válido.'); return; }
    setLoading(true);
    const result = await onLogin(email);
    if (!result.success) Alert.alert('Error', result.error);
    setLoading(false);
  }

  if (modo === 'opcoes') {
    return (
      <View>
        <View style={styles.heroBox}>
          <Text style={styles.heroEmoji}>👤</Text>
          <Text style={styles.heroTitle}>Crea tu cuenta gratis</Text>
          <Text style={styles.heroSub}>Guarda tu progreso, recibe recomendaciones personalizadas y nunca pierdas una fecha importante.</Text>
        </View>
        <View style={styles.benefitsBox}>
          {[
            { icon: '📊', text: 'Progreso de quizzes guardado en la nube' },
            { icon: '🔔', text: 'Push con fechas de inscripción y exámenes' },
            { icon: '🎯', text: 'Convocatorias recomendadas para tu perfil' },
            { icon: '📱', text: 'Recupera tus datos en otro celular' },
          ].map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => setModo('cadastrar')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Crear cuenta gratis</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setModo('login')} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.formTitle}>{modo === 'cadastrar' ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
      <Text style={styles.formSub}>{modo === 'cadastrar' ? 'Llena tus datos para comenzar' : 'Escribe tu email registrado'}</Text>
      {modo === 'cadastrar' && (
        <TextInput style={styles.input} placeholder="Tu nombre" placeholderTextColor="#9CA3AF" value={nome} onChangeText={setNome} autoCapitalize="words" />
      )}
      <TextInput style={styles.input} placeholder="tu@email.com" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TouchableOpacity style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} onPress={modo === 'cadastrar' ? handleCadastrar : handleLogin} activeOpacity={0.85} disabled={loading}>
        <Text style={styles.primaryBtnText}>{loading ? 'Espera...' : modo === 'cadastrar' ? 'Crear cuenta' : 'Entrar'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.switchBtn} onPress={() => setModo(modo === 'cadastrar' ? 'login' : 'cadastrar')}>
        <Text style={styles.switchBtnText}>{modo === 'cadastrar' ? 'Ya tengo cuenta → Entrar' : 'No tengo cuenta → Crear'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.switchBtn} onPress={() => setModo('opcoes')}>
        <Text style={[styles.switchBtnText, { color: '#9CA3AF' }]}>← Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CuentaScreen() {
  const navigation = useNavigation();
  const { voltar: voltarHome } = useVoltarComNPS();
  const { user, cadastrar, login, logout, syncProgressToFirestore } = useAuth();

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro? Tu progreso local se mantendrá.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress: logout, style: 'destructive' },
    ]);
  }

  async function handleSync() {
    await syncProgressToFirestore();
    Alert.alert('¡Sincronizado!', 'Tu progreso fue guardado en la nube.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AdBanner />
      <View style={styles.header}>
        <TouchableOpacity onPress={voltarHome} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user ? 'Mi Cuenta' : 'Entrar / Registrarse'}</Text>
        <View style={{ width: 60 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {user ? <TelaLogado user={user} onLogout={handleLogout} onSync={handleSync} /> : <TelaDeslogado onCadastrar={cadastrar} onLogin={login} />}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { fontSize: 15, color: '#1a5c2a', fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  heroBox: { alignItems: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 56, marginBottom: 10 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  benefitsBox: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  benefitsTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  benefitIcon: { fontSize: 18 },
  benefitText: { fontSize: 14, color: '#374151', flex: 1 },
  primaryBtn: { backgroundColor: '#1a5c2a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', elevation: 4, marginBottom: 10 },
  primaryBtnDisabled: { backgroundColor: '#9CA3AF', elevation: 0 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { borderWidth: 2, borderColor: '#1a5c2a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  secondaryBtnText: { color: '#1a5c2a', fontSize: 15, fontWeight: '700' },
  formTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 6 },
  formSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  input: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, fontSize: 16, color: '#111827', marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  switchBtn: { paddingVertical: 12, alignItems: 'center' },
  switchBtnText: { color: '#1a5c2a', fontSize: 14, fontWeight: '600' },
  profileCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20, elevation: 2 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1a5c2a', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFF' },
  profileName: { fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  profileSince: { fontSize: 12, color: '#9CA3AF' },
  syncBtn: { backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  syncBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  logoutBtn: { borderWidth: 1, borderColor: '#DC2626', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '700' },
});
