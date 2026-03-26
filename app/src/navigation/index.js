// src/navigation/index.js
// PlazaYa — Stack-only navigation (same dynamic as ConcursoBrasil)
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/main/HomeScreen';
import EncontrarConvocatoriaScreen from '../screens/main/EncontrarConvocatoriaScreen';
import TodasConvocatoriasScreen from '../screens/main/TodasConvocatoriasScreen';
import SimuladorSalarioScreen from '../screens/main/SimuladorSalarioScreen';
import CalendarioExamenesScreen from '../screens/main/CalendarioExamenesScreen';
import QuizDiarioScreen from '../screens/main/QuizDiarioScreen';
import MaterialesExamenesScreen from '../screens/main/MaterialesExamenesScreen';
import MiProgresoScreen from '../screens/main/MiProgresoScreen';
import CompartirScreen from '../screens/main/CompartirScreen';
import PreguntasFrecuentesScreen from '../screens/main/PreguntasFrecuentesScreen';
import CuentaScreen from '../screens/main/CuentaScreen';
import ConvocatoriaDetallesScreen from '../screens/main/ConvocatoriaDetallesScreen';
import QuizScreen from '../screens/quiz/QuizGameScreen';

const Stack = createStackNavigator();

const screenTransition = {
  headerShown: false,
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  animationEnabled: true,
  cardStyleInterpolator: ({ current, layouts }) => ({
    cardStyle: {
      transform: [{
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.width, 0],
        }),
      }],
    },
  }),
};

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ gestureEnabled: false }} />
      <Stack.Screen name="EncontrarConvocatoria" component={EncontrarConvocatoriaScreen} options={screenTransition} />
      <Stack.Screen name="TodasConvocatorias" component={TodasConvocatoriasScreen} options={screenTransition} />
      <Stack.Screen name="SimuladorSalario" component={SimuladorSalarioScreen} options={screenTransition} />
      <Stack.Screen name="CalendarioExamenes" component={CalendarioExamenesScreen} options={screenTransition} />
      <Stack.Screen name="QuizGame" component={QuizScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="QuizDiario" component={QuizDiarioScreen} options={screenTransition} />
      <Stack.Screen name="MaterialesExamenes" component={MaterialesExamenesScreen} options={screenTransition} />
      <Stack.Screen name="MiProgreso" component={MiProgresoScreen} options={screenTransition} />
      <Stack.Screen name="Compartir" component={CompartirScreen} options={screenTransition} />
      <Stack.Screen name="PreguntasFrecuentes" component={PreguntasFrecuentesScreen} options={screenTransition} />
      <Stack.Screen name="Cuenta" component={CuentaScreen} options={screenTransition} />
      <Stack.Screen name="ConvocatoriaDetalles" component={ConvocatoriaDetallesScreen} options={{ headerShown: false, gestureEnabled: true }} />
    </Stack.Navigator>
  );
}
