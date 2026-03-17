// src/navigation/index.js
// Navigator principal — inclui onboarding, quiz de conhecimentos, auth e estudo

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// ── Onboarding ─────────────────────────────────────────────────────────────
import SplashScreen     from '../screens/SplashScreen';
import Quiz1Screen      from '../screens/quiz/Quiz1Screen';
import Quiz2Screen      from '../screens/quiz/Quiz2Screen';
import Quiz3Screen      from '../screens/quiz/Quiz3Screen';
import Quiz4Screen      from '../screens/quiz/Quiz4Screen';
import Quiz5Screen      from '../screens/quiz/Quiz5Screen';
import Quiz6Screen      from '../screens/quiz/Quiz6Screen';
import Quiz7Screen      from '../screens/quiz/Quiz7Screen';
import RewardedAdScreen from '../screens/RewardedAdScreen';

// ── Novo: Quiz de Conhecimentos + Auth ─────────────────────────────────────
import KnowledgeQuizScreen from '../screens/knowledge/KnowledgeQuizScreen';
import AuthScreen          from '../screens/auth/AuthScreen';

// ── Main App ───────────────────────────────────────────────────────────────
import HomeScreen     from '../screens/main/HomeScreen';
import StudyHomeScreen from '../screens/study/StudyHomeScreen';
import StudyQuizScreen from '../screens/study/StudyQuizScreen';
import { NovididadesScreen, EstadoScreen, CargoScreen } from '../screens/main/OtherScreens';

import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

// ─── Animação horizontal padrão ─────────────────────────────────────────────
const slideOpts = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animationEnabled: true,
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [{
        translateX: current.progress.interpolate({
          inputRange:  [0, 1],
          outputRange: [layouts.screen.width, 0],
        }),
      }],
    },
  }),
};

// ─── Tabs do MainApp ─────────────────────────────────────────────────────────
function MainApp() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: '#E5E7EB',
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color }) => {
          const icons = {
            'Inicio':    '🏠',
            'Estudiar':  '📚',
            'Novedades': '📋',
            'Estado':    '🗺️',
          };
          return <Text style={{ fontSize: 20, color }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Inicio"    component={HomeScreen}      />
      <Tab.Screen name="Estudiar"  component={StudyHomeScreen}  />
      <Tab.Screen name="Novedades" component={NovididadesScreen} />
      <Tab.Screen name="Estado"    component={EstadoScreen}     />
    </Tab.Navigator>
  );
}

// ─── Navigator raiz ──────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      {/* ── Splash ── */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ gestureEnabled: false }}
      />

      {/* ── Quiz de perfil (onboarding — 7 passos) ── */}
      <Stack.Screen name="Quiz1" component={Quiz1Screen} options={slideOpts} />
      <Stack.Screen name="Quiz2" component={Quiz2Screen} options={slideOpts} />
      <Stack.Screen name="Quiz3" component={Quiz3Screen} options={slideOpts} />
      <Stack.Screen name="Quiz4" component={Quiz4Screen} options={slideOpts} />
      <Stack.Screen name="Quiz5" component={Quiz5Screen} options={slideOpts} />
      <Stack.Screen name="Quiz6" component={Quiz6Screen} options={slideOpts} />
      <Stack.Screen name="Quiz7" component={Quiz7Screen} options={slideOpts} />

      {/* ── Anúncio Rewarded (após onboarding) ── */}
      <Stack.Screen
        name="RewardedAd"
        component={RewardedAdScreen}
        options={{ gestureEnabled: false }}
      />

      {/* ── 🆕 Quiz de Conhecimentos (antes do cadastro) ── */}
      <Stack.Screen
        name="KnowledgeQuiz"
        component={KnowledgeQuizScreen}
        options={{ ...slideOpts, gestureEnabled: false }}
      />

      {/* ── 🆕 Auth (Cadastro / Login) ── */}
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={slideOpts}
      />

      {/* ── App Principal ── */}
      <Stack.Screen
        name="MainApp"
        component={MainApp}
        options={{ gestureEnabled: false }}
      />

      {/* ── 🆕 Quiz de Estudo (dentro do MainApp, abre por cima) ── */}
      <Stack.Screen
        name="StudyQuiz"
        component={StudyQuizScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
