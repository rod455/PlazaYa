import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Animated,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import { showInterstitial } from '../../services/adService';
import AdBanner from '../../components/AdBanner';
import { useQuiz } from '../../context/QuizContext';
import { formatarValor } from '../../utils/salarioUtils';
import { ADMOB_IDS } from '../../constants/data';

const CARGOS = [
  {
    id: 'auditor_sat',
    titulo: 'Auditor SAT',
    organo: 'SAT',
    bruto: 45000,
    liquido: 38000,
    icon: 'calculator-variant',
  },
  {
    id: 'juez_federal',
    titulo: 'Juez Federal',
    organo: 'Poder Judicial',
    bruto: 80000,
    liquido: 65000,
    icon: 'gavel',
  },
  {
    id: 'guardia_nacional',
    titulo: 'Guardia Nacional',
    organo: 'SSPC',
    bruto: 17000,
    liquido: 15000,
    icon: 'shield-account',
  },
  {
    id: 'medico_imss',
    titulo: 'Médico IMSS',
    organo: 'IMSS',
    bruto: 28000,
    liquido: 23000,
    icon: 'stethoscope',
  },
  {
    id: 'profesor_sep',
    titulo: 'Profesor SEP',
    organo: 'SEP',
    bruto: 14000,
    liquido: 12000,
    icon: 'school',
  },
  {
    id: 'analista_pjf',
    titulo: 'Analista Poder Judicial',
    organo: 'Poder Judicial',
    bruto: 30000,
    liquido: 25000,
    icon: 'briefcase-search',
  },
  {
    id: 'policia_municipal',
    titulo: 'Policía Municipal',
    organo: 'Municipio',
    bruto: 12000,
    liquido: 10500,
    icon: 'police-badge',
  },
  {
    id: 'ingeniero_cfe',
    titulo: 'Ingeniero CFE',
    organo: 'CFE',
    bruto: 25000,
    liquido: 21000,
    icon: 'flash',
  },
  {
    id: 'enfermero_issste',
    titulo: 'Enfermero ISSSTE',
    organo: 'ISSSTE',
    bruto: 15000,
    liquido: 13000,
    icon: 'needle',
  },
  {
    id: 'director_general',
    titulo: 'Director General',
    organo: 'Administración Federal',
    bruto: 70000,
    liquido: 55000,
    icon: 'account-tie',
  },
];

