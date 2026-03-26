import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import { showInterstitial } from '../../services/adService';
import AdBanner from '../../components/AdBanner';
import { useQuiz } from '../../context/QuizContext';
import { formatarValor } from '../../utils/salarioUtils';

const formatMXN = (val) => `$${Number(val).toLocaleString('es-MX')} MXN`;

const CARGOS = [
  {
    id: 'auditor_sat',
    titulo: 'Auditor SAT',
    organo: 'SAT',
    bruto: 60000,
    liquido: 45000,
    emoji: '\uD83D\uDCCA',
    competencia: 'Alta',
    preparacion: '6-12 meses',
    jubilacion: 'A los 60 años con 30 años de servicio',
  },
  {
    id: 'juez_federal',
    titulo: 'Juez Federal',
    organo: 'Poder Judicial',
    bruto: 80000,
    liquido: 60000,
    emoji: '\u2696\uFE0F',
    competencia: 'Muy alta',
    preparacion: '2-4 años',
    jubilacion: 'A los 65 años con 30 años de servicio',
  },
  {
    id: 'medico_imss',
    titulo: 'Médico IMSS',
    organo: 'IMSS',
    bruto: 28000,
    liquido: 22000,
    emoji: '\uD83E\uDE7A',
    competencia: 'Alta',
    preparacion: '6-12 meses',
    jubilacion: 'A los 60 años con 28 años de servicio',
  },
  {
    id: 'profesor_sep',
    titulo: 'Profesor SEP',
    organo: 'SEP',
    bruto: 14000,
    liquido: 11500,
    emoji: '\uD83D\uDCDA',
    competencia: 'Media',
    preparacion: '3-6 meses',
    jubilacion: 'A los 60 años con 28 años de servicio',
  },
  {
    id: 'guardia_nacional',
    titulo: 'Guardia Nacional',
    organo: 'SSPC',
    bruto: 17000,
    liquido: 14500,
    emoji: '\uD83D\uDEE1\uFE0F',
    competencia: 'Media',
    preparacion: '3-6 meses',
    jubilacion: 'A los 55 años con 20 años de servicio',
  },
  {
    id: 'analista_pjf',
    titulo: 'Analista Poder Judicial',
    organo: 'Poder Judicial',
    bruto: 35000,
    liquido: 27000,
    emoji: '\uD83D\uDCBC',
    competencia: 'Alta',
    preparacion: '6-12 meses',
    jubilacion: 'A los 65 años con 30 años de servicio',
  },
  {
    id: 'ingeniero_cfe',
    titulo: 'Ingeniero CFE',
    organo: 'CFE',
    bruto: 25000,
    liquido: 20000,
    emoji: '\u26A1',
    competencia: 'Media-Alta',
    preparacion: '3-6 meses',
    jubilacion: 'A los 60 años con 28 años de servicio',
  },
  {
    id: 'enfermero_issste',
    titulo: 'Enfermero ISSSTE',
    organo: 'ISSSTE',
    bruto: 15000,
    liquido: 12500,
    emoji: '\uD83C\uDFE5',
    competencia: 'Media',
    preparacion: '3-6 meses',
    jubilacion: 'A los 60 años con 28 años de servicio',
  },
  {
    id: 'analista_ti',
    titulo: 'Analista de TI (Federal)',
    organo: 'Administración Pública Federal',
    bruto: 30000,
    liquido: 24000,
    emoji: '\uD83D\uDCBB',
    competencia: 'Media-Alta',
    preparacion: '3-6 meses',
    jubilacion: 'A los 60 años con 28 años de servicio',
  },
  {
    id: 'policia_municipal',
    titulo: 'Policía Municipal',
    organo: 'Municipio',
    bruto: 12000,
    liquido: 10500,
    emoji: '\uD83D\uDE93',
    competencia: 'Baja-Media',
    preparacion: '1-3 meses',
    jubilacion: 'A los 55 años con 20 años de servicio',
  },
];

