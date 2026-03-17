// src/components/AdBanner.js
// Banner fixo na base de qualquer tela — usa o ID real do AdMob

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { ADMOB_IDS } from '../constants/data';

// Em desenvolvimento usa ID de teste; em produção usa o ID real
const BANNER_ID = __DEV__
  ? TestIds.BANNER
  : ADMOB_IDS.BANNER;

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
