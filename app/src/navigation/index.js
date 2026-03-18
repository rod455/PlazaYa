// src/navigation/index.js
// Fluxo correto:
// Splash → Quiz1-7 → RewardedAd → ResultadoPerfil → MainApp (com botão flutuante)

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

function BotaoTesteConhecimentos() {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={tabStyles.btnFlut}
      onPress={() => navigation.navigate('KnowledgeQuiz')}
      activeOpacity={0.85}
    >
      <Text style={tabStyles.btnFlutEmoji}>🧠</Text>
      <Text style={tabStyles.btnFlutTxt}>Testa tus conocimientos</Text>
    </TouchableOpacity>
  );
}

function MainApp() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor:   '#1a5c2a',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: tabStyles.tabBar,
          tabBarLabelStyle: tabStyles.tabLabel,
          tabBarIcon: ({ color }) => {
            const icons = { 'Inicio':'🏠', 'Estudiar':'📚', 'Novedades':'📋', 'Perfil':'👤' };
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
      <Stack.Screen name="Auth"            component={AuthScreen}            options={slideOpts} />
      <Stack.Screen name="Cadastro"         component={CadastroScreen}        options={slideOpts} />
      <Stack.Screen name="MainApp"         component={MainApp}               options={{ gestureEnabled: false }} />
      <Stack.Screen name="KnowledgeQuiz"   component={KnowledgeQuizScreen}   options={{ headerShown: false, gestureEnabled: true, presentation: 'modal' }} />
      <Stack.Screen name="Convocatoria"    component={ConvocatoriaScreen}    options={{ headerShown: false, gestureEnabled: true }} />
      <Stack.Screen name="StudyQuiz"       component={StudyQuizScreen}       options={{ headerShown: false, gestureEnabled: false }} />
    </Stack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  tabBar:       { backgroundColor: '#fff', borderTopColor: '#e0e0e0', borderTopWidth: 1, height: 62, paddingBottom: 6 },
  tabLabel:     { fontSize: 11, fontWeight: '700' },
  btnFlut:      { position: 'absolute', bottom: 68, left: 12, right: 12,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                  backgroundColor: '#1a5c2a', paddingVertical: 15, borderRadius: 16,
                  shadowColor: '#0d2e15', shadowOpacity: 0.45, shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 }, elevation: 10,
                  borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  btnFlutEmoji: { fontSize: 22 },
  btnFlutTxt:   { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.3 },
});
