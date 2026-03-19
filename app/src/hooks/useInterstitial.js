// src/hooks/useInterstitial.js
// Exibe um anúncio intersticial a cada 3 minutos de navegação ativa.
// Coloque usePersistentInterstitial() no App.js (uma única vez).

import { useEffect, useRef } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { AppState } from 'react-native';
import { ADMOB_IDS } from '../constants/data';

const INTERVALO_MS = 3 * 60 * 1000; // 3 minutos

// ✅ FIX: Sempre usa o ID real — sem fallback para TestIds
const INTERSTITIAL_ID = ADMOB_IDS.INTERSTITIAL;

// Instância única — criada fora do hook para persistir entre renders
const interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
  keywords: ['oposicion mexico', 'gobierno', 'servidor publico', 'curso preparacion'],
  requestNonPersonalizedAdsOnly: false,
});

export function usePersistentInterstitial() {
  const adReadyRef     = useRef(false);
  const timerRef       = useRef(null);
  const appStateRef    = useRef(AppState.currentState);
  const activeTimeRef  = useRef(0);   // ms acumulados em foreground
  const lastActiveRef  = useRef(null); // timestamp do último foco

  // ── Carrega o ad ──────────────────────────────────────────────────────────
  function loadAd() {
    try { interstitial.load(); } catch (_) {}
  }

  useEffect(() => {
    // Listeners do ad
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      adReadyRef.current = true;
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      adReadyRef.current = false;
      activeTimeRef.current = 0; // reinicia contagem após exibir
      loadAd();                  // pré-carrega o próximo
    });
    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      adReadyRef.current = false;
      // Tenta novamente após 30s em caso de erro
      setTimeout(loadAd, 30_000);
    });

    loadAd();

    // ── Rastreia tempo ativo em foreground ────────────────────────────────
    lastActiveRef.current = Date.now();

    const appStateSub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active') {
        // App voltou ao foco — registra timestamp
        lastActiveRef.current = Date.now();
      } else if (prev === 'active') {
        // App saiu do foco — acumula tempo ativo
        if (lastActiveRef.current) {
          activeTimeRef.current += Date.now() - lastActiveRef.current;
          lastActiveRef.current = null;
        }
      }
    });

    // ── Timer de verificação a cada 15s ───────────────────────────────────
    timerRef.current = setInterval(() => {
      // Acumula tempo se o app está ativo agora
      if (appStateRef.current === 'active' && lastActiveRef.current) {
        activeTimeRef.current += Date.now() - lastActiveRef.current;
        lastActiveRef.current = Date.now(); // reinicia parcial
      }

      // Verifica se atingiu o intervalo
      if (activeTimeRef.current >= INTERVALO_MS && adReadyRef.current) {
        activeTimeRef.current = 0;
        lastActiveRef.current = Date.now();
        try { interstitial.show(); } catch (_) {}
      }
    }, 15_000);

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
      appStateSub.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
}
