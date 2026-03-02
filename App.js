import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './src/api/supabase';
import { getUserProfile } from './src/api/userService';
import { colors } from './src/theme';
import DailyRitualScreen from './src/screens/DailyRitualScreen';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelectScreen from './src/screens/LanguageSelectScreen';
import AuthScreen from './src/screens/AuthScreen';
import BirthDetailsScreen from './src/screens/BirthDetailsScreen';
import KundliGenerationScreen from './src/screens/KundliGenerationScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [screen, setScreen] = useState('loading');
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [birthData, setBirthData] = useState(null);
  const [kundliData, setKundliData] = useState(null);
  const [showDailyRitual, setShowDailyRitual] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  

  useEffect(() => {
    checkAuthState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        if (event === 'SIGNED_IN' && session?.user) {
          await handleSignedInUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          resetToStart();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthState = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await handleSignedInUser(session.user);
      } else {
        setScreen('splash');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setScreen('splash');
    }
  };

  const handleSignedInUser = async (authUser) => {
    try {
      const result = await getUserProfile();
      
      if (result.success && result.data) {
        const profile = result.data;
        
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: profile.name,
        });

        // Route based on user progress
        if (profile.is_paid && profile.kundli_data) {
          // Paid user with kundli → Home
          setBirthData({
            date: profile.birth_date,
            time: profile.birth_time,
            place: {
              name: profile.birth_place,
              lat: profile.birth_lat,
              lng: profile.birth_lng,
            },
          });
          setKundliData(profile.kundli_data);
          setScreen('home');
        } else if (profile.kundli_data && !profile.is_paid) {
          // Has kundli but not paid → Payment
          setKundliData(profile.kundli_data);
          setScreen('payment');
        } else if (profile.birth_date) {
          // Has birth data → Generate kundli
          setBirthData({
            date: profile.birth_date,
            time: profile.birth_time,
            place: {
              name: profile.birth_place,
              lat: profile.birth_lat,
              lng: profile.birth_lng,
            },
          });
          setScreen('kundli');
        } else if (profile.name) {
          // Has name → Get birth details
          setScreen('birth');
        } else {
          // New user → Auth
          setScreen('language');
        }
      } else {
        setScreen('language');
      }
    } catch (error) {
      console.error('Profile check error:', error);
      setScreen('splash');
    }
  };

  const resetToStart = () => {
    setUser(null);
    setBirthData(null);
    setKundliData(null);
    setScreen('language');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetToStart();
  };

  // Loading
  if (screen === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.void, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    );
  }

  // Splash
  if (screen === 'splash') {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onComplete={() => setScreen('language')} />
      </>
    );
  }

  // Language
  if (screen === 'language') {
    return (
      <>
        <StatusBar style="light" />
        <LanguageSelectScreen
          onSelect={(lang) => {
            setLanguage(lang);
            setScreen('auth');
          }}
        />
      </>
    );
  }

  // Auth
  if (screen === 'auth') {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen
          language={language}
          onComplete={(userData) => {
            setUser(userData);
            setScreen('birth');
          }}
        />
      </>
    );
  }

  // Birth Details
  if (screen === 'birth') {
    return (
      <>
        <StatusBar style="light" />
        <BirthDetailsScreen
          language={language}
          onComplete={(data) => {
            setBirthData(data);
            setScreen('kundli');
          }}
        />
      </>
    );
  }

  // Kundli Generation
  if (screen === 'kundli') {
    return (
      <>
        <StatusBar style="light" />
        <KundliGenerationScreen
          language={language}
          birthData={birthData}
          userData={user}
          onComplete={(data) => {
            setKundliData(data);
            setScreen('payment');
          }}
        />
      </>
    );
  }

  // Payment
if (screen === 'payment') {
  return (
    <>
      <StatusBar style="light" />
      <PaymentScreen
        language={language}
        onComplete={() => {
          setIsNewUser(true);
          setShowDailyRitual(true);
          setScreen('home');
        }}
      />
    </>
  );
}



  
  // Daily Ritual (shown once per session before Home)
if (showDailyRitual) {
  return (
    <>
      <StatusBar style="light" />
      <DailyRitualScreen
        language={language}
        userData={user}
        kundliData={kundliData}
        isNewUser={isNewUser}
        onContinue={() => {
          setShowDailyRitual(false);
          setIsNewUser(false);
        }}
      />
    </>
  );
}

// Home
return (
  <>
    <StatusBar style="light" />
    <HomeScreen
      language={language}
      userData={user}
      birthData={birthData}
      kundliData={kundliData}
      onLogout={handleLogout}
    />
  </>
);
}