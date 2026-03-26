import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVoltarComAdENPS } from '../../hooks/useVoltarComNPS';
import { showInterstitial } from '../../services/adService';
import AdBanner from '../../components/AdBanner';
import { supabase } from '../../services/supabase';

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_LARGO = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CATEGORIAS = ['Todas', 'Seguridad', 'Fiscal', 'Salud', 'Educaci\u00f3n', 'Judicial', 'Administrativo', 'TI'];
const FILTROS_FECHA = ['Todas las fechas', 'Esta semana', 'Este mes', 'Pr\u00f3ximo mes'];

const CalendarioExamenesScreen = ({ navigation }) => {
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [filtroFecha, setFiltroFecha] = useState('Todas las fechas');

  const { voltar } = useVoltarComAdENPS();

  useEffect(() => {
    fetchConvocatorias();
  }, []);

  const fetchConvocatorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('convocatorias_activas')
        .select('*')
        .not('fecha_cierre', 'is', null)
        .order('fecha_cierre', { ascending: true });

      if (error) {
        setConvocatorias([]);
        return;
      }

      setConvocatorias(data || []);
    } catch (error) {
      setConvocatorias([]);
    } finally {
      setLoading(false);
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr + 'T00:00:00');
  };

  const getDaysUntil = (dateStr) => {
    const target = parseDate(dateStr);
    if (!target) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  };

  const getDaysLabel = (days) => {
    if (days === null) return '';
    if (days < 0) return 'Finalizado';
    if (days === 0) return '\u00a1Hoy!';
    if (days === 1) return 'Ma\u00f1ana';
    return `En ${days} d\u00edas`;
  };

  const getDaysColor = (days) => {
    if (days === null || days < 0) return '#999';
    if (days <= 7) return '#FF4F8E';
    if (days <= 30) return '#FF8C40';
    return '#FF8C40';
  };

  const getFilteredData = useCallback(() => {
    let filtered = [...convocatorias];

    // Category filter
    if (categoriaSeleccionada !== 'Todas') {
      filtered = filtered.filter(
        (c) => c.categoria && c.categoria.toLowerCase() === categoriaSeleccionada.toLowerCase()
      );
    }

    // Date filter
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (filtroFecha === 'Esta semana') {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
      filtered = filtered.filter((c) => {
        const d = parseDate(c.fecha_cierre);
        return d && d >= now && d <= endOfWeek;
      });
    } else if (filtroFecha === 'Este mes') {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filtered = filtered.filter((c) => {
        const d = parseDate(c.fecha_cierre);
        return d && d >= now && d <= endOfMonth;
      });
    } else if (filtroFecha === 'Pr\u00f3ximo mes') {
      const startNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endNext = new Date(now.getFullYear(), now.getMonth() + 2, 0);
      filtered = filtered.filter((c) => {
        const d = parseDate(c.fecha_cierre);
        return d && d >= startNext && d <= endNext;
      });
    }

    // Sort by closest fecha_cierre first
    filtered.sort((a, b) => {
      const da = parseDate(a.fecha_cierre);
      const db = parseDate(b.fecha_cierre);
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });

    return filtered;
  }, [convocatorias, categoriaSeleccionada, filtroFecha]);

  const filteredData = getFilteredData();

  const renderCategoriaChip = (cat) => {
    const isSelected = cat === categoriaSeleccionada;
    return (
      <TouchableOpacity
        key={cat}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setCategoriaSeleccionada(cat)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {cat}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFechaChip = (filtro) => {
    const isSelected = filtro === filtroFecha;
    return (
      <TouchableOpacity
        key={filtro}
        style={[styles.chip, isSelected && styles.chipSelectedFecha]}
        onPress={() => setFiltroFecha(filtro)}
        activeOpacity={0.7}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelectedFecha]}>
          {filtro}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCard = ({ item, index }) => {
    const fecha = parseDate(item.fecha_cierre);
    const day = fecha ? fecha.getDate() : '?';
    const month = fecha ? MESES_CORTO[fecha.getMonth()] : '';
    const daysUntil = getDaysUntil(item.fecha_cierre);
    const daysLabel = getDaysLabel(daysUntil);
    const daysColor = getDaysColor(daysUntil);

    return (
      <>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('ConvocatoriaDetalles', { concurso: item })}
          activeOpacity={0.7}
        >
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.categoria || item.organo || 'Gobierno'}
                </Text>
              </View>
              {daysLabel ? (
                <Text style={[styles.daysLabel, { color: daysColor }]}>
                  {daysLabel}
                </Text>
              ) : null}
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.titulo}
            </Text>

            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailEmoji}>{'\uD83D\uDCCD'}</Text>
                <Text style={styles.detailText}>
                  {item.estado || 'Nacional'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailEmoji}>{'\uD83D\uDCC5'}</Text>
                <Text style={styles.detailText}>
                  Cierre: {fecha ? `${day} ${month} ${fecha.getFullYear()}` : 'Por definir'}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.chevron}>{'\u203A'}</Text>
        </TouchableOpacity>

        {(index + 1) % 4 === 0 && index > 0 && (
          <View style={styles.inlineAd}>
            <AdBanner />
          </View>
        )}
      </>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{'\uD83D\uDCC5'}</Text>
      <Text style={styles.emptyTitle}>Sin fechas programadas</Text>
      <Text style={styles.emptySubtitle}>
        No hay convocatorias con fechas de cierre para los filtros seleccionados. Prueba con otra categor\u00eda o rango de fechas.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Category filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Categor\u00eda</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIAS.map(renderCategoriaChip)}
        </ScrollView>
      </View>

      {/* Date filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Rango de fechas</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTROS_FECHA.map(renderFechaChip)}
        </ScrollView>
      </View>

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredData.length} {filteredData.length === 1 ? 'convocatoria' : 'convocatorias'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor="#FF8C40" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={voltar}
          style={styles.headerBackBtn}
        >
          <Text style={styles.headerBackText}>{'\u2190'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendario de Fechas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C40" />
          <Text style={styles.loadingText}>Cargando calendario...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderCard}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={<AdBanner />}
        />
      )}
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerBackBtn: {
    padding: 4,
    width: 40,
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
  filterSection: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  chipSelected: {
    backgroundColor: '#FF8C40',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  chipSelectedFecha: {
    backgroundColor: '#2c3e50',
  },
  chipTextSelectedFecha: {
    color: '#fff',
    fontWeight: '700',
  },
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#e8f5e9',
  },
  resultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8C40',
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
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
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
  dateBox: {
    width: 52,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#FF8C40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c8e6c9',
    marginTop: -2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF8C40',
    textTransform: 'uppercase',
  },
  daysLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    lineHeight: 19,
  },
  cardDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailEmoji: {
    fontSize: 12,
  },
  detailText: {
    fontSize: 11,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#ccc',
    marginLeft: 4,
    fontWeight: '300',
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
  emptyIcon: {
    fontSize: 56,
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
