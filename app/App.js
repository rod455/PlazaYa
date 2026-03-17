// App.js — raiz do app, com QuizProvider + AuthProvider

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/index';
import { QuizProvider } from './src/context/QuizContext';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {
  return (
    <QuizProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QuizProvider>
  );
}
