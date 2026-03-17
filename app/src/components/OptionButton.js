// src/components/OptionButton.js
// Botão de opção padrão para as telas de quiz

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/colors';

export default function OptionButton({ label, icon, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.btn, selected && styles.btnSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {icon && (
        <Text style={styles.icon}>{icon}</Text>
      )}
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  btnSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#eff6ff',
  },
  icon: {
    fontSize: 22,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 21,
  },
  labelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
