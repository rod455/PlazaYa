// src/components/GovSourcesBanner.js
// Banner de cumplimiento con enlaces a fuentes gubernamentales oficiales de México
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const GOV_LINKS = [
  { label: 'Gobierno de México', url: 'https://www.gob.mx' },
  { label: 'Diario Oficial de la Federación', url: 'https://www.dof.gob.mx' },
  { label: 'Portal de Empleo del Gobierno', url: 'https://www.empleos.gob.mx' },
];

export default function GovSourcesBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.85}>
        <Text style={styles.icon}>🏛️</Text>
        <Text style={styles.title}>App independiente — consulta siempre las fuentes oficiales</Text>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.body}>
          <Text style={styles.bodyText}>
            Esta aplicación es independiente y{' '}
            <Text style={styles.bold}>NO tiene vínculo con el gobierno de México, dependencias gubernamentales ni organizadores de convocatorias</Text>
            . La información se recopila de fuentes públicas y puede contener imprecisiones. Confirma siempre en los sitios oficiales.
          </Text>
          <Text style={styles.linksTitle}>🔗 Fuentes oficiales del gobierno:</Text>
          {GOV_LINKS.map((link, i) => (
            <TouchableOpacity key={i} style={styles.linkRow} onPress={() => Linking.openURL(link.url)} activeOpacity={0.7}>
              <Text style={styles.linkBullet}>→</Text>
              <Text style={styles.linkText}>{link.label}</Text>
              <Text style={styles.linkUrl}>{link.url.replace('https://', '')}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.footer}>La app no garantiza aprobación, clasificación ni ningún resultado en convocatorias públicas.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#FFF8E1', borderBottomWidth: 1, borderBottomColor: '#FCD34D' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  icon: { fontSize: 16 },
  title: { flex: 1, fontSize: 12, fontWeight: '700', color: '#92400E' },
  chevron: { fontSize: 10, color: '#B45309' },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
  bodyText: { fontSize: 12, color: '#78350F', lineHeight: 18, marginBottom: 12 },
  bold: { fontWeight: '700' },
  linksTitle: { fontSize: 12, fontWeight: '800', color: '#92400E', marginBottom: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFFBEB', borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A', marginBottom: 6, gap: 8 },
  linkBullet: { fontSize: 14, color: '#B45309', fontWeight: '800' },
  linkText: { fontSize: 13, fontWeight: '700', color: '#1D4ED8', flex: 1 },
  linkUrl: { fontSize: 10, color: '#9CA3AF' },
  footer: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
