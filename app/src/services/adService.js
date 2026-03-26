// src/services/adService.js
// Servicio centralizado de ads — evita múltiples .load() desperdiciados
// Una única instancia de interstitial compartida entre todas las pantallas
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { ADMOB_IDS } from '../constants/data';

// ── Interstitial compartido (singleton) ──────────────────────────────────
let interstitialInstance = null;
let interstitialReady = false;
let onCloseCallback = null;

function getInterstitial() {
  if (!interstitialInstance) {
    interstitialInstance = InterstitialAd.createForAdRequest(ADMOB_IDS.INTERSTITIAL, {
      keywords: ['empleo gobierno', 'convocatoria', 'curso preparacion', 'oposiciones'],
      requestNonPersonalizedAdsOnly: false,
    });

    interstitialInstance.addAdEventListener(AdEventType.LOADED, () => {
      interstitialReady = true;
    });

    interstitialInstance.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialReady = false;
      if (onCloseCallback) {
        const cb = onCloseCallback;
        onCloseCallback = null;
        cb();
      }
      setTimeout(() => {
        interstitialInstance.load();
      }, 1000);
    });

    interstitialInstance.addAdEventListener(AdEventType.ERROR, () => {
      interstitialReady = false;
      if (onCloseCallback) {
        const cb = onCloseCallback;
        onCloseCallback = null;
        cb();
      }
      setTimeout(() => {
        interstitialInstance.load();
      }, 30000);
    });

    interstitialInstance.load();
  }
  return interstitialInstance;
}

export function initAds() {
  getInterstitial();
}

export async function showInterstitial(onClose) {
  if (interstitialReady) {
    onCloseCallback = onClose;
    try {
      await getInterstitial().show();
    } catch {
      interstitialReady = false;
      onCloseCallback = null;
      if (onClose) onClose();
    }
  } else {
    if (onClose) onClose();
  }
}
