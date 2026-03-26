import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useVoltarComNPS } from '../../hooks/useVoltarComNPS';
import AdBanner from '../../components/AdBanner';
import { ADMOB_IDS } from '../../constants/data';

const STORAGE_KEYS = {
  SHARES_COUNT: '@plazaya:compartir_conteo',
  LAST_SHARE_DATE: '@plazaya:compartir_ultima_fecha',
  REFERRAL_CODE: '@plazaya:codigo_referido',
};

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.plazaya.mexico';

const SHARE_MESSAGE =
  '¡Prepárate para tus exámenes y oposiciones con PlazaYa! ' +
  'Quizzes diarios, materiales de estudio, convocatorias actualizadas y mucho más. ' +
  'Descárgala gratis: ';

const CompartirScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [sharesCount, setSharesCount] = useState(0);
  const [referralCode, setReferralCode] = useState('');

  const { voltar: voltarHome } = useVoltarComNPS();

  const loadData = useCallback(async () => {
    try {
      const [count, code] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SHARES_COUNT),
        AsyncStorage.getItem(STORAGE_KEYS.REFERRAL_CODE),
      ]);

      setSharesCount(parseInt(count || '0', 10));

      if (code) {
        setReferralCode(code);
      } else if (user?.id) {
        const generated = `PLAZAYA${user.id.substring(0, 6).toUpperCase()}`;
        setReferralCode(generated);
        await AsyncStorage.setItem(STORAGE_KEYS.REFERRAL_CODE, generated);
      }
    } catch (error) {
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const incrementShareCount = async () => {
    try {
      const newCount = sharesCount + 1;
      setSharesCount(newCount);
      await AsyncStorage.setItem(STORAGE_KEYS.SHARES_COUNT, newCount.toString());

      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SHARE_DATE, today);
    } catch (error) {
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = referralCode
        ? `${PLAY_STORE_URL}&referrer=${referralCode}`
        : PLAY_STORE_URL;

      const result = await Share.share({
        message: SHARE_MESSAGE + shareUrl,
        title: 'PlazaYa - Prepárate para tu plaza',
      });

      if (result.action === Share.sharedAction) {
        await incrementShareCount();
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir. Inténtalo de nuevo.');
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = referralCode
        ? `${PLAY_STORE_URL}&referrer=${referralCode}`
        : PLAY_STORE_URL;

      Clipboard.setString(shareUrl);
      Alert.alert('¡Listo!', 'El enlace se copió al portapapeles.');
      await incrementShareCount();
    } catch (error) {
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      const shareUrl = referralCode
        ? `${PLAY_STORE_URL}&referrer=${referralCode}`
        : PLAY_STORE_URL;

      const whatsappMessage = encodeURIComponent(SHARE_MESSAGE + shareUrl);
      const whatsappUrl = `whatsapp://send?text=${whatsappMessage}`;

      const { Linking } = require('react-native');
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        await incrementShareCount();
      } else {
        Alert.alert(
          'WhatsApp no disponible',
          'Parece que no tienes WhatsApp instalado. Usa el botón de compartir general.'
        );
      }
    } catch (error) {
      handleShare();
    }
  };

  const getShareMilestone = () => {
    if (sharesCount >= 20) return { icon: '🏆', label: 'Embajador PlazaYa' };
    if (sharesCount >= 10) return { icon: '⭐', label: 'Promotor destacado' };
    if (sharesCount >= 5) return { icon: '🌟', label: 'Buen promotor' };
    if (sharesCount >= 1) return { icon: '👍', label: 'Primer compartido' };
    return { icon: '📢', label: 'Aún no has compartido' };
  };

  const milestone = getShareMilestone();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Comparte PlazaYa</Text>
          <Text style={styles.subtitle}>
            Ayuda a más personas a prepararse para sus exámenes
          </Text>
        </View>

        {/* Ilustración / Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🤝</Text>
          <Text style={styles.heroTitle}>¡Comparte con tus amigos!</Text>
          <Text style={styles.heroText}>
            Invita a tus compañeros a estudiar juntos con PlazaYa.
            Mientras más personas se preparen, mejor para todos.
          </Text>
        </View>

        {/* Estadísticas de compartido */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sharesCount}</Text>
            <Text style={styles.statLabel}>Veces compartido</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{milestone.icon}</Text>
            <Text style={styles.statLabel}>{milestone.label}</Text>
          </View>
        </View>

        {/* Código de referido */}
        {referralCode ? (
          <View style={styles.referralContainer}>
            <Text style={styles.referralTitle}>Tu código de referido</Text>
            <View style={styles.referralCodeBox}>
              <Text style={styles.referralCode}>{referralCode}</Text>
            </View>
          </View>
        ) : null}

        {/* Botones de compartir */}
        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity
            style={styles.shareButtonPrimary}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Text style={styles.shareButtonIcon}>📤</Text>
            <Text style={styles.shareButtonPrimaryText}>Compartir PlazaYa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButtonWhatsApp}
            onPress={handleShareWhatsApp}
            activeOpacity={0.7}
          >
            <Text style={styles.shareButtonIcon}>💬</Text>
            <Text style={styles.shareButtonWhatsAppText}>
              Compartir por WhatsApp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButtonSecondary}
            onPress={handleCopyLink}
            activeOpacity={0.7}
          >
            <Text style={styles.shareButtonIcon}>📋</Text>
            <Text style={styles.shareButtonSecondaryText}>Copiar enlace</Text>
          </TouchableOpacity>
        </View>

        {/* Mensaje motivacional */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationTitle}>¿Por qué compartir?</Text>
          <View style={styles.motivationItem}>
            <Text style={styles.motivationBullet}>📚</Text>
            <Text style={styles.motivationText}>
              Ayudas a más personas a prepararse para sus exámenes
            </Text>
          </View>
          <View style={styles.motivationItem}>
            <Text style={styles.motivationBullet}>💪</Text>
            <Text style={styles.motivationText}>
              Estudiar en comunidad aumenta la motivación
            </Text>
          </View>
          <View style={styles.motivationItem}>
            <Text style={styles.motivationBullet}>🎯</Text>
            <Text style={styles.motivationText}>
              Juntos podemos mejorar la app para todos
            </Text>
          </View>
        </View>
      </ScrollView>

      <AdBanner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C40',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  heroEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8C40',
  },
  statIcon: {
    fontSize: 32,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  referralContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  referralTitle: {
    fontSize: 14,
    color: '#FF8C40',
    fontWeight: '500',
    marginBottom: 8,
  },
  referralCodeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FF8C40',
    borderStyle: 'dashed',
  },
  referralCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C40',
    letterSpacing: 2,
  },
  shareButtonsContainer: {
    marginBottom: 24,
  },
  shareButtonPrimary: {
    backgroundColor: '#FF8C40',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shareButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareButtonWhatsApp: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shareButtonWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF8C40',
  },
  shareButtonSecondaryText: {
    color: '#FF8C40',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareButtonIcon: {
    fontSize: 20,
  },
  motivationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  motivationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  motivationBullet: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 0,
  },
  motivationText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    flex: 1,
  },
});

export default CompartirScreen;
