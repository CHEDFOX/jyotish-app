import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const GREETINGS = [
  { text: 'नमस्ते', lang: 'hi' },
  { text: 'Hello', lang: 'en' },
  { text: '你好', lang: 'zh' },
  { text: 'Hola', lang: 'es' },
  { text: 'Olá', lang: 'pt' },
  { text: 'こんにちは', lang: 'ja' },
];

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'zh', name: '中文' },
  { code: 'es', name: 'Español' },
  { code: 'pt', name: 'Português' },
  { code: 'ja', name: '日本語' },
];

export default function LanguageSelectScreen({ onSelect }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const greetingFade = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(greetingFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(prev => (prev + 1) % GREETINGS.length);
        Animated.timing(greetingFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSelect = (langCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onSelect) onSelect(langCode);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Greeting */}
        <Animated.Text style={[styles.greeting, { opacity: greetingFade }]}>
          {GREETINGS[currentIndex].text}
        </Animated.Text>

        {/* Language boxes */}
        <View style={styles.languageContainer}>
          <View style={styles.languageGrid}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.langBox}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langText}>{lang.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  greeting: {
    fontSize: 52,
    fontWeight: '200',
    color: colors.white,
    textAlign: 'center',
    marginTop: SCREEN_HEIGHT * 0.25,
    letterSpacing: 1,
  },
  languageContainer: {
    position: 'absolute',
    bottom: 80,
    left: spacing.lg,
    right: spacing.lg,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  langBox: {
    width: 105,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.ash,
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.sm,
  },
  langText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.white,
    letterSpacing: 0.3,
  },
});