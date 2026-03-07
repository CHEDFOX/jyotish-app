import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { colors, spacing } from '../theme';
import { markUserAsPaid } from '../api/userService';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONTENT = {
  en: {
    title: 'See What The Stars',
    subtitle: 'Hold For You',
    button: 'Turn The Key',
    welcome: 'You Were Meant To Be Here',
  },
  hi: {
    title: 'जानिए सितारे',
    subtitle: 'क्या कहते हैं',
    button: 'चाबी घुमाएं',
    welcome: 'आप यहां के लिए बने थे',
  },
  zh: {
    title: '了解星星',
    subtitle: '为你准备了什么',
    button: '转动钥匙',
    welcome: '你注定属于这里',
  },
  es: {
    title: 'Descubre Lo Que',
    subtitle: 'Las Estrellas Guardan',
    button: 'Gira La Llave',
    welcome: 'Estabas Destinado A Estar Aquí',
  },
  pt: {
    title: 'Descubra O Que',
    subtitle: 'As Estrelas Reservam',
    button: 'Gire A Chave',
    welcome: 'Você Estava Destinado A Estar Aqui',
  },
  ja: {
    title: '星が何を',
    subtitle: '示しているか知る',
    button: '鍵を回す',
    welcome: 'あなたはここにいる運命でした',
  },
};

// Blackhole Pull Animation - Text appears then gets sucked into center
const BlackholeAnimation = ({ text, onComplete }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1.2)).current;
  const translateY = useRef(new Animated.Value(-50)).current;
  
  // For the "pull" effect
  const pullScale = useRef(new Animated.Value(1)).current;
  const pullOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Step 1: Text fades in and settles
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Step 2: Pause for reading (1.8 seconds)
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        
        // Step 3: BLACKHOLE PULL - Fast suck into center
        Animated.parallel([
          // Scale down rapidly (sucked in)
          Animated.timing(pullScale, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.exp), // Exponential = slow start, VERY fast end
            useNativeDriver: true,
          }),
          // Fade out at the end
          Animated.timing(pullOpacity, {
            toValue: 0,
            duration: 200,
            delay: 150,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Step 4: Go to next screen
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 150);
        });
      }, 1800);
    });
  }, []);

  return (
    <View style={styles.welcomeContainer}>
      <Animated.Text
        style={[
          styles.welcomeText,
          {
            opacity: Animated.multiply(opacity, pullOpacity),
            transform: [
              { translateY },
              { scale: Animated.multiply(scale, pullScale) },
            ],
          },
        ]}
      >
        {text}
      </Animated.Text>
      
      {/* Blackhole center point (invisible but adds to effect) */}
      <View style={styles.blackholeCenter} />
    </View>
  );
};

export default function PaymentScreen({ onComplete, language = 'en' }) {
  const [paymentDone, setPaymentDone] = useState(false);
  const [isKeyTurning, setIsKeyTurning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const keyRotation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const content = CONTENT[language] || CONTENT.en;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePayment = async () => {
    if (isKeyTurning) return;
    
    setIsKeyTurning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Button press feedback
    Animated.timing(buttonScale, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();

    // Step 1: Little pause (400ms)
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Step 2: Slow tilt 30° like door handle (from right side)
      Animated.timing(keyRotation, {
        toValue: 1,
        duration: 600, // Slow rotation
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        await markUserAsPaid();
        
        // Small pause after key turned
        setTimeout(() => {
          // Fade out everything
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => {
            setPaymentDone(true);
          });
        }, 300);
      });
    }, 400);
  };

  // Key rotation interpolation - tilts from right side like door handle
  const buttonRotate = keyRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-30deg'], // Negative = tilts left (handle going down on right)
  });

  // Pivot point shift - makes it rotate from the right edge
  const buttonTranslateX = keyRotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  const buttonTranslateY = keyRotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 5],
  });

  if (paymentDone) {
    return (
      <View style={styles.container}>
        <BlackholeAnimation
          text={content.welcome}
          onComplete={onComplete}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim },
        ]}
      >
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>

        <TouchableOpacity 
          activeOpacity={1}
          onPress={handlePayment}
          disabled={isKeyTurning}
        >
          <Animated.View 
            style={[
              styles.payButton,
              {
                transform: [
                  { scale: buttonScale },
                  { rotate: buttonRotate },
                  { translateX: buttonTranslateX },
                  { translateY: buttonTranslateY },
                ],
              },
            ]}
          >
            <Text style={styles.payButtonText}>{content.button}</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  payButton: {
    marginTop: spacing.xxl * 2.5,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl * 1.5,
    backgroundColor: colors.white,
    borderRadius: 30,
    // Shadow for depth
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.void,
    letterSpacing: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 2,
    lineHeight: 40,
  },
  blackholeCenter: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
});
