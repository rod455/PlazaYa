// src/components/NPSModal.js
// Banner NPS estilo Google Play In-App Review
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, Animated, Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.plazaya.mexico';
const MIN_SESSIONS = 2;
const COOLDOWN_DAYS = 3;
const STORAGE_KEY_LAST = '@nps:last_shown';
const STORAGE_KEY_SESSIONS = '@nps:session_count';
const STORAGE_KEY_DISMISSED = '@nps:permanently_dismissed';

const STARS = [1, 2, 3, 4, 5];

export async function incrementNPSSession() {
  try {
    const count = parseInt(await AsyncStorage.getItem(STORAGE_KEY_SESSIONS)) || 0;
    await AsyncStorage.setItem(STORAGE_KEY_SESSIONS, String(count + 1));
  } catch {}
}

export async function shouldShowNPS() {
  try {
    const dismissed = await AsyncStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissed === 'true') return false;
    const sessions = parseInt(await AsyncStorage.getItem(STORAGE_KEY_SESSIONS)) || 0;
    if (sessions < MIN_SESSIONS) return false;
    const lastShown = await AsyncStorage.getItem(STORAGE_KEY_LAST);
    if (lastShown) {
      const diff = Date.now() - parseInt(lastShown);
      if (diff / (1000 * 60 * 60 * 24) < COOLDOWN_DAYS) return false;
    }
    return true;
  } catch { return false; }
}

async function markNPSShown() {
  try { await AsyncStorage.setItem(STORAGE_KEY_LAST, String(Date.now())); } catch {}
}

export default function NPSModal({ visible, onDismiss }) {
  const [fase, setFase] = useState('rating');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      markNPSShown();
      setFase('rating'); setRating(0); setFeedback('');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }).start();
    } else { slideAnim.setValue(300); }
  }, [visible]);

  async function handleSubmitRating() {
    if (rating === 0) return;
    if (rating >= 4) {
      try { await Linking.openURL(PLAY_STORE_URL); } catch {}
      setFase('thanks');
      setTimeout(() => onDismiss(), 2000);
    } else { setFase('feedback'); }
  }

  async function handleSubmitFeedback() {
    try {
      const feedbacks = JSON.parse(await AsyncStorage.getItem('@nps:feedbacks') || '[]');
      feedbacks.push({ rating, feedback, timestamp: Date.now() });
      await AsyncStorage.setItem('@nps:feedbacks', JSON.stringify(feedbacks));
    } catch {}
    setFase('thanks');
    setTimeout(() => onDismiss(), 2000);
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
          {fase === 'rating' && (
            <>
              <Text style={styles.title}>¿Te gusta la app?</Text>
              <Text style={styles.subtitle}>¡Tu opinión nos ayuda a mejorar!</Text>
              <View style={styles.starsRow}>
                {STARS.map(star => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7} style={styles.starBtn}>
                    <Text style={[styles.starText, star <= rating && styles.starSelected]}>
                      {star <= rating ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingLabel}>
                  {rating <= 2 ? '¡Podemos mejorar!' : rating === 3 ? 'OK, ¡gracias!' : rating === 4 ? '¡Qué bien!' : '¡Excelente!'}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.primaryBtn, rating === 0 && styles.primaryBtnDisabled]}
                onPress={rating > 0 ? handleSubmitRating : null}
                activeOpacity={rating > 0 ? 0.85 : 1}
              >
                <Text style={[styles.primaryBtnText, rating === 0 && styles.primaryBtnTextDisabled]}>
                  {rating >= 4 ? 'Calificar en Play Store' : rating > 0 ? 'Enviar' : 'Selecciona una calificación'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDismiss} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Ahora no</Text>
              </TouchableOpacity>
            </>
          )}
          {fase === 'feedback' && (
            <>
              <Text style={styles.title}>¿Qué podemos mejorar?</Text>
              <Text style={styles.subtitle}>Tu retroalimentación es muy importante para nosotros.</Text>
              <TextInput style={styles.feedbackInput} placeholder="Cuéntanos qué podemos hacer mejor..." placeholderTextColor="#9CA3AF" value={feedback} onChangeText={setFeedback} multiline numberOfLines={4} textAlignVertical="top" />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitFeedback} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Enviar comentario</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDismiss} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Omitir</Text>
              </TouchableOpacity>
            </>
          )}
          {fase === 'thanks' && (
            <>
              <Text style={styles.thanksEmoji}>💚</Text>
              <Text style={styles.title}>¡Gracias!</Text>
              <Text style={styles.subtitle}>
                {rating >= 4 ? '¡Tu calificación hace toda la diferencia!' : 'Vamos a trabajar para mejorar tu experiencia.'}
              </Text>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32, alignItems: 'center', elevation: 10 },
  title: { fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  starBtn: { padding: 6 },
  starText: { fontSize: 40, color: '#D1D5DB' },
  starSelected: { color: '#F59E0B' },
  ratingLabel: { fontSize: 14, color: '#6B7280', fontWeight: '600', marginBottom: 16 },
  primaryBtn: { backgroundColor: '#1a5c2a', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 8, elevation: 3 },
  primaryBtnDisabled: { backgroundColor: '#D1D5DB', elevation: 0 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  primaryBtnTextDisabled: { color: '#9CA3AF' },
  secondaryBtn: { paddingVertical: 10 },
  secondaryBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
  feedbackInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', width: '100%', minHeight: 100, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  thanksEmoji: { fontSize: 48, marginBottom: 12 },
});
