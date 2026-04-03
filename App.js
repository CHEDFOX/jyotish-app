import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Platform } from 'react-native';
import { supabase } from './src/api/supabase';
import { getUserProfile } from './src/api/userService';
import { colors } from './src/theme';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Font from 'expo-font';

import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectScreen from './src/screens/LanguageSelectScreen';
import AuthScreen from './src/screens/AuthScreen';
import BirthDetailsScreen from './src/screens/BirthDetailsScreen';
import KundliGenerationScreen from './src/screens/KundliGenerationScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import DailyRitualScreen from './src/screens/DailyRitualScreen';
import HomeScreen from './src/screens/HomeScreen';
import KundliMatchScreen from './src/screens/KundliMatchScreen';
import FeatureScreen from './src/screens/feature/FeatureScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Font families mapping
const FONT_FAMILIES = {
  sans: undefined, // system default
  serif: 'NotoSerif',
  classic: 'PlayfairDisplay',
};

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [birthData, setBirthData] = useState(null);
  const [kundliData, setKundliData] = useState(null);
  const [showDailyRitual, setShowDailyRitual] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [typography, setTypography] = useState('sans');

  // Load fonts + saved preferences
  useEffect(() => {
    const init = async () => {
      try {
        await Font.loadAsync({
          'NotoSerif': require('./assets/fonts/NotoSerif-Regular.ttf'),
          'PlayfairDisplay': require('./assets/fonts/PlayfairDisplay-Regular.ttf'),
        });
      } catch (e) {
        console.log('Font loading failed:', e);
      }
      setFontsLoaded(true);

      try {
        const savedLang = await SecureStore.getItemAsync('user_language');
        if (savedLang) setLanguage(savedLang);
        const savedTypo = await SecureStore.getItemAsync('user_typography');
        if (savedTypo) setTypography(savedTypo);
      } catch (e) {}
    };
    init();
  }, []);

  // Auth state
  useEffect(() => {
    if (!fontsLoaded) return;
    checkAuthState();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) await handleSignedInUser(session.user);
      else if (event === 'SIGNED_OUT') resetToStart();
    });
    return () => subscription.unsubscribe();
  }, [fontsLoaded]);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await handleSignedInUser(session.user);
      else setScreen('splash');
    } catch (e) { setScreen('splash'); }
  };

  const handleSignedInUser = async (authUser) => {
    try {
      const result = await getUserProfile();
      if (result.success && result.data) {
        const p = result.data;
        setUser({ id: authUser.id, email: authUser.email, name: p.name });
        if (p.is_paid && p.kundli_data) {
          setBirthData({ date: p.birth_date, time: p.birth_time, place: { name: p.birth_place, lat: p.birth_lat, lng: p.birth_lng } });
          setKundliData(p.kundli_data); setScreen('home');
        } else if (p.kundli_data && !p.is_paid) { setKundliData(p.kundli_data); setScreen('payment'); }
        else if (p.birth_date) { setBirthData({ date: p.birth_date, time: p.birth_time, place: { name: p.birth_place, lat: p.birth_lat, lng: p.birth_lng } }); setScreen('kundli'); }
        else if (p.name) setScreen('birth');
        else setScreen('language');
      } else setScreen('language');
    } catch (e) { setScreen('splash'); }
  };

  // Push notifications
  useEffect(() => {
    if (kundliData && user) registerPushNotifications();
  }, [kundliData, user]);

  const registerPushNotifications = async () => {
    try {
      if (!Device.isDevice) return;
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;
      const raw = kundliData?.raw || {};
      const bd = raw.birth_details || {};

      await fetch('https://api.plutto.space/api/public/register-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || user?.name || 'unknown',
          push_token: pushToken,
          birth_details: { year: bd.year, month: bd.month, day: bd.day, hour: bd.hour, minute: bd.minute, latitude: bd.latitude, longitude: bd.longitude },
          language: language,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily', {
          name: 'Daily Insights',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
      }
    } catch (e) { console.log('Push registration failed:', e); }
  };

  const resetToStart = () => { setUser(null); setBirthData(null); setKundliData(null); setScreen('language'); };
  const handleLogout = async () => { await supabase.auth.signOut(); resetToStart(); };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    await SecureStore.setItemAsync('user_language', lang);
  };

  const handleTypographyChange = async (typo) => {
    setTypography(typo);
    await SecureStore.setItemAsync('user_typography', typo);
  };

  const handleNavigate = (target) => setScreen(target);
  const handleBack = () => { setScreen('home'); setShowDailyRitual(false); };

  // Get current font family
  const fontFamily = FONT_FAMILIES[typography];

  if (!fontsLoaded || screen === 'loading') return <View style={{ flex: 1, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center' }}><StatusBar style="light" /><ActivityIndicator size="large" color={colors.white} /></View>;
  if (screen === 'splash') return <><StatusBar style="light" /><SplashScreen onComplete={() => setScreen('language')} /></>;
  if (screen === 'language') return <><StatusBar style="light" /><LanguageSelectScreen onSelect={async (lang) => { setLanguage(lang); await SecureStore.setItemAsync('user_language', lang); setScreen('auth'); }} /></>;
  if (screen === 'auth') return <><StatusBar style="light" /><AuthScreen language={language} onBack={() => setScreen('language')} onComplete={(ud) => { setUser(ud); setScreen('birth'); }} /></>;
  if (screen === 'birth') return <><StatusBar style="light" /><BirthDetailsScreen language={language} onBack={() => setScreen('auth')} onComplete={(d) => { setBirthData(d); setScreen('kundli'); }} /></>;
  if (screen === 'kundli') return <><StatusBar style="light" /><KundliGenerationScreen language={language} birthData={birthData} userData={user} onComplete={(d) => { setKundliData(d); setScreen('payment'); }} /></>;
  if (screen === 'payment') return <><StatusBar style="light" /><PaymentScreen language={language} onComplete={() => { setIsNewUser(true); setShowDailyRitual(true); setScreen('home'); }} /></>;
  if (showDailyRitual) return <><StatusBar style="light" /><DailyRitualScreen language={language} userData={user} kundliData={kundliData} isNewUser={isNewUser} onContinue={() => { setShowDailyRitual(false); setIsNewUser(false); }} /></>;
  if (screen === 'match') return <><StatusBar style="light" /><KundliMatchScreen kundliData={kundliData} language={language} onBack={handleBack} /></>;

  // ─── FEATURE SCREENS ───
  const FEATURE_IDS = [
    'daily-vibe', 'power-hours', 'planet-strength', 'festivals',
    'cosmic-match', 'ideal-partner', 'match-oracle', 'relationship-xray',
    'soul-profile', 'rare-traits', 'cosmic-novel', 'personal-deities',
    'money-calendar', 'gemstone-profile', 'year-map', 'danger-radar',
    'what-if', 'find-muhurta', 'past-event', 'family-karma',
  ];
  if (FEATURE_IDS.includes(screen)) {
    return <><StatusBar style="light" /><FeatureScreen featureId={screen} kundliData={kundliData} language={language} onBack={handleBack} /></>;
  }

  return <><StatusBar style="light" /><HomeScreen language={language} userData={user} birthData={birthData} kundliData={kundliData} onLogout={handleLogout} onLanguageChange={handleLanguageChange} onNavigate={handleNavigate} chatMessages={chatMessages} onMessagesChange={setChatMessages} fontFamily={fontFamily} typography={typography} onTypographyChange={handleTypographyChange} /></>;
}