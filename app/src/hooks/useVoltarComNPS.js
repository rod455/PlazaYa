// src/hooks/useVoltarComNPS.js
// Hook reutilizable: volver a home con interstitial + NPS
import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { showInterstitial } from '../services/adService';
import { shouldShowNPS } from '../components/NPSModal';

// Para pantallas CON interstitial al volver
export function useVoltarComAdENPS() {
  const navigation = useNavigation();
  const voltar = useCallback(async () => {
    const deveNPS = await shouldShowNPS();
    showInterstitial(() => {
      if (deveNPS) {
        navigation.navigate('Home', { triggerNPS: true });
      } else {
        navigation.goBack();
      }
    });
  }, [navigation]);
  return { voltar };
}

// Para pantallas SIN interstitial al volver
export function useVoltarComNPS() {
  const navigation = useNavigation();
  const voltar = useCallback(async () => {
    const deveNPS = await shouldShowNPS();
    if (deveNPS) {
      navigation.navigate('Home', { triggerNPS: true });
    } else {
      navigation.goBack();
    }
  }, [navigation]);
  return { voltar };
}