const SimuladorSalarioScreen = ({ navigation }) => {
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adShown, setAdShown] = useState(false);

  const animValue = useRef(new Animated.Value(0)).current;
  const { voltarComNPS } = useVoltarComNPS();
  const { quizData } = useQuiz();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      voltarComNPS(e, navigation);
    });
    return unsubscribe;
  }, [navigation, voltarComNPS]);

  useEffect(() => {
    if (showDetails) {
      Animated.spring(animValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      animValue.setValue(0);
    }
  }, [showDetails]);

  const handleSelectCargo = async (cargo) => {
    setSelectedCargo(cargo);

    if (!adShown) {
      try {
        await showInterstitial();
        setAdShown(true);
      } catch (error) {
        console.error('Error al mostrar anuncio:', error);
      }
    }

    setShowDetails(true);
  };

  const handleShare = async () => {
    if (!selectedCargo) return;
    try {
      await Share.share({
        message: `Descubrí que un ${selectedCargo.titulo} gana ${formatarValor(
          selectedCargo.bruto,
          'MXN'
        )} brutos al mes en México. ¡Simula tu salario en PlazaYa!`,
      });
    } catch (error) {
      console.error('Error al compartir:', error);
    }
  };

  const calcularAguinaldo = (bruto) => {
    return Math.round((bruto / 30) * 40);
  };

  const calcularPrimaVacacional = (bruto) => {
    return Math.round(((bruto / 30) * 20) * 0.25);
  };

  const calcularFondoAhorro = (bruto) => {
    return Math.round(bruto * 0.065);
  };

  const calcularIngresoAnual = (cargo) => {
    const salarioAnual = cargo.liquido * 12;
    const aguinaldo = calcularAguinaldo(cargo.bruto);
    const prima = calcularPrimaVacacional(cargo.bruto);
    return salarioAnual + aguinaldo + prima;
  };

  const renderCargoCard = (cargo) => (
    <TouchableOpacity
      key={cargo.id}
      style={[
        styles.cargoCard,
        selectedCargo?.id === cargo.id && styles.cargoCardSelected,
      ]}
      onPress={() => handleSelectCargo(cargo)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.cargoIconContainer,
          selectedCargo?.id === cargo.id && styles.cargoIconContainerSelected,
        ]}
      >
        <Icon
          name={cargo.icon}
          size={24}
          color={selectedCargo?.id === cargo.id ? '#fff' : '#1a5c2a'}
        />
      </View>
      <View style={styles.cargoInfo}>
        <Text style={styles.cargoTitulo}>{cargo.titulo}</Text>
        <Text style={styles.cargoOrgano}>{cargo.organo}</Text>
      </View>
      <View style={styles.cargoSalario}>
        <Text style={styles.cargoSalarioValue}>
          {formatarValor(cargo.liquido, 'MXN')}
        </Text>
        <Text style={styles.cargoSalarioLabel}>neto/mes</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBenefitItem = (icon, label, value, highlight = false) => (
    <View style={styles.benefitItem} key={label}>
      <View style={styles.benefitLeft}>
        <Icon name={icon} size={20} color={highlight ? '#f0a500' : '#1a5c2a'} />
        <Text style={styles.benefitLabel}>{label}</Text>
      </View>
      <Text
        style={[styles.benefitValue, highlight && styles.benefitValueHighlight]}
      >
        {value}
      </Text>
    </View>
  );

  const renderDetails = () => {
    if (!selectedCargo) return null;

    const aguinaldo = calcularAguinaldo(selectedCargo.bruto);
    const primaVacacional = calcularPrimaVacacional(selectedCargo.bruto);
    const fondoAhorro = calcularFondoAhorro(selectedCargo.bruto);
    const ingresoAnual = calcularIngresoAnual(selectedCargo);
    const descuentos = selectedCargo.bruto - selectedCargo.liquido;

    return (
      <Animated.View
        style={[
          styles.detailsContainer,
          {
            opacity: animValue,
            transform: [
              {
                translateY: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.detailsHeader}>
          <View>
            <Text style={styles.detailsTitle}>{selectedCargo.titulo}</Text>
            <Text style={styles.detailsOrgano}>{selectedCargo.organo}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
            <Icon name="share-variant" size={20} color="#1a5c2a" />
          </TouchableOpacity>
        </View>

        <View style={styles.salarioBoxes}>
          <View style={styles.salarioBox}>
            <Text style={styles.salarioBoxLabel}>Salario Bruto</Text>
            <Text style={styles.salarioBoxValue}>
              {formatarValor(selectedCargo.bruto, 'MXN')}
            </Text>
            <Text style={styles.salarioBoxPeriod}>mensual</Text>
          </View>
          <View style={styles.salarioBoxDivider} />
          <View style={styles.salarioBox}>
            <Text style={styles.salarioBoxLabel}>Salario Neto</Text>
            <Text style={[styles.salarioBoxValue, styles.salarioBoxValueNet]}>
              {formatarValor(selectedCargo.liquido, 'MXN')}
            </Text>
            <Text style={styles.salarioBoxPeriod}>mensual</Text>
          </View>
        </View>

        <View style={styles.descuentosBar}>
          <Icon name="information-outline" size={16} color="#c0392b" />
          <Text style={styles.descuentosText}>
            Descuentos (ISR, ISSSTE/IMSS, etc.):{' '}
            <Text style={styles.descuentosValue}>
              -{formatarValor(descuentos, 'MXN')}
            </Text>
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsSectionTitle}>
            Prestaciones y Beneficios
          </Text>

          {renderBenefitItem(
            'gift',
            'Aguinaldo (40 días)',
            formatarValor(aguinaldo, 'MXN'),
            true
          )}
          {renderBenefitItem(
            'beach',
            'Prima Vacacional (25%)',
            formatarValor(primaVacacional, 'MXN')
          )}
          {renderBenefitItem(
            'piggy-bank',
            'Fondo de Ahorro (6.5%)',
            formatarValor(fondoAhorro, 'MXN') + '/mes'
          )}
          {renderBenefitItem(
            'hospital-box',
            'ISSSTE/IMSS',
            'Incluido',
          )}
          {renderBenefitItem(
            'shield-check',
            'Seguro de Vida',
            'Incluido',
          )}
          {renderBenefitItem(
            'home-city',
            'Crédito FOVISSSTE/INFONAVIT',
            'Disponible',
          )}
          {renderBenefitItem(
            'calendar-check',
            '20 días de vacaciones',
            'Anuales',
          )}
          {renderBenefitItem(
            'school-outline',
            'Estímulos por capacitación',
            'Variable',
          )}
        </View>

        <View style={styles.anualBox}>
          <View style={styles.anualBoxHeader}>
            <Icon name="chart-line" size={24} color="#f0a500" />
            <Text style={styles.anualBoxTitle}>Ingreso Anual Estimado</Text>
          </View>
          <Text style={styles.anualBoxValue}>
            {formatarValor(ingresoAnual, 'MXN')}
          </Text>
          <Text style={styles.anualBoxSubtitle}>
            Incluye 12 meses de salario neto + aguinaldo + prima vacacional
          </Text>
        </View>

        <View style={styles.disclaimerBox}>
          <Icon name="alert-circle-outline" size={16} color="#999" />
          <Text style={styles.disclaimerText}>
            Los valores son estimados y pueden variar según el tabulador,
            antigüedad, zona económica y tipo de contratación. Consulta la
            convocatoria oficial para información precisa.
          </Text>
        </View>
      </Animated.View>
    );
  };

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
        <Text style={styles.headerTitle}>Simulador de Salario</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Icon name="cash-multiple" size={40} color="#1a5c2a" />
          <Text style={styles.introTitle}>
            ¿Cuánto gana un servidor público?
          </Text>
          <Text style={styles.introSubtitle}>
            Selecciona un cargo para conocer el salario estimado, prestaciones y
            beneficios del servicio público mexicano.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Selecciona un cargo</Text>

        {CARGOS.map(renderCargoCard)}

        <AdBanner adUnitId={ADMOB_IDS.banner} />

        {showDetails && renderDetails()}

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
  introSection: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  cargoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e8e8e8',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cargoCardSelected: {
    borderColor: '#1a5c2a',
    backgroundColor: '#f0f8f2',
  },
  cargoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cargoIconContainerSelected: {
    backgroundColor: '#1a5c2a',
  },
  cargoInfo: {
    flex: 1,
  },
  cargoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cargoOrgano: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  cargoSalario: {
    alignItems: 'flex-end',
  },
  cargoSalarioValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a5c2a',
  },
  cargoSalarioLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 1,
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  detailsOrgano: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  shareBtn: {
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
  },
  salarioBoxes: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 12,
  },
  salarioBox: {
    flex: 1,
    alignItems: 'center',
  },
  salarioBoxDivider: {
    width: 1,
    backgroundColor: '#e8e8e8',
    marginHorizontal: 16,
  },
  salarioBoxLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    marginBottom: 6,
  },
  salarioBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
  },
  salarioBoxValueNet: {
    color: '#1a5c2a',
  },
  salarioBoxPeriod: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  descuentosBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  descuentosText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  descuentosValue: {
    fontWeight: '700',
    color: '#c0392b',
  },
  benefitsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 16,
  },
  benefitsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  benefitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  benefitLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  benefitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a5c2a',
  },
  benefitValueHighlight: {
    color: '#f0a500',
  },
  anualBox: {
    backgroundColor: '#1a5c2a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  anualBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  anualBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c8e6c9',
  },
  anualBoxValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  anualBoxSubtitle: {
    fontSize: 12,
    color: '#a5d6a7',
    textAlign: 'center',
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#999',
    flex: 1,
    lineHeight: 16,
  },
});

export default SimuladorSalarioScreen;
