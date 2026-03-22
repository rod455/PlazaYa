// App.js — raiz do app PlazaYa
// QuizProvider + AuthProvider + Interstitial a cada 3min
// ✅ FIX v1.1: Removido Firebase, analytics, UTM — PlazaYa usa apenas Supabase

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/index';
import { QuizProvider } from './src/context/QuizContext';
import { AuthProvider } from './src/context/AuthContext';
import { usePersistentInterstitial } from './src/hooks/useInterstitial';

// Wrapper interno para poder usar o hook após os Providers
function AppContent() {
  usePersistentInterstitial(); // intersticial a cada 3 min de navegação
  return <AppNavigator />;
}

export default function App() {
  return (
    <QuizProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </QuizProvider>
  );
}