const SimuladorSalarioScreen = ({ navigation }) => {
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [adShown, setAdShown] = useState(false);

  const animValue = useRef(new Animated.Value(0)).current;
  const { voltar } = useVoltarComNPS();
  // const { answers } = useQuiz(); // disponible si se necesita

  // voltar() é chamado pelo botão de voltar no header

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

  const handleSelectCargo = (cargo) => {
    setSelectedCargo(cargo);

    if (!adShown) {
      showInterstitial(() => {
        setAdShown(true);
      });
    }

    setShowDetails(true);
  };

  const handleShare = async () => {
    if (!selectedCargo) return;
    try {
      await Share.share({
        message: `Descubrí que un ${selectedCargo.titulo} gana ${formatMXN(
          selectedCargo.bruto
        )} brutos al mes en México. ¡Simula tu salario en PlazaYa!`,
      });
    } catch (error) {
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
        <Text style={styles.cargoEmoji}>{cargo.emoji}</Text>
      </View>
      <View style={styles.cargoInfo}>
        <Text style={styles.cargoTitulo}>{cargo.titulo}</Text>
        <Text style={styles.cargoOrgano}>{cargo.organo}</Text>
      </View>
      <View style={styles.cargoSalario}>
        <Text style={styles.cargoSalarioValue}>
          {formatMXN(cargo.liquido)}
        </Text>
        <Text style={styles.cargoSalarioLabel}>líquido/mes</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBenefitItem = (emoji, label, value, highlight = false) => (
    <View style={styles.benefitItem} key={label}>
      <View style={styles.benefitLeft}>
        <Text style={styles.benefitEmoji}>{emoji}</Text>
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
            <Text style={{ fontSize: 18 }}>📤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.salarioBoxes}>
          <View style={styles.salarioBox}>
            <Text style={styles.salarioBoxLabel}>Salario Bruto</Text>
            <Text style={styles.salarioBoxValue}>
              {formatMXN(selectedCargo.bruto)}
            </Text>
            <Text style={styles.salarioBoxPeriod}>mensual</Text>
          </View>
          <View style={styles.salarioBoxDivider} />
          <View style={styles.salarioBox}>
            <Text style={styles.salarioBoxLabel}>Salario Líquido</Text>
            <Text style={[styles.salarioBoxValue, styles.salarioBoxValueNet]}>
              {formatMXN(selectedCargo.liquido)}
            </Text>
            <Text style={styles.salarioBoxPeriod}>mensual</Text>
          </View>
        </View>

        <View style={styles.descuentosBar}>
          <Text style={{ fontSize: 14 }}>ℹ️</Text>
          <Text style={styles.descuentosText}>
            Descuentos (ISR, ISSSTE/IMSS, etc.):{' '}
            <Text style={styles.descuentosValue}>
              -{formatMXN(descuentos)}
            </Text>
          </Text>
        </View>

        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsSectionTitle}>
            Prestaciones y Beneficios
          </Text>

          {renderBenefitItem(
            '🎁',
            'Aguinaldo (40 días)',
            formatMXN(aguinaldo),
            true
          )}
          {renderBenefitItem(
            '🏖️',
            'Prima Vacacional (25%)',
            formatMXN(primaVacacional)
          )}
          {renderBenefitItem(
            '🐷',
            'Fondo de Ahorro (6.5%)',
            formatarValor(fondoAhorro) + '/mes'
          )}
          {renderBenefitItem(
            '🏥',
            'ISSSTE/IMSS',
            'Incluido'
          )}
          {renderBenefitItem(
            '🛡️',
            'Seguro de Vida',
            'Incluido'
          )}
          {renderBenefitItem(
            '🏠',
            'Crédito FOVISSSTE/INFONAVIT',
            'Disponible'
          )}
          {renderBenefitItem(
            '📅',
            '20 días de vacaciones',
            'Anuales'
          )}
          {renderBenefitItem(
            '🎓',
            'Estímulos por capacitación',
            'Variable'
          )}
        </View>

        <View style={styles.jubilacionBox}>
          <Text style={styles.jubilacionTitle}>🏛️ Jubilación</Text>
          <Text style={styles.jubilacionText}>
            {selectedCargo.jubilacion}
          </Text>
        </View>

        <View style={styles.competenciaBox}>
          <View style={styles.competenciaRow}>
            <Text style={styles.competenciaLabel}>📊 Competencia:</Text>
            <Text style={styles.competenciaValue}>{selectedCargo.competencia}</Text>
          </View>
          <View style={styles.competenciaRow}>
            <Text style={styles.competenciaLabel}>⏱️ Tiempo de preparación:</Text>
            <Text style={styles.competenciaValue}>{selectedCargo.preparacion}</Text>
          </View>
        </View>

        <View style={styles.anualBox}>
          <View style={styles.anualBoxHeader}>
            <Text style={{ fontSize: 22 }}>📈</Text>
            <Text style={styles.anualBoxTitle}>Ingreso Anual Estimado</Text>
          </View>
          <Text style={styles.anualBoxValue}>
            {formatMXN(ingresoAnual)}
          </Text>
          <Text style={styles.anualBoxSubtitle}>
            Incluye 12 meses de salario líquido + aguinaldo + prima vacacional
          </Text>
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={{ fontSize: 14 }}>⚠️</Text>
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
      <StatusBar backgroundColor="#FF8C40" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
        >
          <Text style={{ fontSize: 20, color: '#fff' }}>⬅️</Text>
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
          <Text style={{ fontSize: 36 }}>💰</Text>
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

        <AdBanner />

        {showDetails && renderDetails()}

        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FF8C40',
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
    color: '#0F172A',
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
    borderColor: '#FF8C40',
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
    backgroundColor: '#FF8C40',
  },
  cargoEmoji: {
    fontSize: 20,
  },
  cargoInfo: {
    flex: 1,
  },
  cargoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
    color: '#FF8C40',
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
    color: '#0F172A',
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
    color: '#FF8C40',
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
    color: '#FF4F8E',
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
    color: '#0F172A',
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
  benefitEmoji: {
    fontSize: 18,
  },
  benefitLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  benefitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF8C40',
  },
  benefitValueHighlight: {
    color: '#FF8C40',
  },
  jubilacionBox: {
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
  jubilacionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  jubilacionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  competenciaBox: {
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
  competenciaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  competenciaLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  competenciaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF8C40',
  },
  anualBox: {
    backgroundColor: '#FF8C40',
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
