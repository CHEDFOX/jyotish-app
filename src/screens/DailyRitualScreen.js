import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONTENT = {
  en: {
    welcome: 'Welcome',
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    suggestions: {
      'ACTIVE': 'Today favors bold moves',
      'TRANSFORMATIVE': 'Let go of what no longer serves you',
      'PURIFYING': 'Clarity comes to those who seek truth',
      'CREATIVE': 'Your imagination is your greatest ally',
      'CURIOUS': 'Follow your questions',
      'INTENSE': 'Feel deeply but choose wisely',
      'RENEWING': 'Old patterns end and new ones begin',
      'NURTURING': 'Care for yourself first',
      'INTUITIVE': 'Your gut knows the way',
      'POWERFUL': 'Lead with wisdom not force',
      'JOYFUL': 'Pleasure is the path today',
      'SUPPORTIVE': 'Help given returns tenfold',
      'SKILLFUL': 'Excellence is in the details',
      'FLEXIBLE': 'Adaptability is your strength',
      'DETERMINED': 'Focus wins today',
      'DEVOTED': 'Loyalty deepens bonds',
      'PROTECTIVE': 'Guard what matters most',
      'INVINCIBLE': 'You are stronger than you know',
      'VICTORIOUS': 'Finish what you started',
      'RECEPTIVE': 'Listen more than you speak',
      'PROSPEROUS': 'Abundance flows to the grateful',
      'HEALING': 'Rest is productive today',
      'FIERY': 'Channel passion into purpose',
      'DEEP': 'Surface answers will not satisfy',
      'COMPASSIONATE': 'Kindness is your superpower',
      'BALANCED': 'Seek the middle path',
      'DEFAULT': 'Trust the journey ahead',
    },
  },
  hi: {
    welcome: 'स्वागत है',
    morning: 'सुप्रभात',
    afternoon: 'नमस्कार',
    evening: 'शुभ संध्या',
    suggestions: {
      'DEFAULT': 'यात्रा पर भरोसा करें',
      'RENEWING': 'पुराना खत्म नया शुरू',
      'NURTURING': 'पहले खुद की देखभाल करें',
      'POWERFUL': 'बुद्धि से नेतृत्व करें',
    },
  },
  zh: {
    welcome: '欢迎',
    morning: '早上好',
    afternoon: '下午好',
    evening: '晚上好',
    suggestions: { 'DEFAULT': '相信旅程' },
  },
  es: {
    welcome: 'Bienvenido',
    morning: 'Buenos Días',
    afternoon: 'Buenas Tardes',
    evening: 'Buenas Noches',
    suggestions: { 'DEFAULT': 'Confía en el viaje' },
  },
  pt: {
    welcome: 'Bem-vindo',
    morning: 'Bom Dia',
    afternoon: 'Boa Tarde',
    evening: 'Boa Noite',
    suggestions: { 'DEFAULT': 'Confie na jornada' },
  },
  ja: {
    welcome: 'ようこそ',
    morning: 'おはようございます',
    afternoon: 'こんにちは',
    evening: 'こんばんは',
    suggestions: { 'DEFAULT': '旅を信じて' },
  },
};

