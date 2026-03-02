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
    title: 'Know What The Stars',
    subtitle: 'Hold For You',
    button: 'Turn The Key',
    welcome: 'You Were Always Meant To Be Here',
  },
  hi: {
    title: 'जानिए सितारे',
    subtitle: 'क्या कहते हैं',
    button: 'चाबी घुमाएं',
    welcome: 'आप हमेशा से यहां के लिए थे',
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
    welcome: 'Siempre Estuviste Destinado A Estar Aquí',
  },
  pt: {
    title: 'Descubra O Que',
    subtitle: 'As Estrelas Reservam',
    button: 'Gire A Chave',
    welcome: 'Você Sempre Estava Destinado A Estar Aqui',
  },
  ja: {
    title: '星が何を',
    subtitle: '示しているか知る',
    button: '鍵を回す',
    welcome: 'あなたは最初からここにいる運命でした',
  },
};

// Snake Uncoil Animation
const SnakeAnimation = ({ text, onComplete }) => {
  const words = text.split(' ');
  const numWords = words.length;
  const RADIUS = 55;
  
  const [phase, setPhase] = useState('rotate'); // rotate, slither, line, blast
  
  // Master rotation
  const rotation = useRef(new Animated.Value(0)).current;
  
  // Each word has its own progress (0 = circle, 1 = line)
  // Last word (HEAD) moves first, others follow
  const wordProgress = useRef(words.map(() => new Animated.Value(0))).current;
  
  // Blast animations
  const blastAnims = useRef(
    words.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // Calculate line X positions
  const getLineX = (index) => {
    const wordWidths = words.map(w => w.length * 9 + 8);
    const totalWidth = wordWidths.reduce((a, b) => a + b, 0);
    let x = -totalWidth / 2;
    for (let i = 0; i < index; i++) {
      x += wordWidths[i];
    }
    x += wordWidths[index] / 2;
    return x;
  };

  useEffect(() => {
    startAnimation();
  }, []);

  const startAnimation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Slow rotation
    Animated.timing(rotation, {
      toValue: 1.5,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      slither();
    });
  };

  const slither = () => {
    setPhase('slither');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // HEAD (last word) moves first
    // Each subsequent word follows with delay
    // Like a snake's body following its head
    
    const animations = [];
    
    // Start from LAST word (head) to FIRST word (tail)
    for (let i = numWords - 1; i >= 0; i--) {
      const delay = (numWords - 1 - i) * 120; // 120ms between each word
      
      animations.push(
        Animated.timing(wordProgress[i], {
          toValue: 1,
          duration: 500,
          delay: delay,
          easing: Easing.out(Easing.cubic), // Fast start, slow end (natural motion)
          useNativeDriver: true,
        })
      );
    }
    
    Animated.parallel(animations).start(() => {
      setPhase('line');
      
      // Pause to read
      setTimeout(() => {
        blast();
      }, 1200);
    });
  };

  const blast = () => {
    setPhase('blast');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    const anims = blastAnims.map((anim, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = SCREEN_WIDTH * 1.5;
      const delay = i * 35;
      
      return Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * distance,
          duration: 350,
          delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * distance,
          duration: 350,
          delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: (Math.random() - 0.5) * 720,
          duration: 350,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 200,
          delay: delay + 150,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(anims).start(() => {
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 100);
    });
  };

  const masterRotation = rotation.interpolate({
    inputRange: [0, 1.5],
    outputRange: ['0deg', '540deg'],
  });

  const renderWord = (word, index) => {
    // Circle position
    const circleAngle = (index / numWords) * Math.PI * 2 - Math.PI / 2;
    const circleX = Math.cos(circleAngle) * RADIUS;
    const circleY = Math.sin(circleAngle) * RADIUS;
    const circleTangent = circleAngle + Math.PI / 2;
    
    // Line position
    const lineX = getLineX(index);
    const lineY = 0;
    
    // Progress interpolation
    const progress = wordProgress[index];
    
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [circleX, lineX],
    });
    
    const translateY = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [circleY, lineY],
    });
    
    const wordRotate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [`${circleTangent * (180 / Math.PI)}deg`, '0deg'],
    });

    // Blast
    if (phase === 'blast') {
      const blast = blastAnims[index];
      return (
        <Animated.Text
          key={index}
          style={[
            styles.word,
            {
              position: 'absolute',
              opacity: blast.opacity,
              transform: [
                { translateX: Animated.add(translateX, blast.x) },
                { translateY: Animated.add(translateY, blast.y) },
                { rotate: blast.rotate.interpolate({
                  inputRange: [-720, 720],
                  outputRange: ['-720deg', '720deg'],
                })},
              ],
            },
          ]}
        >
          {word}
        </Animated.Text>
      );
    }

    return (
      <Animated.Text
        key={index}
        style={[
          styles.word,
          {
            position: 'absolute',
            transform: [
              { translateX },
              { translateY },
              { rotate: wordRotate },
            ],
          },
        ]}
      >
        {word}
      </Animated.Text>
    );
  };

  return (
    <View style={styles.animationContainer}>
      <Animated.View
        style={[
          styles.wordContainer,
          phase === 'rotate' && {
            transform: [{ rotate: masterRotation }],
          },
        ]}
      >
        {words.map((word, i) => renderWord(word, i))}
      </Animated.View>
    </View>
  );
};

export default function PaymentScreen({ onComplete, language = 'en' }) {
  const [paymentDone, setPaymentDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const content = CONTENT[language] || CONTENT.en;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePayment = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    setTimeout(async () => {
      await markUserAsPaid();
      
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setPaymentDone(true);
      });
    }, 300);
  };

  if (paymentDone) {
    return (
      <View style={styles.container}>
        <SnakeAnimation
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

        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>{content.button}</Text>
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
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.void,
    letterSpacing: 1,
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordContainer: {
    width: 280,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    fontSize: 15,
    fontWeight: '300',
    color: colors.white,
    letterSpacing: 0.5,
  },
});
