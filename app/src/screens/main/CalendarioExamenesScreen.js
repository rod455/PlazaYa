import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import { showInterstitial } from '../../services/adService';
import AdBanner from '../../components/AdBanner';
import { useQuiz } from '../../context/QuizContext';
import { ADMOB_IDS } from '../../constants/data';
import { supabase } from '../../services/supabase';

const MESES = [
  { num: 1, corto: 'Ene', largo: 'Enero' },
  { num: 2, corto: 'Feb', largo: 'Febrero' },
  { num: 3, corto: 'Mar', largo: 'Marzo' },
  { num: 4, corto: 'Abr', largo: 'Abril' },
  { num: 5, corto: 'May', largo: 'Mayo' },
  { num: 6, corto: 'Jun', largo: 'Junio' },
  { num: 7, corto: 'Jul', largo: 'Julio' },
  { num: 8, corto: 'Ago', largo: 'Agosto' },
  { num: 9, corto: 'Sep', largo: 'Septiembre' },
  { num: 10, corto: 'Oct', largo: 'Octubre' },
  { num: 11, corto: 'Nov', largo: 'Noviembre' },
  { num: 12, corto: 'Dic', largo: 'Diciembre' },
];

const CalendarioExamenesScreen = ({ navigation }) => {
  const [examenes, setExamenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [adShownForMonth, setAdShownForMonth] = useState([]);

  const monthListRef = useRef(null);
  const { voltarComNPS } = useVoltarComNPS();
  const { quizData } = useQuiz();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      voltarComNPS(e, navigation);
    });
    return unsubscribe;
  }, [navigation, voltarComNPS]);

  useEffect(() => {
    fetchExamenes();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const currentMonthIndex = selectedMonth - 1;
    if (monthListRef.current) {
      setTimeout(() => {
        monthListRef.current?.scrollToIndex({
          index: currentMonthIndex,
          animated: true,
          viewPosition: 0.4,
        });
      }, 300);
    }
  }, []);

  const fetchExamenes = async () => {
    setLoading(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const endYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('convocatorias_activas')
        .select('*')
        .gte('fecha_examen', startDate)
        .lt('fecha_examen', endDate)
        .order('fecha_examen', { ascending: true });

      if (error) {
        console.error('Error al cargar exámenes:', error);
        setExamenes([]);
        return;
      }

      setExamenes(data || []);
    } catch (error) {
      console.error('Error al cargar exámenes:', error);
      setExamenes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthSelect = async (month) => {
    if (!adShownForMonth.includes(month) && month !== selectedMonth) {
      try {
        await showInterstitial();
        setAdShownForMonth((prev) => [...prev, month]);
      } catch (error) {
        console.error('Error al mostrar anuncio:', error);
      }
    }
    setSelectedMonth(month);
  };

  const handleYearChange = (delta) => {
    setSelectedYear((prev) => prev + delta);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Por definir';
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = MESES[date.getMonth()]?.corto || '';
    return `${day} ${month}`;
  };

  const formatFullDate = (dateStr) => {
    if (!dateStr) return 'Fecha por definir';
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = MESES[date.getMonth()]?.largo || '';
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
  };

  const getDaysUntil = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDaysUntilLabel = (days) => {
    if (days === null) return '';
    if (days < 0) return 'Finalizado';
    if (days === 0) return '¡Hoy!';
    if (days === 1) return 'Mañana';
    return `En ${days} días`;
  };

  const getDaysUntilColor = (days) => {
    if (days === null) return '#999';
    if (days < 0) return '#999';
    if (days <= 7) return '#c0392b';
    if (days <= 30) return '#f0a500';
    return '#1a5c2a';
  };

  const renderMonthItem = ({ item }) => {
    const isSelected = item.num === selectedMonth;
    return (
      <TouchableOpacity
        style={[styles.monthChip, isSelected && styles.monthChipSelected]}
        onPress={() => handleMonthSelect(item.num)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.monthChipText,
            isSelected && styles.monthChipTextSelected,
          ]}
        >
          {item.corto}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderExamenCard = ({ item, index }) => {
    const daysUntil = getDaysUntil(item.fecha_examen);
    const daysLabel = getDaysUntilLabel(daysUntil);
    const daysColor = getDaysUntilColor(daysUntil);

    return (
      <>
        <TouchableOpacity
          style={styles.examenCard}
          onPress={() =>
            navigation.navigate('ConvocatoriaDetalles', {
              convocatoriaId: item.id,
            })
          }
          activeOpacity={0.7}
        >
          <View style={styles.examenDateBadge}>
            <Text style={styles.examenDateDay}>
              {item.fecha_examen
                ? new Date(item.fecha_examen + 'T00:00:00').getDate()
                : '?'}
            </Text>
            <Text style={styles.examenDateMonth}>
              {item.fecha_examen
                ? MESES[new Date(item.fecha_examen + 'T00:00:00').getMonth()]
                    ?.corto
                : ''}
            </Text>
          </View>

          <View style={styles.examenContent}>
            <View style={styles.examenHeader}>
              <View style={styles.examenBadge}>
                <Text style={styles.examenBadgeText}>
                  {item.organo || 'Gobierno'}
                </Text>
              </View>
              {daysLabel ? (
                <Text style={[styles.examenDaysLabel, { color: daysColor }]}>
                  {daysLabel}
                </Text>
              ) : null}
            </View>

            <Text style={styles.examenTitulo} numberOfLines={2}>
              {item.titulo}
            </Text>

            <View style={styles.examenDetails}>
              <View style={styles.examenDetailItem}>
                <Icon name="map-marker" size={13} color="#666" />
                <Text style={styles.examenDetailText}>
                  {item.estado || 'Nacional'}
                </Text>
              </View>
              <View style={styles.examenDetailItem}>
                <Icon name="clock-outline" size={13} color="#666" />
                <Text style={styles.examenDetailText}>
                  {item.horario_examen || 'Por confirmar'}
                </Text>
              </View>
            </View>

            {item.sede_examen && (
              <View style={styles.examenSede}>
                <Icon name="office-building-marker" size={13} color="#1a5c2a" />
                <Text style={styles.examenSedeText} numberOfLines={1}>
                  {item.sede_examen}
                </Text>
              </View>
            )}
          </View>

          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        {(index + 1) % 4 === 0 && index > 0 && (
          <View style={styles.inlineAd}>
            <AdBanner adUnitId={ADMOB_IDS.banner} size="mediumRectangle" />
          </View>
        )}
      </>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-blank-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Sin exámenes programados</Text>
      <Text style={styles.emptySubtitle}>
        No hay exámenes programados para{' '}
        {MESES[selectedMonth - 1]?.largo} de {selectedYear}. Prueba con otro
        mes.
      </Text>
    </View>
  );

  const renderSummary = () => {
    const upcoming = examenes.filter((e) => {
      const days = getDaysUntil(e.fecha_examen);
      return days !== null && days >= 0;
    });
    const thisWeek = upcoming.filter((e) => {
      const days = getDaysUntil(e.fecha_examen);
      return days !== null && days <= 7;
    });

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Icon name="calendar-month" size={24} color="#1a5c2a" />
          <Text style={styles.summaryNumber}>{examenes.length}</Text>
          <Text style={styles.summaryLabel}>Total del mes</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="calendar-week" size={24} color="#f0a500" />
          <Text style={styles.summaryNumber}>{thisWeek.length}</Text>
          <Text style={styles.summaryLabel}>Esta semana</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="calendar-check" size={24} color="#c0392b" />
          <Text style={styles.summaryNumber}>{upcoming.length}</Text>
          <Text style={styles.summaryLabel}>Próximos</Text>
        </View>
      </View>
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
        <Text style={styles.headerTitle}>Calendario de Exámenes</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.yearSelector}>
        <TouchableOpacity
          onPress={() => handleYearChange(-1)}
          style={styles.yearArrow}
        >
          <Icon name="chevron-left" size={24} color="#1a5c2a" />
        </TouchableOpacity>
        <Text style={styles.yearText}>{selectedYear}</Text>
        <TouchableOpacity
          onPress={() => handleYearChange(1)}
          style={styles.yearArrow}
        >
          <Icon name="chevron-right" size={24} color="#1a5c2a" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={monthListRef}
        data={MESES}
        renderItem={renderMonthItem}
        keyExtractor={(item) => item.num.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthList}
        getItemLayout={(data, index) => ({
          length: 60,
          offset: 60 * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
      />

      <View style={styles.currentMonthLabel}>
        <Text style={styles.currentMonthText}>
          {MESES[selectedMonth - 1]?.largo} {selectedYear}
        </Text>
        <Text style={styles.currentMonthCount}>
          {examenes.length} {examenes.length === 1 ? 'examen' : 'exámenes'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5c2a" />
          <Text style={styles.loadingText}>Cargando exámenes...</Text>
        </View>
      ) : (
        <FlatList
          data={examenes}
          renderItem={renderExamenCard}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={examenes.length > 0 ? renderSummary : null}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={<AdBanner adUnitId={ADMOB_IDS.banner} />}
        />
      )}
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
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  yearArrow: {
    padding: 8,
  },
  yearText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginHorizontal: 20,
  },
  monthList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  monthChip: {
    width: 52,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  monthChipSelected: {
    backgroundColor: '#1a5c2a',
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  monthChipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  currentMonthLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#e8f5e9',
  },
  currentMonthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a5c2a',
  },
  currentMonthCount: {
    fontSize: 13,
    color: '#1a5c2a',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  examenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  examenDateBadge: {
    width: 52,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#1a5c2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  examenDateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  examenDateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c8e6c9',
    marginTop: -2,
  },
  examenContent: {
    flex: 1,
  },
  examenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  examenBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  examenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a5c2a',
    textTransform: 'uppercase',
  },
  examenDaysLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  examenTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 19,
  },
  examenDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  examenDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  examenDetailText: {
    fontSize: 11,
    color: '#666',
  },
  examenSede: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  examenSedeText: {
    fontSize: 11,
    color: '#1a5c2a',
    flex: 1,
  },
  inlineAd: {
    marginVertical: 8,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default CalendarioExamenesScreen;
