import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import AdBanner from '../../components/AdBanner';
import { ADMOB_IDS } from '../../constants/data';

const STORAGE_KEYS = {
  QUIZZES_DONE: '@plazaya:quizzes_realizados',
  TOTAL_CORRECT: '@plazaya:quiz_diario_aciertos',
  TOTAL_ANSWERED: '@plazaya:quiz_diario_respondidos',
  STREAK: '@plazaya:quiz_diario_racha',
  CONVOCATORIAS_VIEWED: '@plazaya:convocatorias_vistas',
  QUIZ_HISTORY: '@plazaya:quiz_historico',
  TOTAL_QUIZ_CORRECT: '@plazaya:total_aciertos',
  TOTAL_QUIZ_ANSWERED: '@plazaya:total_respondidos',
};

const MiProgresoScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    quizzesDone: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    hitRate: 0,
    streak: 0,
    convocatoriasViewed: 0,
  });

  const { voltar: voltarHome } = useVoltarComNPS();

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      const [
        quizzesDone,
        dailyCorrect,
        dailyAnswered,
        streak,
        convocatoriasViewed,
        totalQuizCorrect,
        totalQuizAnswered,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.QUIZZES_DONE),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_CORRECT),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_ANSWERED),
        AsyncStorage.getItem(STORAGE_KEYS.STREAK),
        AsyncStorage.getItem(STORAGE_KEYS.CONVOCATORIAS_VIEWED),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_QUIZ_CORRECT),
        AsyncStorage.getItem(STORAGE_KEYS.TOTAL_QUIZ_ANSWERED),
      ]);

      const totalCorrect =
        parseInt(dailyCorrect || '0', 10) +
        parseInt(totalQuizCorrect || '0', 10);
      const totalAnswered =
        parseInt(dailyAnswered || '0', 10) +
        parseInt(totalQuizAnswered || '0', 10);
      const hitRate =
        totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

      setStats({
        quizzesDone: parseInt(quizzesDone || '0', 10),
        totalCorrect,
        totalAnswered,
        hitRate,
        streak: parseInt(streak || '0', 10),
        convocatoriasViewed: parseInt(convocatoriasViewed || '0', 10),
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color || '#1a5c2a' }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color: color || '#1a5c2a' }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5c2a" />
        <Text style={styles.loadingText}>Cargando tu progreso...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Mi Progreso</Text>
          <Text style={styles.subtitle}>
            Revisa tus estadísticas y sigue mejorando
          </Text>
        </View>

        {/* Racha */}
        <View style={styles.streakSection}>
          <View style={styles.streakContainer}>
            <Text style={styles.streakFireIcon}>🔥</Text>
            <Text style={styles.streakNumber}>{stats.streak}</Text>
            <Text style={styles.streakLabel}>
              {stats.streak === 1 ? 'día de racha' : 'días de racha'}
            </Text>
          </View>
        </View>

        {/* Estadísticas principales */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="📝"
            value={stats.quizzesDone}
            label="Quizzes realizados"
            color="#1a5c2a"
          />
          <StatCard
            icon="🎯"
            value={`${stats.hitRate}%`}
            label="Tasa de acierto"
            color="#FF6B35"
          />
          <StatCard
            icon="📋"
            value={stats.convocatoriasViewed}
            label="Convocatorias vistas"
            color="#1565C0"
          />
          <StatCard
            icon="✅"
            value={stats.totalCorrect}
            label="Aciertos totales"
            color="#2E7D32"
          />
        </View>

        {/* Detalle de respuestas */}
        <View style={styles.detailSection}>
          <Text style={styles.detailTitle}>Detalle de respuestas</Text>
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total de preguntas respondidas</Text>
              <Text style={styles.detailValue}>{stats.totalAnswered}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Respuestas correctas</Text>
              <Text style={[styles.detailValue, { color: '#1a5c2a' }]}>
                {stats.totalCorrect}
              </Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Respuestas incorrectas</Text>
              <Text style={[styles.detailValue, { color: '#D32F2F' }]}>
                {stats.totalAnswered - stats.totalCorrect}
              </Text>
            </View>

            {stats.totalAnswered > 0 && (
              <>
                <View style={styles.detailDivider} />
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${stats.hitRate}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressBarText}>{stats.hitRate}% de acierto</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('QuizGame')}
          >
            <Text style={styles.actionButtonIcon}>🧠</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Practicar más</Text>
              <Text style={styles.actionButtonSubtitle}>
                Sigue resolviendo quizzes para mejorar
              </Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cuenta')}
          >
            <Text style={styles.actionButtonIcon}>👤</Text>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonTitle}>Mi cuenta</Text>
              <Text style={styles.actionButtonSubtitle}>
                Administra tu perfil y preferencias
              </Text>
            </View>
            <Text style={styles.actionButtonArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AdBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a5c2a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  streakSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  streakContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  streakFireIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E65100',
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 15,
    color: '#555',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  progressBarContainer: {
    paddingTop: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1a5c2a',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 13,
    color: '#1a5c2a',
    fontWeight: '500',
    textAlign: 'right',
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtonIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  actionButtonArrow: {
    fontSize: 24,
    color: '#CCC',
    fontWeight: '300',
  },
});

export default MiProgresoScreen;
