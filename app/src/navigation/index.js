// src/navigation/index.js
// PlazaYa — Navegação completa com todas as funcionalidades

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import SplashScreen           from '../screens/SplashScreen';
import Quiz1Screen            from '../screens/quiz/Quiz1Screen';
import Quiz2Screen            from '../screens/quiz/Quiz2Screen';
import Quiz3Screen            from '../screens/quiz/Quiz3Screen';
import Quiz4Screen            from '../screens/quiz/Quiz4Screen';
import Quiz5Screen            from '../screens/quiz/Quiz5Screen';
import Quiz6Screen            from '../screens/quiz/Quiz6Screen';
import Quiz7Screen            from '../screens/quiz/Quiz7Screen';
import RewardedAdScreen       from '../screens/RewardedAdScreen';
import ResultadoPerfilScreen  from '../screens/ResultadoPerfilScreen';
import KnowledgeQuizScreen    from '../screens/knowledge/KnowledgeQuizScreen';
import AuthScreen             from '../screens/auth/AuthScreen';
import CadastroScreen         from '../screens/auth/CadastroScreen';
import NovedadesScreen        from '../screens/main/NovedadesScreen';
import HomeScreen             from '../screens/main/HomeScreen';
import ConvocatoriaScreen     from '../screens/main/ConvocatoriaScreen';
import StudyHomeScreen        from '../screens/study/StudyHomeScreen';
import StudyQuizScreen        from '../screens/study/StudyQuizScreen';
import PerfilScreen           from '../screens/main/PerfilScreen';
import QuizScreen             from '../screens/quiz/QuizScreen';
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

// ── Botão flutuante de Quiz ───────────────────────────────────────────────────
function BotaoTesteConhecimentos() {
  const nav = useNavigation();
  return (
    <TouchableOpacity
      style={st.fab}
      onPress={() => {
        const root = nav.getParent?.();
        if (root) root.navigate('Quiz');
        else nav.navigate('Quiz');
      }}
      activeOpacity={0.85}
    >
      <Text style={st.fabTxt}>🧠</Text>
    </TouchableOpacity>
  );
}

// ── Tabs principais ───────────────────────────────────────────────────────────
function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: '#E5E7EB',
            paddingBottom: 4, height: 56,
          },
          tabBarIcon: ({ color }) => {
            const icons = {
              'Inicio':    '🏠',
              'Estudiar':  '📖',
              'Novedades': '📋',
              'Perfil':    '👤',
            };
            return <Text style={{ fontSize: 20, color }}>{icons[route.name]}</Text>;
          },
        })}
      >
        <Tab.Screen name="Inicio"    component={HomeScreen} />
        <Tab.Screen name="Estudiar"  component={StudyHomeScreen} />
        <Tab.Screen name="Novedades" component={NovedadesScreen} />
        <Tab.Screen name="Perfil"    component={PerfilScreen} />
      </Tab.Navigator>
      <BotaoTesteConhecimentos />
    </View>
  );
}

// ── Stack principal ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"          component={SplashScreen}          options={{ gestureEnabled: false }} />
      <Stack.Screen name="Quiz1"           component={Quiz1Screen}           options={slideOpts} />
      <Stack.Screen name="Quiz2"           component={Quiz2Screen}           options={slideOpts} />
      <Stack.Screen name="Quiz3"           component={Quiz3Screen}           options={slideOpts} />
      <Stack.Screen name="Quiz4"           component={Quiz4Screen}           options={slideOpts} />
      <Stack.Screen name="Quiz5"           component={Quiz5Screen}           options={slideOpts} />
      <Stack.Screen name="Quiz6"           component={Quiz6Screen}           options={slideOpts} />
      <Stack.Screen name="Quiz7"           component={Quiz7Screen}           options={slideOpts} />
      <Stack.Screen name="RewardedAd"      component={RewardedAdScreen}      options={{ gestureEnabled: false }} />
      <Stack.Screen name="ResultadoPerfil" component={ResultadoPerfilScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="KnowledgeQuiz"   component={KnowledgeQuizScreen}   options={{ gestureEnabled: false }} />
      <Stack.Screen name="Auth"            component={AuthScreen}            options={slideOpts} />
      <Stack.Screen name="Cadastro"        component={CadastroScreen}        options={slideOpts} />
      <Stack.Screen name="MainApp"         component={MainTabs}              options={{ gestureEnabled: false }} />
      <Stack.Screen name="Quiz"            component={QuizScreen}            options={{ gestureEnabled: false }} />
      <Stack.Screen name="Convocatoria"    component={ConvocatoriaScreen}    options={slideOpts} />
      <Stack.Screen name="StudyQuiz"       component={StudyQuizScreen}       options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

const st = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 70, right: 16,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.red, alignItems: 'center',
    justifyContent: 'center', elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 6,
  },
  fabTxt: { fontSize: 26 },
});
