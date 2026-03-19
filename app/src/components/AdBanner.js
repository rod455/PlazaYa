// src/components/AdBanner.js
// Banner fixo na base de qualquer tela — usa o ID real do AdMob
// ✅ FIX: Removido fallback para TestIds.BANNER — agora usa ID real sempre

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_IDS } from '../constants/data';

// ✅ FIX: Sempre usa o ID real — sem __DEV__ ternário
const BANNER_ID = ADMOB_IDS.BANNER;

export default function AdBanner({ style }) {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;

  return (
    <View style={[styles.wrap, style]}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdFailedToLoad={(err) => {
          // falha silenciosa — banner simplesmente não aparece
          console.warn('AdBanner failed:', err?.code);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
});
