import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { showInterstitial } from '../../services/adService';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import AdBanner from '../../components/AdBanner';
import { ADMOB_IDS } from '../../constants/data';

const FILTER_TYPES = ['Todas', 'CENEVAL', 'USICAMM', 'SPC'];

const MaterialesExamenesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [materiales, setMateriales] = useState([]);
  const [filteredMateriales, setFilteredMateriales] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('Todas');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { voltar: voltarHome } = useVoltarComNPS();

  const fetchMateriales = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('materiales_examenes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMateriales(data || []);
      applyFilters(data || [], selectedFilter, searchText);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los materiales. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, searchText]);

  useEffect(() => {
    fetchMateriales();
  }, [fetchMateriales]);

  const applyFilters = (data, filter, search) => {
    let filtered = data;

    if (filter !== 'Todas') {
      filtered = filtered.filter(
        (item) => item.banca && item.banca.toUpperCase() === filter.toUpperCase()
      );
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          (item.titulo && item.titulo.toLowerCase().includes(searchLower)) ||
          (item.banca && item.banca.toLowerCase().includes(searchLower)) ||
          (item.descricao && item.descricao.toLowerCase().includes(searchLower))
      );
    }

    setFilteredMateriales(filtered);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    applyFilters(materiales, filter, searchText);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    applyFilters(materiales, selectedFilter, text);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMateriales();
  };

  const handleOpenMaterial = (material) => {
    showInterstitial(() => {
      if (material.url_pdf) {
        Linking.openURL(material.url_pdf).catch(() => {
          Alert.alert('Error', 'No fue posible abrir el material.');
        });
      } else {
        Alert.alert('No disponible', 'Este material aún no tiene archivo PDF vinculado.');
      }
    });
  };

  const renderFilterChip = (filter) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterChip,
        selectedFilter === filter && styles.filterChipActive,
      ]}
      onPress={() => handleFilterChange(filter)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedFilter === filter && styles.filterChipTextActive,
        ]}
      >
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderMaterialItem = ({ item }) => (
    <TouchableOpacity
      style={styles.materialCard}
      onPress={() => handleOpenMaterial(item)}
      activeOpacity={0.7}
    >
      <View style={styles.materialHeader}>
        <View style={styles.bancaBadge}>
          <Text style={styles.bancaBadgeText}>
            {item.banca || 'General'}
          </Text>
        </View>
        {item.ano && <Text style={styles.materialYear}>{item.ano}</Text>}
      </View>

      <Text style={styles.materialTitle} numberOfLines={2}>
        {item.titulo}
      </Text>

      {item.descricao && (
        <Text style={styles.materialDescription} numberOfLines={2}>
          {item.descricao}
        </Text>
      )}

      <View style={styles.materialFooter}>
        <Text style={styles.materialAction}>
          📄 Ver PDF
        </Text>
        {item.num_questoes && (
          <Text style={styles.materialQuestions}>
            {item.num_questoes} preguntas
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>Sin materiales</Text>
      <Text style={styles.emptyText}>
        {searchText.trim()
          ? 'No se encontraron materiales con esa búsqueda.'
          : 'Aún no hay materiales disponibles para este filtro.'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF8C40" />
        <Text style={styles.loadingText}>Cargando materiales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Materiales y Exámenes</Text>
        <Text style={styles.subtitle}>
          Estudia con exámenes anteriores y materiales de apoyo
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar materiales..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearchChange}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          data={FILTER_TYPES}
          renderItem={({ item }) => renderFilterChip(item)}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      <FlatList
        data={filteredMateriales}
        renderItem={renderMaterialItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={<View style={{ height: 16 }} />}
      />

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
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C40',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filtersContainer: {
    paddingBottom: 8,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FF8C40',
    borderColor: '#FF8C40',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bancaBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bancaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C40',
  },
  materialYear: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  materialDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  materialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  materialAction: {
    fontSize: 14,
    color: '#FF8C40',
    fontWeight: '600',
  },
  materialQuestions: {
    fontSize: 13,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MaterialesExamenesScreen;
