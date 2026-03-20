// src/hooks/useInterstitial.js
// Intersticial persistente — mostra a cada 3 minutos de navegação

import { useEffect, useRef } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { ADMOB_IDS } from '../constants/data';

const INTERVALO_MS = 3 * 60 * 1000; // 3 minutos

export function usePersistentInterstitial() {
  const timerRef = useRef(null);
  const adRef = useRef(null);

  useEffect(() => {
    function loadAd() {
      try {
        const ad = InterstitialAd.createForAdRequest(ADMOB_IDS.INTERSTITIAL, {
          keywords: [
            'empleo gobierno', 'convocatoria publica', 'plaza gobierno',
            'servicio profesional carrera', 'trabajo gobierno mexico',
          ],
          requestNonPersonalizedAdsOnly: false,
        });

        const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
          adRef.current = ad;
        });

        const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          adRef.current = null;
          // Recarrega para o próximo ciclo
          setTimeout(loadAd, 2000);
        });

        const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
          adRef.current = null;
          setTimeout(loadAd, 30000); // retry em 30s
        });

        ad.load();

        return () => {
          unsubLoaded();
          unsubClosed();
          unsubError();
        };
      } catch (e) {
        console.warn('useInterstitial load error:', e);
      }
    }

    loadAd();

    // Timer para mostrar a cada 3 min
    timerRef.current = setInterval(() => {
      if (adRef.current) {
        try {
          adRef.current.show().catch(() => {});
        } catch (e) {
          console.warn('useInterstitial show error:', e);
        }
      }
    }, INTERVALO_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
}
