// src/services/analyticsService.js
// PlazaYa — Analytics stubs (sem Firebase por enquanto)
// TODO: Adicionar Firebase Analytics depois da aprovação na Play Store

export async function trackScreen(screenName) {
  console.log('[Analytics] Screen:', screenName);
}

export async function setAnalyticsUserId(userId) {
  console.log('[Analytics] UserId:', userId);
}

export async function logEvent(eventName, params = {}) {
  console.log('[Analytics] Event:', eventName, params);
}