export default function DailyRitualScreen({ 
  onContinue, 
  userData, 
  kundliData, 
  language = 'en',
  isNewUser = false 
}) {
  const [loading, setLoading] = useState(!isNewUser);
  const [suggestion, setSuggestion] = useState('');
  const [phase, setPhase] = useState('greeting'); // greeting, name, suggestion, blast
  const [readyToBlast, setReadyToBlast] = useState(false);
  
  const content = CONTENT[language] || CONTENT.en;
  const name = userData?.name || 'Seeker';
  
  // Greeting
  const greeting = isNewUser ? content.welcome : getGreeting();
  const greetingLetters = greeting.split('');
  
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return content.morning;
    if (hour < 17) return content.afternoon;
    return content.evening;
  }

  // Animation refs
  const greetingOpacity = useRef(new Animated.Value(1)).current; // Already visible
  const greetingAnims = useRef(
    greetingLetters.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;
  
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const nameX = useRef(new Animated.Value(0)).current;
  
  // Suggestion animations
  const suggestionWords = suggestion ? suggestion.split(' ') : [];
  const circleOpacity = useRef(new Animated.Value(0)).current;
  const lineOpacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const suggestionWordAnims = useRef([]).current;

  useEffect(() => {
    if (isNewUser) {
      startNewUserAnimation();
    } else {
      fetchSuggestion();
    }
  }, []);

  // Initialize suggestion word anims when suggestion changes
  useEffect(() => {
    if (suggestion) {
      suggestionWordAnims.length = 0;
      suggestion.split(' ').forEach(() => {
        suggestionWordAnims.push({
          x: new Animated.Value(0),
          y: new Animated.Value(0),
          rotate: new Animated.Value(0),
          opacity: new Animated.Value(1),
        });
      });
      
      // Start suggestion animation
      startSuggestionAnimation();
    }
  }, [suggestion]);

  const fetchSuggestion = async () => {
    try {
      const response = await fetch('http://91.108.104.168:8080/api/public/daily-ritual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          kundli_data: kundliData || {},
        }),
      });
      
      const data = await response.json();
      const energy = data.success ? data.energy : 'DEFAULT';
      const suggestionText = content.suggestions[energy] || content.suggestions['DEFAULT'];
      
      setLoading(false);
      
      // Start name animation first
      startNameAnimation(() => {
        // After name appears, wait then show suggestion
        setTimeout(() => {
          setSuggestion(suggestionText);
        }, 800);
      });
      
    } catch (error) {
      console.error('Daily ritual error:', error);
      setLoading(false);
      setSuggestion(content.suggestions['DEFAULT']);
      startNameAnimation(() => {
        setTimeout(() => {
          setSuggestion(content.suggestions['DEFAULT']);
        }, 800);
      });
    }
  };

  const startNewUserAnimation = () => {
    // Name fades in
    setTimeout(() => {
      Animated.timing(nameOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        // Pause then blast
        setTimeout(() => {
          blastSequence();
        }, 1500);
      });
    }, 500);
  };

  const startNameAnimation = (callback) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.timing(nameOpacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (callback) callback();
    });
  };

  const startSuggestionAnimation = () => {
    setPhase('suggestion');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Circle appears and rotates
    Animated.parallel([
      Animated.timing(circleOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();

    // At 2.5s, start the flow transition
    setTimeout(() => {
      flowToLine();
    }, 2500);
  };

  const flowToLine = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simultaneous: circle fades, line appears, rotation slows
    Animated.parallel([
      // Circle fades out
      Animated.timing(circleOpacity, {
        toValue: 0,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Line fades in
      Animated.timing(lineOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      // Rotation continues but slows (already at 1, go to 1.2)
      Animated.timing(rotation, {
        toValue: 1.3,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Pause for reading
      setTimeout(() => {
        blastSequence();
      }, 1500);
    });
  };

  const blastSequence = () => {
    setPhase('blast');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // 1. Blast greeting (letter by letter)
    blastGreeting(() => {
      // 2. Blast suggestion (word by word) - only for returning users
      if (!isNewUser && suggestionWordAnims.length > 0) {
        blastSuggestion(() => {
          // 3. Name slides out right
          exitName();
        });
      } else {
        // New user: just exit name
        exitName();
      }
    });
  };

  const blastGreeting = (callback) => {
    const anims = greetingAnims.map((anim, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = SCREEN_WIDTH * 1.5;
      const delay = i * 25;
      
      return Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * distance,
          duration: 350,
          delay,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * distance,
          duration: 350,
          delay,
          easing: Easing.in(Easing.cubic),
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
      setTimeout(callback, 50);
    });
  };

  const blastSuggestion = (callback) => {
    const anims = suggestionWordAnims.map((anim, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = SCREEN_WIDTH * 1.5;
      const delay = i * 50;
      
      return Animated.parallel([
        Animated.timing(anim.x, {
          toValue: Math.cos(angle) * distance,
          duration: 300,
          delay,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: Math.sin(angle) * distance,
          duration: 300,
          delay,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: (Math.random() - 0.5) * 540,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 200,
          delay: delay + 100,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(anims).start(() => {
      setTimeout(callback, 50);
    });
  };

  const exitName = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.timing(nameX, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(nameOpacity, {
        toValue: 0,
        duration: 150,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onContinue) onContinue();
    });
  };

  // Render greeting
  const renderGreeting = () => {
    return (
      <View style={styles.greetingContainer}>
        {greetingLetters.map((char, i) => {
          const anim = greetingAnims[i];
          
          return (
            <Animated.Text
              key={i}
              style={[
                styles.greetingChar,
                {
                  opacity: anim.opacity,
                  transform: [
                    { translateX: anim.x },
                    { translateY: anim.y },
                    { rotate: anim.rotate.interpolate({
                      inputRange: [-720, 720],
                      outputRange: ['-720deg', '720deg'],
                    })},
                  ],
                },
              ]}
            >
              {char === ' ' ? '\u00A0' : char}
            </Animated.Text>
          );
        })}
      </View>
    );
  };

  // Render name
  const renderName = () => {
    return (
      <Animated.Text
        style={[
          styles.name,
          {
            opacity: nameOpacity,
            transform: [{ translateX: nameX }],
          },
        ]}
      >
        {name}
      </Animated.Text>
    );
  };

  // Render suggestion (circle and line versions)
  const renderSuggestion = () => {
    if (isNewUser || !suggestion) return null;
    
    const words = suggestion.split(' ');
    const RADIUS = 55;
    
    const rotationDeg = rotation.interpolate({
      inputRange: [0, 1, 1.3],
      outputRange: ['0deg', '360deg', '468deg'],
    });

    return (
      <View style={styles.suggestionWrapper}>
        {/* Circle formation */}
        <Animated.View
          style={[
            styles.circleContainer,
            {
              opacity: circleOpacity,
              transform: [{ rotate: rotationDeg }],
            },
          ]}
        >
          {words.map((word, i) => {
            const angle = (i / words.length) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * RADIUS;
            const y = Math.sin(angle) * RADIUS;
            const wordRotation = (angle + Math.PI / 2) * (180 / Math.PI);
            
            return (
              <Text
                key={`circle-${i}`}
                style={[
                  styles.suggestionWord,
                  {
                    position: 'absolute',
                    transform: [
                      { translateX: x },
                      { translateY: y },
                      { rotate: `${wordRotation}deg` },
                    ],
                  },
                ]}
              >
                {word}
              </Text>
            );
          })}
        </Animated.View>

        {/* Line formation */}
        <Animated.View
          style={[
            styles.lineContainer,
            { opacity: lineOpacity },
          ]}
        >
          {words.map((word, i) => {
            const anim = suggestionWordAnims[i];
            if (!anim) return null;
            
            return (
              <Animated.Text
                key={`line-${i}`}
                style={[
                  styles.suggestionWordLine,
                  phase === 'blast' && {
                    opacity: anim.opacity,
                    transform: [
                      { translateX: anim.x },
                      { translateY: anim.y },
                      { rotate: anim.rotate.interpolate({
                        inputRange: [-540, 540],
                        outputRange: ['-540deg', '540deg'],
                      })},
                    ],
                  },
                ]}
              >
                {word}{' '}
              </Animated.Text>
            );
          })}
        </Animated.View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.greetingContainer}>
          {greetingLetters.map((char, i) => (
            <Text key={i} style={styles.greetingChar}>
              {char === ' ' ? '\u00A0' : char}
            </Text>
          ))}
        </View>
        <ActivityIndicator size="small" color={colors.silver} style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderGreeting()}
      {renderName()}
      {renderSuggestion()}
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
  greetingContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38,
  },
  greetingChar: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.silver,
    letterSpacing: 1,
  },
  name: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.white,
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.38 + 40,
    letterSpacing: 0.5,
  },
  suggestionWrapper: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.55,
    width: SCREEN_WIDTH,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  suggestionWord: {
    fontSize: 13,
    fontWeight: '300',
    color: colors.white,
    letterSpacing: 0.3,
  },
  lineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    paddingHorizontal: spacing.lg,
  },
  suggestionWordLine: {
    fontSize: 15,
    fontWeight: '300',
    color: colors.white,
    letterSpacing: 0.3,
  },
});