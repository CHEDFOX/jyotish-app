import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors, spacing } from '../theme';
import { generateKundli, saveUser } from '../api/backend';
import * as Haptics from 'expo-haptics';
import { saveKundliData } from '../api/userService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONTENT = {
  en: {
    generating: 'Reading The Stars...',
    mapping: 'Mapping Your Cosmic Blueprint...',
    calculating: 'Calculating Planetary Positions...',
    complete: 'Your Kundli Is Ready',
    error: 'The Stars Are Unclear. Please Try Again.',
  },
  hi: {
    generating: 'तारों को पढ़ रहे हैं...',
    mapping: 'आपका ब्रह्मांडीय नक्शा बना रहे हैं...',
    calculating: 'ग्रहों की स्थिति की गणना...',
    complete: 'आपकी कुंडली तैयार है',
    error: 'तारे अस्पष्ट हैं। कृपया पुनः प्रयास करें।',
  },
  zh: {
    generating: '解读星象...',
    mapping: '绘制你的宇宙蓝图...',
    calculating: '计算行星位置...',
    complete: '你的星盘已准备好',
    error: '星象不明。请重试。',
  },
  es: {
    generating: 'Leyendo Las Estrellas...',
    mapping: 'Mapeando Tu Huella Cósmica...',
    calculating: 'Calculando Posiciones Planetarias...',
    complete: 'Tu Kundli Está Listo',
    error: 'Las Estrellas No Están Claras. Intenta De Nuevo.',
  },
  pt: {
    generating: 'Lendo As Estrelas...',
    mapping: 'Mapeando Sua Impressão Cósmica...',
    calculating: 'Calculando Posições Planetárias...',
    complete: 'Seu Kundli Está Pronto',
    error: 'As Estrelas Estão Nebulosas. Tente Novamente.',
  },
  ja: {
    generating: '星を読んでいます...',
    mapping: 'あなたの宇宙の青写真を描いています...',
    calculating: '惑星の位置を計算中...',
    complete: 'あなたのクンドリが完成しました',
    error: '星が不明確です。もう一度お試しください。',
  },
};

// Orbiting dots animation
const OrbitingDots = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      rotation.setValue(0);
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start(() => animate());
    };
    animate();
  }, []);

  const dots = [0, 1, 2, 3, 4, 5];
  const radius = 40;

  return (
    <View style={styles.orbitContainer}>
      <View style={styles.centerDot} />
      
      {dots.map((_, index) => {
        const inputRange = [0, 1];
        const angle = (index / dots.length) * 2 * Math.PI;
        
        const rotate = rotation.interpolate({
          inputRange,
          outputRange: [`${angle}rad`, `${angle + 2 * Math.PI}rad`],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.orbitDot,
              {
                transform: [
                  { rotate },
                  { translateX: radius },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

export default function KundliGenerationScreen({ onComplete, language = 'en', birthData, userData }) {
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(false);
  const [kundliData, setKundliData] = useState(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const content = CONTENT[language] || CONTENT.en;

  const stages = [
    content.generating,
    content.mapping,
    content.calculating,
    content.complete,
  ];

  useEffect(() => {
    generateKundliData();
  }, []);

  const generateKundliData = async () => {
    // Stage 1
    setTimeout(() => animateTextChange(() => setStage(1)), 1500);
    
    // Stage 2
    setTimeout(() => animateTextChange(() => setStage(2)), 3000);

    // Call API
    const result = await generateKundli(userData, birthData);
    
    if (result.success) {
  setKundliData(result.data);
  
  // Save kundli data to database
  await saveKundliData(result.data);
      
      // Stage 3 - Complete
      setTimeout(() => {
        animateTextChange(() => setStage(3));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 4500);

      // Proceed to next screen
      setTimeout(() => {
        if (onComplete) onComplete(result.data);
      }, 6000);
    } else {
      setError(true);
      animateTextChange(() => setStage(-1));
    }
  };

  const animateTextChange = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <OrbitingDots />

      <Animated.Text style={[styles.statusText, { opacity: fadeAnim }]}>
        {error ? content.error : stages[stage]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },
  orbitDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.silver,
    letterSpacing: 0.5,
  },
});