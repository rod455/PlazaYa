// src/services/analyticsService.js
import analytics from '@react-native-firebase/analytics';

async function log(event, params = {}) {
  try { await analytics().logEvent(event, params); }
  catch (e) { console.warn('[Analytics]', event, e.message); }
}

export async function trackScreen(name) {
  try { await analytics().logScreenView({ screen_name: name, screen_class: name }); }
  catch (e) {}
}

export const trackOnboardingStep = (step, field, value) =>
  log('onboarding_step', { step_number: step, field, value });

export async function trackOnboardingComplete(profile) {
  await log('onboarding_complete', {
    area: profile.area || 'no_informado',
    escolaridade: profile.escolaridade || 'no_informado',
    estado: profile.estado || 'no_informado',
    salario: profile.salario || 'no_informado',
  });
  try { await analytics().logTutorialComplete(); } catch (e) {}
}

export const trackQuizStart = (area) => log('quiz_start', { area });

export const trackQuizComplete = (area, score, correct, total) =>
  log('quiz_complete', { area, score, correct_answers: correct, total_questions: total });

export const trackConcursoClick = (nome, area, salario) =>
  log('concurso_click', { concurso_nome: nome, area,
    salario_range: salario > 30000 ? 'arriba_30k' : salario > 15000 ? '15k_30k' : 'hasta_15k' });

export async function setUserProfile(profile) {
  try {
    await analytics().setUserProperties({
      area_interes: profile.area || 'no_definido',
      escolaridad: profile.escolaridade || 'no_definido',
      estado: profile.estado || 'no_definido',
      faja_salarial: profile.salario || 'no_definido',
    });
  } catch (e) { console.warn('[Analytics] setUserProfile:', e.message); }
}

export async function setAnalyticsUserId(userId) {
  try { await analytics().setUserId(String(userId)); }
  catch (e) {}
}
