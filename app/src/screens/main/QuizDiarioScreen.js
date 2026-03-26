import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { showInterstitial } from '../../services/adService';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import AdBanner from '../../components/AdBanner';
import { ADMOB_IDS } from '../../constants/data';

const STORAGE_KEYS = {
  LAST_ANSWER_DATE: '@plazaya:quiz_diario_last_date',
  STREAK: '@plazaya:quiz_diario_racha',
  TOTAL_CORRECT: '@plazaya:quiz_diario_aciertos',
  TOTAL_ANSWERED: '@plazaya:quiz_diario_respondidos',
};

const QuizDiarioScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [question, setQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useVoltarComNPS('QuizDiario');

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const getFormattedDate = () => {
    const today = new Date();
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return today.toLocaleDateString('es-MX', options);
  };

  const loadStreak = useCallback(async () => {
    try {
      const savedStreak = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
      if (savedStreak) {
        setStreak(parseInt(savedStreak, 10));
      }
    } catch (error) {
      console.error('Error al cargar racha:', error);
    }
  }, []);

  const checkIfAlreadyAnswered = useCallback(async () => {
    try {
      const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ANSWER_DATE);
      const today = getTodayKey();
      if (lastDate === today) {
        setAlreadyAnswered(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al verificar respuesta:', error);
      return false;
    }
  }, []);

  const fetchDailyQuestion = useCallback(async () => {
    try {
      setLoading(true);
      const today = getTodayKey();

      const { data, error } = await supabase
        .from('questoes')
        .select('*')
        .eq('data_quiz', today)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setQuestion(data);
      } else {
        const { data: randomData, error: randomError } = await supabase
          .from('questoes')
          .select('*')
          .limit(1)
          .order('id', { ascending: false });

        if (randomError) throw randomError;
        if (randomData && randomData.length > 0) {
          setQuestion(randomData[0]);
        }
      }
    } catch (error) {
      console.error('Error al obtener pregunta:', error);
      Alert.alert('Error', 'No se pudo cargar la pregunta del día. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadStreak();
      const answered = await checkIfAlreadyAnswered();
      if (!answered) {
        await fetchDailyQuestion();
      } else {
        setLoading(false);
      }
    };
    init();
  }, [loadStreak, checkIfAlreadyAnswered, fetchDailyQuestion]);

  const handleSelectOption = (index) => {
    if (confirmed || alreadyAnswered) return;
    setSelectedOption(index);
  };

  const handleConfirm = async () => {
    if (selectedOption === null || confirmed) return;

    const correct = selectedOption === question.resposta_correta;
    setIsCorrect(correct);
    setConfirmed(true);

    try {
      const today = getTodayKey();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_ANSWER_DATE, today);

      const totalAnswered = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_ANSWERED);
      const newTotal = (parseInt(totalAnswered || '0', 10) + 1).toString();
      await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_ANSWERED, newTotal);

      if (correct) {
        const totalCorrect = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_CORRECT);
        const newCorrect = (parseInt(totalCorrect || '0', 10) + 1).toString();
        await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_CORRECT, newCorrect);

        const newStreak = streak + 1;
        setStreak(newStreak);
        await AsyncStorage.setItem(STORAGE_KEYS.STREAK, newStreak.toString());
      } else {
        setStreak(0);
        await AsyncStorage.setItem(STORAGE_KEYS.STREAK, '0');
      }

      await showInterstitial();
    } catch (error) {
      console.error('Error al guardar respuesta:', error);
    }
  };

  const handleGoToQuiz = () => {
    navigation.navigate('QuizGame');
  };

  const getOptionStyle = (index) => {
    if (!confirmed) {
      return selectedOption === index ? styles.optionSelected : styles.option;
    }
    if (index === question.resposta_correta) {
      return styles.optionCorrect;
    }
    if (index === selectedOption && !isCorrect) {
      return styles.optionWrong;
    }
    return styles.option;
  };

  const getOptionTextStyle = (index) => {
    if (!confirmed) {
      return selectedOption === index ? styles.optionTextSelected : styles.optionText;
    }
    if (index === question.resposta_correta) {
      return styles.optionTextCorrect;
    }
    if (index === selectedOption && !isCorrect) {
      return styles.optionTextWrong;
    }
    return styles.optionText;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a5c2a" />
        <Text style={styles.loadingText}>Cargando pregunta del día...</Text>
      </View>
    );
  }

  if (alreadyAnswered) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Quiz del Día</Text>
            <Text style={styles.subtitle}>Pregunta de {getFormattedDate()}</Text>
          </View>

          <View style={styles.alreadyAnsweredContainer}>
            <Text style={styles.alreadyAnsweredIcon}>✅</Text>
            <Text style={styles.alreadyAnsweredTitle}>¡Ya respondiste hoy!</Text>
            <Text style={styles.alreadyAnsweredText}>
              Vuelve mañana para mantener tu racha.
            </Text>

            <View style={styles.streakContainer}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={styles.streakNumber}>{streak}</Text>
              <Text style={styles.streakLabel}>días de racha</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToQuiz}>
              <Text style={styles.primaryButtonText}>Jugar más quizzes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <AdBanner adUnitId={ADMOB_IDS.BANNER} />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay pregunta disponible hoy.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoToQuiz}>
            <Text style={styles.primaryButtonText}>Ir a los quizzes</Text>
          </TouchableOpacity>
        </View>
        <AdBanner adUnitId={ADMOB_IDS.BANNER} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Quiz del Día</Text>
          <Text style={styles.subtitle}>Pregunta de {getFormattedDate()}</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>🔥 Racha: {streak} días</Text>
          </View>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question.enunciado}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {question.alternativas &&
            question.alternativas.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={getOptionStyle(index)}
                onPress={() => handleSelectOption(index)}
                disabled={confirmed}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View
                    style={[
                      styles.optionLetter,
                      selectedOption === index && !confirmed && styles.optionLetterSelected,
                      confirmed && index === question.resposta_correta && styles.optionLetterCorrect,
                      confirmed && index === selectedOption && !isCorrect && index !== question.resposta_correta && styles.optionLetterWrong,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLetterText,
                        selectedOption === index && !confirmed && styles.optionLetterTextSelected,
                        confirmed && index === question.resposta_correta && styles.optionLetterTextCorrect,
                        confirmed && index === selectedOption && !isCorrect && index !== question.resposta_correta && styles.optionLetterTextWrong,
                      ]}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={getOptionTextStyle(index)}>{option}</Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>

        {!confirmed && (
          <TouchableOpacity
            style={[
              styles.confirmButton,
              selectedOption === null && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={selectedOption === null}
          >
            <Text style={styles.confirmButtonText}>Confirmar respuesta</Text>
          </TouchableOpacity>
        )}

        {confirmed && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultIcon}>{isCorrect ? '🎉' : '😔'}</Text>
            <Text
              style={[
                styles.resultTitle,
                isCorrect ? styles.resultTitleCorrect : styles.resultTitleWrong,
              ]}
            >
              {isCorrect ? '¡Acertaste!' : 'No fue esta vez...'}
            </Text>
            <Text style={styles.resultText}>
              {isCorrect
                ? `¡Excelente! Llevas una racha de ${streak} ${streak === 1 ? 'día' : 'días'}.`
                : 'No te preocupes, mañana tienes otra oportunidad.'}
            </Text>

            {question.explicacao && (
              <View style={styles.explanationContainer}>
                <Text style={styles.explanationTitle}>Explicación:</Text>
                <Text style={styles.explanationText}>{question.explicacao}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToQuiz}>
              <Text style={styles.primaryButtonText}>Jugar más quizzes</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AdBanner adUnitId={ADMOB_IDS.BANNER} />
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
    alignItems: 'center',
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
  streakBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  streakBadgeText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '600',
  },
  questionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  optionCorrect: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#1a5c2a',
  },
  optionWrong: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#D32F2F',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterSelected: {
    backgroundColor: '#FF6B35',
  },
  optionLetterCorrect: {
    backgroundColor: '#1a5c2a',
  },
  optionLetterWrong: {
    backgroundColor: '#D32F2F',
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  optionLetterTextSelected: {
    color: '#FFFFFF',
  },
  optionLetterTextCorrect: {
    color: '#FFFFFF',
  },
  optionLetterTextWrong: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  optionTextSelected: {
    fontSize: 15,
    color: '#E65100',
    flex: 1,
    fontWeight: '500',
  },
  optionTextCorrect: {
    fontSize: 15,
    color: '#1a5c2a',
    flex: 1,
    fontWeight: '500',
  },
  optionTextWrong: {
    fontSize: 15,
    color: '#D32F2F',
    flex: 1,
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#1a5c2a',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultTitleCorrect: {
    color: '#1a5c2a',
  },
  resultTitleWrong: {
    color: '#D32F2F',
  },
  resultText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  explanationContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a5c2a',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#1a5c2a',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyAnsweredContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  alreadyAnsweredIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  alreadyAnsweredTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a5c2a',
    marginBottom: 8,
  },
  alreadyAnsweredText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  streakContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  streakIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E65100',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default QuizDiarioScreen;
