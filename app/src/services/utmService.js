// src/services/utmService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import analytics from '@react-native-firebase/analytics';

const UTM_KEY  = '@plazaya:utm_captured';
const SENT_KEY = '@plazaya:utm_sent';

function parseReferrer(str) {
  try {
    const params = {};
    decodeURIComponent(str).split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k && v) params[k.trim()] = v.trim();
    });
    return {
      utm_source:   params.utm_source   || null,
      utm_medium:   params.utm_medium   || null,
      utm_campaign: params.utm_campaign || null,
      utm_content:  params.utm_content  || null,
      utm_term:     params.utm_term     || null,
      gclid:        params.gclid        || null,
    };
  } catch { return {}; }
}

async function sendToFirebase(utms) {
  try {
    await analytics().setUserProperties({
      utm_source:   utms.utm_source   || 'organic',
      utm_medium:   utms.utm_medium   || 'organic',
      utm_campaign: utms.utm_campaign || '(none)',
    });
    await analytics().logEvent('install_attributed', {
      utm_source:   utms.utm_source   || 'organic',
      utm_medium:   utms.utm_medium   || 'organic',
      utm_campaign: utms.utm_campaign || '(none)',
    });
  } catch (e) { console.warn('[UTM] Firebase:', e.message); }
}

export async function captureInstallReferrer() {
  try {
    const done = await AsyncStorage.getItem(SENT_KEY);
    if (done === 'true') return;

    let utms = { utm_source: 'organic', utm_medium: 'organic' };
    try {
      const { PlayInstallReferrer } = await import('react-native-install-referrer');
      const details = await new Promise((res, rej) =>
        PlayInstallReferrer.getInstallReferrerInfo((info, err) => err ? rej(err) : res(info)));
      const ref = details?.installReferrer;
      if (ref && ref !== 'organic') utms = parseReferrer(ref);
    } catch (e) { console.warn('[UTM] referrer indisponible:', e.message); }

    await AsyncStorage.setItem(UTM_KEY, JSON.stringify({ ...utms, captured_at: new Date().toISOString() }));
    await sendToFirebase(utms);
    await AsyncStorage.setItem(SENT_KEY, 'true');
  } catch (e) { console.warn('[UTM] Error:', e.message); }
}

export async function getStoredUtmParams() {
  try {
    const raw = await AsyncStorage.getItem(UTM_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
