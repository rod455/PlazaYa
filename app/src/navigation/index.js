// PATCH para src/navigation/index.js
// Adicione estas 2 linhas no bloco de imports:
//
//   import ConvocatoriaScreen from '../screens/main/ConvocatoriaScreen';
//
// E esta tela dentro do Stack.Navigator, após a rota "StudyQuiz":
//
//   <Stack.Screen
//     name="Convocatoria"
//     component={ConvocatoriaScreen}
//     options={{ headerShown: false, gestureEnabled: true }}
//   />
//
// ─── Versão completa do navigation/index.js com a rota já incluída ────────────

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import SplashScreen        from '../screens/SplashScreen';
import Quiz1Screen         from '../screens/quiz/Quiz1Screen';
import Quiz2Screen         from '../screens/quiz/Quiz2Screen';
import Quiz3Screen         from '../screens/quiz/Quiz3Screen';
import Quiz4Screen         from '../screens/quiz/Quiz4Screen';
import Quiz5Screen         from '../screens/quiz/Quiz5Screen';
import Quiz6Screen         from '../screens/quiz/Quiz6Screen';
import Quiz7Screen         from '../screens/quiz/Quiz7Screen';
import RewardedAdScreen    from '../screens/RewardedAdScreen';
import KnowledgeQuizScreen from '../screens/knowledge/KnowledgeQuizScreen';
import AuthScreen          from '../screens/auth/AuthScreen';
import HomeScreen          from '../screens/main/HomeScreen';
import ConvocatoriaScreen  from '../screens/main/ConvocatoriaScreen';  // 🆕
import StudyHomeScreen     from '../screens/study/StudyHomeScreen';
import StudyQuizScreen     from '../screens/study/StudyQuizScreen';
import { NovididadesScreen, EstadoScreen, PerfilScreen } from '../screens/main/OtherScreens';

import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

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
            'Perfil':    '👤',
          };
          return <Text style={{ fontSize: 20, color }}>{icons[route.name]}</Text>;
        },
      })}
    >
      <Tab.Screen name="Inicio"    component={HomeScreen} />
      <Tab.Screen name="Estudiar"  component={StudyHomeScreen} />
      <Tab.Screen name="Novedades" component={NovididadesScreen} />
      <Tab.Screen name="Perfil"    component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>

      <Stack.Screen name="Splash"       component={SplashScreen}        options={{ gestureEnabled: false }} />
      <Stack.Screen name="Quiz1"        component={Quiz1Screen}          options={slideOpts} />
      <Stack.Screen name="Quiz2"        component={Quiz2Screen}          options={slideOpts} />
      <Stack.Screen name="Quiz3"        component={Quiz3Screen}          options={slideOpts} />
      <Stack.Screen name="Quiz4"        component={Quiz4Screen}          options={slideOpts} />
      <Stack.Screen name="Quiz5"        component={Quiz5Screen}          options={slideOpts} />
      <Stack.Screen name="Quiz6"        component={Quiz6Screen}          options={slideOpts} />
      <Stack.Screen name="Quiz7"        component={Quiz7Screen}          options={slideOpts} />
      <Stack.Screen name="RewardedAd"   component={RewardedAdScreen}     options={{ gestureEnabled: false }} />
      <Stack.Screen name="KnowledgeQuiz"component={KnowledgeQuizScreen}  options={{ ...slideOpts, gestureEnabled: false }} />
      <Stack.Screen name="Auth"         component={AuthScreen}           options={slideOpts} />
      <Stack.Screen name="MainApp"      component={MainApp}              options={{ gestureEnabled: false }} />
      <Stack.Screen name="StudyQuiz"    component={StudyQuizScreen}      options={{ headerShown: false, gestureEnabled: false }} />

      {/* 🆕 Tela de vaga em WebView */}
      <Stack.Screen
        name="Convocatoria"
        component={ConvocatoriaScreen}
        options={{ headerShown: false, gestureEnabled: true }}
      />

    </Stack.Navigator>
  );
}
