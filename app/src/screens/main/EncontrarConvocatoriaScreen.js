import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  StatusBar,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import { showInterstitial } from '../../services/adService';
import AdBanner from '../../components/AdBanner';
import { useQuiz } from '../../context/QuizContext';
import { fetchConvocatoriasFiltradas } from '../../services/convocatoriasApi';
import { formatarValor } from '../../utils/salarioUtils';
import { ADMOB_IDS, ESTADOS_MEXICO } from '../../constants/data';

const ESCOLARIDADES = [
  { id: 'secundaria', label: 'Secundaria' },
  { id: 'preparatoria', label: 'Preparatoria' },
  { id: 'tecnico', label: 'Tecnico/TSU' },
  { id: 'licenciatura', label: 'Licenciatura' },
  { id: 'maestria', label: 'Maestria' },
];

const AREAS = [
  { id: 'seguridad', label: 'Seguridad', emoji: '\u{1F46E}' },
  { id: 'sat', label: 'SAT/Fiscal', emoji: '\u{1F4CB}' },
  { id: 'salud', label: 'Salud', emoji: '\u{1F3E5}' },
  { id: 'educacion', label: 'Educacion', emoji: '\u{1F4DA}' },
  { id: 'judicial', label: 'Poder Judicial', emoji: '\u2696\uFE0F' },
  { id: 'administrativo', label: 'Administrativo', emoji: '\u{1F3DB}\uFE0F' },
  { id: 'ti', label: 'TI', emoji: '\u{1F4BB}' },
];

const EncontrarConvocatoriaScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [escolaridad, setEscolaridad] = useState(null);
  const [area, setArea] = useState(null);
  const [estado, setEstado] = useState(null);
  const [searchEstado, setSearchEstado] = useState('');
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { voltar } = useVoltarComNPS();
  const { answers, setAnswer, resetAnswers } = useQuiz();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      voltar();
    });
    return unsubscribe;
  }, [navigation, voltar]);

  const filteredEstados = useMemo(() => {
    if (!searchEstado.trim()) return ESTADOS_MEXICO;
    const term = searchEstado.toLowerCase().trim();
    return ESTADOS_MEXICO.filter(
      (item) =>
        item.nome.toLowerCase().includes(term) ||
        item.uf.toLowerCase().includes(term),
    );
  }, [searchEstado]);

  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSearch();
    }
  }, [step, escolaridad, area, estado]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const handleSearch = () => {
    setLoading(true);

    const rewarded = RewardedAd.createForAdRequest(ADMOB_IDS.REWARDED);

    const onEarned = () => {
      // User earned reward — proceed to fetch results
    };

    const onLoaded = () => {
      rewarded.show();
    };

    const onClosed = () => {
      cleanup();
      doFetch();
    };

    const onError = () => {
      cleanup();
      doFetch();
    };

    const cleanup = () => {
      try {
        subEarned.remove();
        subLoaded.remove();
        subClosed.remove();
        subError.remove();
      } catch (_) {}
    };

    const subEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      onEarned,
    );
    const subLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      onLoaded,
    );
    const subClosed = rewarded.addAdEventListener('closed', onClosed);
    const subError = rewarded.addAdEventListener('error', onError);

    rewarded.load();

    // Timeout: if ad doesn't load in 8s, proceed anyway
    setTimeout(() => {
      cleanup();
      if (!showResults) {
        doFetch();
      }
    }, 8000);
  };

  const doFetch = async () => {
    try {
      const results = await fetchConvocatoriasFiltradas({
        escolaridad,
        area,
        estado,
      });
      setConvocatorias(results.slice(0, 3));
      setShowResults(true);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = () => {
    if (step === 1) return escolaridad !== null;
    if (step === 2) return area !== null;
    if (step === 3) return estado !== null;
    return false;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepContainer}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepRow}>
          <View
            style={[
              styles.stepCircle,
              s <= step && styles.stepCircleActive,
              s < step && styles.stepCircleCompleted,
            ]}
          >
            {s < step ? (
              <Text style={styles.checkMark}>{'\u2713'}</Text>
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  s <= step && styles.stepNumberActive,
                ]}
              >
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View
              style={[styles.stepLine, s < step && styles.stepLineActive]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{'\u00BFCu\u00E1l es tu escolaridad?'}</Text>
      <Text style={styles.stepSubtitle}>
        Selecciona tu nivel de estudios para encontrar convocatorias adecuadas.
      </Text>
      {ESCOLARIDADES.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.optionCard,
            escolaridad === item.id && styles.optionCardSelected,
          ]}
          onPress={() => setEscolaridad(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.optionRadio}>
            {escolaridad === item.id && (
              <View style={styles.optionRadioInner} />
            )}
          </View>
          <Text
            style={[
              styles.optionLabel,
              escolaridad === item.id && styles.optionLabelSelected,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{'\u00BFQu\u00E9 \u00E1rea te interesa?'}</Text>
      <Text style={styles.stepSubtitle}>
        Elige el area en la que deseas trabajar.
      </Text>
      <View style={styles.areasGrid}>
        {AREAS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.areaCard,
              area === item.id && styles.areaCardSelected,
            ]}
            onPress={() => setArea(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.areaEmoji}>{item.emoji}</Text>
            <Text
              style={[
                styles.areaLabel,
                area === item.id && styles.areaLabelSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{'\u00BFEn qu\u00E9 estado buscas?'}</Text>
      <Text style={styles.stepSubtitle}>
        Selecciona el estado donde quieres trabajar.
      </Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar estado..."
        placeholderTextColor="#999"
        value={searchEstado}
        onChangeText={setSearchEstado}
      />
      <ScrollView
        style={styles.estadosList}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {filteredEstados.map((item) => (
          <TouchableOpacity
            key={item.uf}
            style={[
              styles.optionCard,
              estado === item.uf && styles.optionCardSelected,
            ]}
            onPress={() => setEstado(item.uf)}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              {estado === item.uf && (
                <View style={styles.optionRadioInner} />
              )}
            </View>
            <Text
              style={[
                styles.optionLabel,
                estado === item.uf && styles.optionLabelSelected,
              ]}
            >
              {item.nome}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderConvocatoriaCard = ({ item }) => {
    const salarioStr = formatarValor(item.salario);
    return (
      <TouchableOpacity
        style={styles.convocatoriaCard}
        onPress={() =>
          navigation.navigate('ConvocatoriaDetalles', { concurso: item })
        }
        activeOpacity={0.7}
      >
        <View style={styles.convocatoriaHeader}>
          <View style={styles.convocatoriaBadge}>
            <Text style={styles.convocatoriaBadgeText}>
              {item.orgao || 'Gobierno'}
            </Text>
          </View>
          {salarioStr && (
            <Text style={styles.convocatoriaSalario}>
              Hasta {salarioStr}
            </Text>
          )}
        </View>
        <Text style={styles.convocatoriaTitulo} numberOfLines={2}>
          {item.titulo}
        </Text>
        <View style={styles.convocatoriaInfo}>
          <View style={styles.convocatoriaInfoItem}>
            <Text style={styles.convocatoriaInfoIcon}>{'\uD83D\uDCCD'}</Text>
            <Text style={styles.convocatoriaInfoText}>
              {item.uf || 'Nacional'}
            </Text>
          </View>
          <View style={styles.convocatoriaInfoItem}>
            <Text style={styles.convocatoriaInfoIcon}>{'\uD83D\uDC65'}</Text>
            <Text style={styles.convocatoriaInfoText}>
              {item.vagas || '\u2014'} plazas
            </Text>
          </View>
        </View>
        <View style={styles.convocatoriaFooter}>
          <Text style={styles.convocatoriaFecha}>
            {'\uD83D\uDCC5'} {item.fimInscricoes || 'Abierta'}
          </Text>
          <Text style={styles.chevron}>{'\u203A'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsIcon}>{'\u2705'}</Text>
        <Text style={styles.resultsTitle}>
          {'Encontramos convocatorias para ti!'}
        </Text>
        <Text style={styles.resultsSubtitle}>
          Basadas en tu perfil, estas son las mejores opciones.
        </Text>
      </View>

      {convocatorias.length > 0 ? (
        <FlatList
          data={convocatorias}
          renderItem={renderConvocatoriaCard}
          keyExtractor={(item) => item.id?.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.convocatoriasList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{'\uD83D\uDD0D'}</Text>
          <Text style={styles.emptyText}>
            No encontramos convocatorias con esos filtros. Intenta cambiar tus
            preferencias.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.verTodasBtn}
        onPress={() =>
          navigation.navigate('TodasConvocatorias', {
            escolaridad,
            area,
            estado,
          })
        }
        activeOpacity={0.7}
      >
        <Text style={styles.verTodasBtnText}>Ver todas las convocatorias</Text>
        <Text style={styles.btnArrow}>{'\u2192'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetBtn}
        onPress={() => {
          setStep(1);
          setEscolaridad(null);
          setArea(null);
          setEstado(null);
          setSearchEstado('');
          setConvocatorias([]);
          setShowResults(false);
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.resetBtnIcon}>{'\uD83D\uDD04'}</Text>
        <Text style={styles.resetBtnText}>Buscar de nuevo</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor="#1a5c2a" barStyle="light-content" />
        <ActivityIndicator size="large" color="#1a5c2a" />
        <Text style={styles.loadingText}>
          Buscando convocatorias ideales para ti...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a5c2a" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => voltar()}
          style={styles.headerBackBtn}
        >
          <Text style={styles.headerBackText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Encontrar Convocatoria</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showResults ? (
          renderResults()
        ) : (
          <>
            {renderStepIndicator()}

            <View style={styles.stepLabels}>
              <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>
                Escolaridad
              </Text>
              <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>
                Area
              </Text>
              <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>
                Estado
              </Text>
            </View>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <View style={styles.navigationBtns}>
              {step > 1 && (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backBtnText}>{'\u2190'} Anterior</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  !canAdvance() && styles.nextBtnDisabled,
                  step === 1 && { flex: 1 },
                ]}
                onPress={handleNext}
                disabled={!canAdvance()}
                activeOpacity={0.7}
              >
                <Text style={styles.nextBtnText}>
                  {step === 3 ? 'Buscar Convocatorias' : 'Siguiente'}
                </Text>
                <Text style={styles.nextBtnIcon}>
                  {step === 3 ? '\uD83D\uDD0D' : '\u2192'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#1a5c2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerBackBtn: {
    padding: 4,
  },
  headerBackText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#1a5c2a',
  },
  stepCircleCompleted: {
    backgroundColor: '#1a5c2a',
  },
  checkMark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLine: {
    width: 40,
    height: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#1a5c2a',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#1a5c2a',
    fontWeight: '700',
  },
  stepContent: {
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e8e8e8',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionCardSelected: {
    borderColor: '#1a5c2a',
    backgroundColor: '#f0f8f2',
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1a5c2a',
  },
  optionLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  optionLabelSelected: {
    color: '#1a5c2a',
    fontWeight: '700',
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  areaCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8e8e8',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  areaCardSelected: {
    borderColor: '#1a5c2a',
    backgroundColor: '#1a5c2a',
  },
  areaEmoji: {
    fontSize: 28,
  },
  areaLabel: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  areaLabelSelected: {
    color: '#fff',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    color: '#333',
  },
  estadosList: {
    maxHeight: 320,
  },
  navigationBtns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#1a5c2a',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a5c2a',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a5c2a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: '#a0c4a8',
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  nextBtnIcon: {
    fontSize: 16,
    color: '#fff',
  },
  resultsContainer: {
    marginBottom: 16,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsIcon: {
    fontSize: 48,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
    textAlign: 'center',
  },
  resultsSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  convocatoriasList: {
    gap: 12,
  },
  convocatoriaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1a5c2a',
  },
  convocatoriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  convocatoriaBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  convocatoriaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a5c2a',
    textTransform: 'uppercase',
  },
  convocatoriaSalario: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0a500',
  },
  convocatoriaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    lineHeight: 22,
  },
  convocatoriaInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  convocatoriaInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  convocatoriaInfoIcon: {
    fontSize: 14,
  },
  convocatoriaInfoText: {
    fontSize: 12,
    color: '#666',
  },
  convocatoriaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  convocatoriaFecha: {
    fontSize: 12,
    color: '#1a5c2a',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    color: '#1a5c2a',
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  verTodasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a5c2a',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    gap: 8,
  },
  verTodasBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  btnArrow: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    gap: 6,
  },
  resetBtnIcon: {
    fontSize: 16,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5c2a',
  },
});

export default EncontrarConvocatoriaScreen;
