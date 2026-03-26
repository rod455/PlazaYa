import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import { showInterstitial } from '../../services/adService';
import AdBanner from '../../components/AdBanner';
import { useQuiz } from '../../context/QuizContext';
import { fetchConvocatoriasFiltradas } from '../../services/convocatoriasApi';
import { formatarValor } from '../../utils/salarioUtils';
import { ADMOB_IDS, ESTADOS_MEXICO } from '../../constants/data';

const ESCOLARIDADES = [
  { id: 'secundaria', label: 'Secundaria' },
  { id: 'preparatoria', label: 'Preparatoria/Bachillerato' },
  { id: 'tecnico', label: 'Técnico/TSU' },
  { id: 'licenciatura', label: 'Licenciatura' },
  { id: 'posgrado', label: 'Maestría/Doctorado' },
];

const AREAS = [
  { id: 'seguridad', label: 'Seguridad Pública', icon: 'shield-account' },
  { id: 'sat', label: 'SAT/Fiscal', icon: 'calculator-variant' },
  { id: 'salud', label: 'Salud', icon: 'hospital-box' },
  { id: 'educacion', label: 'Educación', icon: 'school' },
  { id: 'judicial', label: 'Poder Judicial', icon: 'gavel' },
  { id: 'administrativo', label: 'Administrativo', icon: 'briefcase' },
  { id: 'ti', label: 'TI', icon: 'laptop' },
];

const EncontrarConvocatoriaScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [escolaridad, setEscolaridad] = useState(null);
  const [area, setArea] = useState(null);
  const [estado, setEstado] = useState(null);
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const { voltarComNPS } = useVoltarComNPS();
  const { quizData } = useQuiz();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      voltarComNPS(e, navigation);
    });
    return unsubscribe;
  }, [navigation, voltarComNPS]);

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

  const handleSearch = async () => {
    setLoading(true);
    try {
      await showInterstitial();
      const results = await fetchConvocatoriasFiltradas({
        escolaridad,
        area,
        estado,
      });
      setConvocatorias(results.slice(0, 3));
      setShowResults(true);
    } catch (error) {
      console.error('Error al buscar convocatorias:', error);
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
              <Icon name="check" size={16} color="#fff" />
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
      <Text style={styles.stepTitle}>¿Cuál es tu escolaridad?</Text>
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
      <Text style={styles.stepTitle}>¿Qué área te interesa?</Text>
      <Text style={styles.stepSubtitle}>
        Elige el área en la que deseas trabajar.
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
            <Icon
              name={item.icon}
              size={28}
              color={area === item.id ? '#fff' : '#1a5c2a'}
            />
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
      <Text style={styles.stepTitle}>¿En qué estado buscas?</Text>
      <Text style={styles.stepSubtitle}>
        Selecciona el estado donde quieres trabajar.
      </Text>
      <ScrollView
        style={styles.estadosList}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {ESTADOS_MEXICO.map((item) => (
          <TouchableOpacity
            key={item.id || item.sigla || item.label}
            style={[
              styles.optionCard,
              estado === (item.id || item.sigla) && styles.optionCardSelected,
            ]}
            onPress={() => setEstado(item.id || item.sigla)}
            activeOpacity={0.7}
          >
            <View style={styles.optionRadio}>
              {estado === (item.id || item.sigla) && (
                <View style={styles.optionRadioInner} />
              )}
            </View>
            <Text
              style={[
                styles.optionLabel,
                estado === (item.id || item.sigla) &&
                  styles.optionLabelSelected,
              ]}
            >
              {item.label || item.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderConvocatoriaCard = ({ item }) => (
    <TouchableOpacity
      style={styles.convocatoriaCard}
      onPress={() =>
        navigation.navigate('ConvocatoriaDetalles', {
          convocatoriaId: item.id,
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.convocatoriaHeader}>
        <View style={styles.convocatoriaBadge}>
          <Text style={styles.convocatoriaBadgeText}>
            {item.organo || 'Gobierno'}
          </Text>
        </View>
        {item.salario_hasta && (
          <Text style={styles.convocatoriaSalario}>
            Hasta {formatarValor(item.salario_hasta, 'MXN')}
          </Text>
        )}
      </View>
      <Text style={styles.convocatoriaTitulo} numberOfLines={2}>
        {item.titulo}
      </Text>
      <View style={styles.convocatoriaInfo}>
        <View style={styles.convocatoriaInfoItem}>
          <Icon name="map-marker" size={14} color="#666" />
          <Text style={styles.convocatoriaInfoText}>
            {item.estado || 'Nacional'}
          </Text>
        </View>
        <View style={styles.convocatoriaInfoItem}>
          <Icon name="account-group" size={14} color="#666" />
          <Text style={styles.convocatoriaInfoText}>
            {item.plazas || '—'} plazas
          </Text>
        </View>
      </View>
      <View style={styles.convocatoriaFooter}>
        <Text style={styles.convocatoriaFecha}>
          <Icon name="calendar" size={12} color="#1a5c2a" />{' '}
          {item.fecha_limite || 'Abierta'}
        </Text>
        <Icon name="chevron-right" size={20} color="#1a5c2a" />
      </View>
    </TouchableOpacity>
  );

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Icon name="check-circle" size={48} color="#1a5c2a" />
        <Text style={styles.resultsTitle}>
          ¡Encontramos convocatorias para ti!
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
          <Icon name="magnify-close" size={48} color="#999" />
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
        <Icon name="arrow-right" size={18} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetBtn}
        onPress={() => {
          setStep(1);
          setEscolaridad(null);
          setArea(null);
          setEstado(null);
          setConvocatorias([]);
          setShowResults(false);
        }}
        activeOpacity={0.7}
      >
        <Icon name="refresh" size={18} color="#1a5c2a" />
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
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
        >
          <Icon name="arrow-left" size={24} color="#fff" />
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
                Área
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
                  <Icon name="arrow-left" size={18} color="#1a5c2a" />
                  <Text style={styles.backBtnText}>Anterior</Text>
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
                <Icon
                  name={step === 3 ? 'magnify' : 'arrow-right'}
                  size={18}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </>
        )}

        <AdBanner adUnitId={ADMOB_IDS.banner} />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 14 : 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerBackBtn: {
    padding: 4,
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
    marginLeft: 6,
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
  resultsContainer: {
    marginBottom: 16,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
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
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 12,
    gap: 6,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5c2a',
  },
});

export default EncontrarConvocatoriaScreen;
