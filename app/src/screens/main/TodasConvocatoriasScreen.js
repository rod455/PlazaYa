import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Platform,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import { showInterstitial } from '../../services/adService';
import AdBanner from '../../components/AdBanner';
import { useQuiz } from '../../context/QuizContext';
import { formatarValor } from '../../utils/salarioUtils';
import { ESTADOS_MEXICO } from '../../constants/data';
import { supabase } from '../../services/supabase';

const ITEMS_PER_PAGE = 10;
const LOCKED_AFTER = 3;

const AREAS_FILTER = [
  { id: 'todas', label: 'Todas' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'sat', label: 'SAT/Fiscal' },
  { id: 'salud', label: 'Salud' },
  { id: 'educacion', label: 'Educaci\u00f3n' },
  { id: 'judicial', label: 'P. Judicial' },
  { id: 'administrativo', label: 'Admin.' },
  { id: 'ti', label: 'TI' },
];

const TodasConvocatoriasScreen = ({ navigation, route }) => {
  const [convocatorias, setConvocatorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [selectedArea, setSelectedArea] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { voltar } = useVoltarComNPS();
  const { answers } = useQuiz();

  const initialFilters = route?.params || {};

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      voltar(e, navigation);
    });
    return unsubscribe;
  }, [navigation, voltar]);

  useEffect(() => {
    if (initialFilters.area) {
      setSelectedArea(initialFilters.area);
    }
    fetchConvocatorias(true);
  }, []);

  useEffect(() => {
    fetchConvocatorias(true);
  }, [selectedArea]);

  const fetchConvocatorias = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentPage = reset ? 0 : page;
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('convocatorias_activas')
        .select('*')
        .order('fecha_publicacion', { ascending: false })
        .range(from, to);

      if (selectedArea !== 'todas') {
        query = query.eq('area', selectedArea);
      }

      if (initialFilters.escolaridad) {
        query = query.eq('escolaridad', initialFilters.escolaridad);
      }

      if (initialFilters.estado) {
        query = query.eq('estado', initialFilters.estado);
      }

      const { data, error } = await query;

      if (error) {
        return;
      }

      if (reset) {
        setConvocatorias(data || []);
      } else {
        setConvocatorias((prev) => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === ITEMS_PER_PAGE);
      setPage(currentPage + 1);
    } catch (error) {
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConvocatorias(true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchConvocatorias(false);
    }
  };

  const handleUnlock = (item) => {
    showInterstitial(() => {
      setUnlockedIds((prev) => [...prev, item.id]);
      navigation.navigate('ConvocatoriaDetalles', { concurso: item });
    });
  };

  const isLocked = (index, convocatoriaId) => {
    if (index < LOCKED_AFTER) return false;
    return !unlockedIds.includes(convocatoriaId);
  };

  const filteredConvocatorias = convocatorias.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.titulo && c.titulo.toLowerCase().includes(q)) ||
      (c.organo && c.organo.toLowerCase().includes(q)) ||
      (c.estado && c.estado.toLowerCase().includes(q))
    );
  });

  const renderConvocatoriaCard = ({ item, index }) => {
    const locked = isLocked(index, item.id);

    return (
      <TouchableOpacity
        style={[styles.card, locked && styles.cardLocked]}
        onPress={() => {
          if (locked) {
            handleUnlock(item);
          } else {
            navigation.navigate('ConvocatoriaDetalles', {
              concurso: item,
            });
          }
        }}
        activeOpacity={0.7}
      >
        {locked && (
          <View style={styles.lockedOverlay}>
            <Text style={styles.lockedIcon}>🔒</Text>
            <Text style={styles.lockedText}>
              Ver anuncio para desbloquear
            </Text>
          </View>
        )}

        <View style={[locked && styles.blurredContent]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>
                {item.organo || 'Gobierno'}
              </Text>
            </View>
            {item.nueva && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NUEVA</Text>
              </View>
            )}
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {locked ? 'Convocatoria bloqueada' : item.titulo}
          </Text>

          <View style={styles.cardDetails}>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailEmoji}>📍</Text>
              <Text style={styles.cardDetailText}>
                {locked ? '••••••' : item.estado || 'Nacional'}
              </Text>
            </View>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailEmoji}>👥</Text>
              <Text style={styles.cardDetailText}>
                {locked ? '••' : item.plazas || '—'} plazas
              </Text>
            </View>
            <View style={styles.cardDetailItem}>
              <Text style={styles.cardDetailEmoji}>🎓</Text>
              <Text style={styles.cardDetailText}>
                {locked ? '••••••' : item.escolaridad || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.salarioContainer}>
              <Text style={styles.salarioLabel}>Salario:</Text>
              <Text style={styles.salarioValue}>
                {locked
                  ? '$••,•••'
                  : item.salario_hasta
                  ? formatarValor(item.salario_hasta)
                  : 'No especificado'}
              </Text>
            </View>
            <View style={styles.fechaContainer}>
              <Text style={styles.fechaEmoji}>📅</Text>
              <Text style={styles.fechaText}>
                {locked ? '••/••/••' : item.fecha_limite || 'Abierta'}
              </Text>
            </View>
          </View>
        </View>

        {(index + 1) % 5 === 0 && index > 0 && (
          <View style={styles.inlineAd}>
            <AdBanner />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAreaFilter = () => (
    <FlatList
      data={AREAS_FILTER}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.filterContainer}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedArea === item.id && styles.filterChipActive,
          ]}
          onPress={() => setSelectedArea(item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedArea === item.id && styles.filterChipTextActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1a5c2a" />
        <Text style={styles.footerLoaderText}>Cargando m\u00e1s...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Sin convocatorias</Text>
      <Text style={styles.emptySubtitle}>
        No se encontraron convocatorias con los filtros seleccionados. Intenta
        cambiar el \u00e1rea o los criterios de b\u00fasqueda.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a5c2a" barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBackBtn}
        >
          <Text style={styles.headerBackText}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Todas las Convocatorias</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchEmoji}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar convocatoria..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearEmoji}>❌</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {renderAreaFilter()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5c2a" />
          <Text style={styles.loadingText}>Cargando convocatorias...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConvocatorias}
          renderItem={renderConvocatoriaCard}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#1a5c2a']}
              tintColor="#1a5c2a"
            />
          }
        />
      )}

      <AdBanner />
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
  headerBackText: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchEmoji: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    padding: 0,
  },
  clearEmoji: {
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1a5c2a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#1a5c2a',
  },
  cardLocked: {
    borderLeftColor: '#ccc',
    overflow: 'hidden',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 12,
  },
  lockedIcon: {
    fontSize: 28,
  },
  lockedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  blurredContent: {
    opacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a5c2a',
    textTransform: 'uppercase',
  },
  newBadge: {
    backgroundColor: '#c0392b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 10,
    lineHeight: 22,
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  cardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardDetailEmoji: {
    fontSize: 14,
  },
  cardDetailText: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  salarioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salarioLabel: {
    fontSize: 12,
    color: '#666',
  },
  salarioValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0a500',
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fechaEmoji: {
    fontSize: 14,
  },
  fechaText: {
    fontSize: 12,
    color: '#c0392b',
    fontWeight: '600',
  },
  inlineAd: {
    marginTop: 12,
    alignItems: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 13,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
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

export default TodasConvocatoriasScreen;
