import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Multi-language content
const SOUL_CONTENT = {
  en: { dharma: 'dharma', karma: 'karma', kama: 'kama', moksha: 'moksha' },
  hi: { dharma: 'धर्म', karma: 'कर्म', kama: 'काम', moksha: 'मोक्ष' },
  zh: { dharma: '法', karma: '业', kama: '欲', moksha: '解脱' },
  es: { dharma: 'dharma', karma: 'karma', kama: 'deseo', moksha: 'libertad' },
  pt: { dharma: 'dharma', karma: 'karma', kama: 'desejo', moksha: 'libertação' },
  ja: { dharma: 'ダルマ', karma: 'カルマ', kama: '欲望', moksha: '解脱' },
};

// Transformed mystical words - Multi-language
const TRANSFORMS = {
  en: {
    dharma: {
      'Sun': 'throne awaits',
      'Moon': 'soul whisper',
      'Mars': 'blade of dawn',
      'Mercury': 'keeper of secrets',
      'Jupiter': 'sacred flame',
      'Venus': 'dream weaver',
      'Saturn': 'silent architect',
    },
    karma: {
      'Aries': 'embrace stillness',
      'Taurus': 'release the grip',
      'Gemini': 'silence within',
      'Cancer': 'walls of heart',
      'Leo': 'bow to rise',
      'Virgo': 'accept cracks',
      'Libra': 'walk alone',
      'Scorpio': 'trust the fall',
      'Sagittarius': 'honor anchor',
      'Capricorn': 'know your gold',
      'Aquarius': 'feel to heal',
      'Pisces': 'touch earth',
    },
    kama: {
      'Aries': 'unchained',
      'Taurus': 'velvet hunger',
      'Gemini': 'infinite curious',
      'Cancer': 'fortress of love',
      'Leo': 'blinding light',
      'Virgo': 'perfect chaos',
      'Libra': 'beautiful balance',
      'Scorpio': 'drown willing',
      'Sagittarius': 'horizon chase',
      'Capricorn': 'empire builder',
      'Aquarius': 'break mold',
      'Pisces': 'ocean feeling',
    },
    moksha: {
      'Aries': 'burn to become',
      'Taurus': 'dissolve still',
      'Gemini': 'know unknow',
      'Cancer': 'return source',
      'Leo': 'shine then fade',
      'Virgo': 'serve vanish',
      'Libra': 'merge as one',
      'Scorpio': 'die to live',
      'Sagittarius': 'wander wonder',
      'Capricorn': 'climb crumble',
      'Aquarius': 'free world',
      'Pisces': 'fall to fly',
    },
  },
  hi: {
    dharma: {
      'Sun': 'सिंहासन प्रतीक्षा',
      'Moon': 'आत्मा की फुसफुस',
      'Mars': 'सुबह की तलवार',
      'Mercury': 'रहस्य रक्षक',
      'Jupiter': 'पवित्र अग्नि',
      'Venus': 'सपनों का जाल',
      'Saturn': 'मौन शिल्पी',
    },
    karma: {
      'Aries': 'शांति अपनाओ', 'Taurus': 'पकड़ छोड़ो', 'Gemini': 'मौन भीतर',
      'Cancer': 'दिल की दीवार', 'Leo': 'झुको उठो', 'Virgo': 'दरार स्वीकारो',
      'Libra': 'अकेले चलो', 'Scorpio': 'गिरने पर भरोसा', 'Sagittarius': 'लंगर सम्मान',
      'Capricorn': 'अपना सोना जानो', 'Aquarius': 'महसूस करो', 'Pisces': 'धरती छुओ',
    },
    kama: {
      'Aries': 'मुक्त आत्मा', 'Taurus': 'मखमल भूख', 'Gemini': 'अनंत जिज्ञासा',
      'Cancer': 'प्रेम किला', 'Leo': 'अंधा प्रकाश', 'Virgo': 'परिपूर्ण अराजकता',
      'Libra': 'सुंदर संतुलन', 'Scorpio': 'स्वेच्छा डूबो', 'Sagittarius': 'क्षितिज पीछा',
      'Capricorn': 'साम्राज्य निर्माता', 'Aquarius': 'साँचा तोड़ो', 'Pisces': 'भावों सागर',
    },
    moksha: {
      'Aries': 'जलकर बनो', 'Taurus': 'शांति में विलीन', 'Gemini': 'जानो न जानो',
      'Cancer': 'स्रोत लौटो', 'Leo': 'चमको मिटो', 'Virgo': 'सेवा विलीन',
      'Libra': 'एक में मिलो', 'Scorpio': 'मरो जीने को', 'Sagittarius': 'भटको अचंभित',
      'Capricorn': 'चढ़ो गिरो', 'Aquarius': 'दुनिया मुक्त', 'Pisces': 'गिरो उड़ो',
    },
  },
  zh: {
    dharma: {
      'Sun': '王座等待', 'Moon': '灵魂低语', 'Mars': '黎明之刃',
      'Mercury': '秘密守护', 'Jupiter': '神圣之火', 'Venus': '梦想编织', 'Saturn': '沉默建筑',
    },
    karma: {
      'Aries': '拥抱宁静', 'Taurus': '放开执念', 'Gemini': '内心沉默',
      'Cancer': '心之墙', 'Leo': '弯腰而起', 'Virgo': '接受裂痕',
      'Libra': '独自行走', 'Scorpio': '信任坠落', 'Sagittarius': '尊重锚点',
      'Capricorn': '认识自己', 'Aquarius': '感受治愈', 'Pisces': '触摸大地',
    },
    kama: {
      'Aries': '自由灵魂', 'Taurus': '丝绒渴望', 'Gemini': '无限好奇',
      'Cancer': '爱的堡垒', 'Leo': '耀眼光芒', 'Virgo': '完美混沌',
      'Libra': '美丽平衡', 'Scorpio': '甘愿沉溺', 'Sagittarius': '追逐地平线',
      'Capricorn': '帝国建造', 'Aquarius': '打破常规', 'Pisces': '情感海洋',
    },
    moksha: {
      'Aries': '燃烧成就', 'Taurus': '融于宁静', 'Gemini': '知而不知',
      'Cancer': '回归本源', 'Leo': '闪耀消逝', 'Virgo': '服务消融',
      'Libra': '合二为一', 'Scorpio': '死而后生', 'Sagittarius': '漫游惊奇',
      'Capricorn': '攀登崩塌', 'Aquarius': '解放世界', 'Pisces': '坠落飞翔',
    },
  },
  es: {
    dharma: {
      'Sun': 'trono espera', 'Moon': 'alma susurra', 'Mars': 'espada alba',
      'Mercury': 'guardián secretos', 'Jupiter': 'llama sagrada', 'Venus': 'tejedor sueños', 'Saturn': 'arquitecto silente',
    },
    karma: {
      'Aries': 'abraza quietud', 'Taurus': 'suelta agarre', 'Gemini': 'silencio interno',
      'Cancer': 'muros corazón', 'Leo': 'inclina elevar', 'Virgo': 'acepta grietas',
      'Libra': 'camina solo', 'Scorpio': 'confía caída', 'Sagittarius': 'honra ancla',
      'Capricorn': 'conoce tu oro', 'Aquarius': 'siente sanar', 'Pisces': 'toca tierra',
    },
    kama: {
      'Aries': 'espíritu libre', 'Taurus': 'hambre terciopelo', 'Gemini': 'curiosidad infinita',
      'Cancer': 'fortaleza amor', 'Leo': 'luz cegadora', 'Virgo': 'caos perfecto',
      'Libra': 'bello equilibrio', 'Scorpio': 'ahogarse queriendo', 'Sagittarius': 'caza horizonte',
      'Capricorn': 'construye imperio', 'Aquarius': 'rompe molde', 'Pisces': 'océano sentir',
    },
    moksha: {
      'Aries': 'arder para ser', 'Taurus': 'disolver quietud', 'Gemini': 'saber desconocer',
      'Cancer': 'volver origen', 'Leo': 'brillar desvanecer', 'Virgo': 'servir desaparecer',
      'Libra': 'fundirse uno', 'Scorpio': 'morir vivir', 'Sagittarius': 'vagar maravillar',
      'Capricorn': 'subir caer', 'Aquarius': 'liberar mundo', 'Pisces': 'caer volar',
    },
  },
  pt: {
    dharma: {
      'Sun': 'trono aguarda', 'Moon': 'alma sussurra', 'Mars': 'lâmina aurora',
      'Mercury': 'guardião segredos', 'Jupiter': 'chama sagrada', 'Venus': 'tecelão sonhos', 'Saturn': 'arquiteto silente',
    },
    karma: {
      'Aries': 'abraça quietude', 'Taurus': 'liberta apego', 'Gemini': 'silêncio interno',
      'Cancer': 'muros coração', 'Leo': 'curva erguer', 'Virgo': 'aceita fissuras',
      'Libra': 'caminha só', 'Scorpio': 'confia queda', 'Sagittarius': 'honra âncora',
      'Capricorn': 'conhece teu ouro', 'Aquarius': 'sente curar', 'Pisces': 'toca terra',
    },
    kama: {
      'Aries': 'espírito livre', 'Taurus': 'fome veludo', 'Gemini': 'curiosidade infinita',
      'Cancer': 'fortaleza amor', 'Leo': 'luz ofuscante', 'Virgo': 'caos perfeito',
      'Libra': 'belo equilíbrio', 'Scorpio': 'afogar querendo', 'Sagittarius': 'caça horizonte',
      'Capricorn': 'constrói império', 'Aquarius': 'quebra molde', 'Pisces': 'oceano sentir',
    },
    moksha: {
      'Aries': 'arder para ser', 'Taurus': 'dissolver quietude', 'Gemini': 'saber desconhecer',
      'Cancer': 'retornar fonte', 'Leo': 'brilhar desvanecer', 'Virgo': 'servir desaparecer',
      'Libra': 'fundir-se um', 'Scorpio': 'morrer viver', 'Sagittarius': 'vagar maravilhar',
      'Capricorn': 'subir desabar', 'Aquarius': 'libertar mundo', 'Pisces': 'cair voar',
    },
  },
  ja: {
    dharma: {
      'Sun': '玉座が待つ', 'Moon': '魂の囁き', 'Mars': '夜明けの刃',
      'Mercury': '秘密の守護', 'Jupiter': '聖なる炎', 'Venus': '夢を紡ぐ', 'Saturn': '沈黙の建築',
    },
    karma: {
      'Aries': '静けさを抱く', 'Taurus': '執着を手放す', 'Gemini': '内なる静寂',
      'Cancer': '心の壁', 'Leo': '屈んで立つ', 'Virgo': '亀裂を受容',
      'Libra': '一人で歩く', 'Scorpio': '落下を信じる', 'Sagittarius': '錨を敬う',
      'Capricorn': '己の金を知る', 'Aquarius': '感じて癒す', 'Pisces': '大地に触れる',
    },
    kama: {
      'Aries': '解放された魂', 'Taurus': 'ビロードの渇望', 'Gemini': '無限の好奇心',
      'Cancer': '愛の砦', 'Leo': '眩い光', 'Virgo': '完璧な混沌',
      'Libra': '美しい均衡', 'Scorpio': '喜んで溺れる', 'Sagittarius': '地平線を追う',
      'Capricorn': '帝国の建設', 'Aquarius': '型を破る', 'Pisces': '感情の海',
    },
    moksha: {
      'Aries': '燃えて成る', 'Taurus': '静寂に溶ける', 'Gemini': '知って忘れる',
      'Cancer': '源に還る', 'Leo': '輝いて消える', 'Virgo': '仕えて消える',
      'Libra': '一つに融ける', 'Scorpio': '死んで生きる', 'Sagittarius': '彷徨い驚く',
      'Capricorn': '登って崩れる', 'Aquarius': '世界を解放', 'Pisces': '落ちて飛ぶ',
    },
  },
};

// Word Component with morphing
const SoulWord = ({ original, transformed, isRevealed, delay, style }) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [displayText, setDisplayText] = useState(original);
  const [isMorphing, setIsMorphing] = useState(false);
  const morphIndex = useRef(0);

  useEffect(() => {
    if (isRevealed) {
      // Wait for light wave to reach this word
      const timer = setTimeout(() => {
        // Blur out
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          setDisplayText(transformed);
          // Fade in
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        });
      }, delay);
      return () => clearTimeout(timer);
    } else {
      // Revert
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setDisplayText(original);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isRevealed]);

  // Random letter-by-letter morphing (idle state)
  useEffect(() => {
    if (isRevealed || !isMorphing) return;

    morphIndex.current = 0;
    const maxLen = Math.max(original.length, transformed.length);

    const interval = setInterval(() => {
      if (morphIndex.current <= maxLen) {
        const newText = transformed.slice(0, morphIndex.current) + original.slice(morphIndex.current);
        setDisplayText(newText);
        morphIndex.current++;
      } else {
        clearInterval(interval);
        // Hold transformed briefly, then revert
        setTimeout(() => {
          morphIndex.current = 0;
          const revertInterval = setInterval(() => {
            if (morphIndex.current <= maxLen) {
              const newText = original.slice(0, morphIndex.current) + transformed.slice(morphIndex.current);
              setDisplayText(newText);
              morphIndex.current++;
            } else {
              clearInterval(revertInterval);
              setDisplayText(original);
              setIsMorphing(false);
            }
          }, 50);
        }, 2000);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isMorphing, isRevealed]);

  // Trigger random morphing
  useEffect(() => {
    if (isRevealed) return;

    const triggerMorph = () => {
      if (Math.random() > 0.5 && !isMorphing) {
        setIsMorphing(true);
      }
    };

    const interval = setInterval(triggerMorph, randomBetween(6000, 12000));
    
    // Initial random delay
    const initialTimeout = setTimeout(triggerMorph, randomBetween(2000, 5000));

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [isRevealed, isMorphing]);

  return (
    <Animated.Text style={[styles.soulWord, style, { opacity }]}>
      {displayText}
    </Animated.Text>
  );
};

// Main Soul Map Component
export default function SoulMap({ kundliData, language = 'en' }) {
  const [isRevealed, setIsRevealed] = useState(false);
  
  // Animations
  const rotation = useRef(new Animated.Value(0)).current;
  const lightWave = useRef(new Animated.Value(0)).current;
  const lightOpacity = useRef(new Animated.Value(0)).current;
  const centerScale = useRef(new Animated.Value(1)).current;
  
  const revealTimeout = useRef(null);

  // Get language content
  const content = SOUL_CONTENT[language] || SOUL_CONTENT.en;
  const transforms = TRANSFORMS[language] || TRANSFORMS.en;

  // Get transformed word based on kundli
  const getTransformed = (point) => {
    let key;
    switch (point) {
      case 'dharma':
        key = getTenthLord(kundliData);
        break;
      case 'karma':
        key = kundliData?.planets?.Saturn?.rashi || 'Capricorn';
        break;
      case 'kama':
        key = kundliData?.planets?.Venus?.rashi || 'Libra';
        break;
      case 'moksha':
        key = kundliData?.planets?.Ketu?.rashi || 'Pisces';
        break;
    }
    return transforms[point]?.[key] || transforms[point]?.['Sun'] || '· · ·';
  };

  // Slow continuous rotation (60 seconds per revolution)
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 60000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();

    return () => rotateAnimation.stop();
  }, []);

  // Handle center tap
  const handleCenterTap = useCallback(() => {
    if (isRevealed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Center pulse
    Animated.sequence([
      Animated.timing(centerScale, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(centerScale, {
        toValue: 1.05,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(centerScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Light wave emission
    lightWave.setValue(0);
    lightOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(lightWave, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(lightOpacity, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(lightOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setIsRevealed(true);

    // Auto-revert after 8 seconds
    revealTimeout.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsRevealed(false);
    }, 8000);
  }, [isRevealed]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
    };
  }, []);

  // Rotation interpolation
  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Light wave scale
  const lightScale = lightWave.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 3],
  });

  return (
    <View style={styles.container}>
      {/* Rotating Soul Map */}
      <Animated.View
        style={[
          styles.mapContainer,
          { transform: [{ rotate: rotateInterpolate }] },
        ]}
      >
        {/* Dharma - Top */}
        <View style={styles.topPosition}>
          <SoulWord
            original={content.dharma}
            transformed={getTransformed('dharma')}
            isRevealed={isRevealed}
            delay={400}
          />
        </View>

        {/* Middle Row */}
        <View style={styles.middleRow}>
          {/* Karma - Left */}
          <SoulWord
            original={content.karma}
            transformed={getTransformed('karma')}
            isRevealed={isRevealed}
            delay={500}
            style={styles.leftWord}
          />

          {/* Center Circle */}
          <TouchableWithoutFeedback onPress={handleCenterTap}>
            <View style={styles.centerArea}>
              {/* Light Wave */}
              <Animated.View
                style={[
                  styles.lightWave,
                  {
                    opacity: lightOpacity,
                    transform: [{ scale: lightScale }],
                  },
                ]}
              />

              {/* Center Circle */}
              <Animated.View
                style={[
                  styles.centerCircle,
                  { transform: [{ scale: centerScale }] },
                ]}
              />
            </View>
          </TouchableWithoutFeedback>

          {/* Kama - Right */}
          <SoulWord
            original={content.kama}
            transformed={getTransformed('kama')}
            isRevealed={isRevealed}
            delay={500}
            style={styles.rightWord}
          />
        </View>

        {/* Moksha - Bottom */}
        <View style={styles.bottomPosition}>
          <SoulWord
            original={content.moksha}
            transformed={getTransformed('moksha')}
            isRevealed={isRevealed}
            delay={600}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// Helper Functions
function getTenthLord(kundliData) {
  const ascendant = kundliData?.raw?.ascendant || 'Aries';
  const tenthSigns = {
    Aries: 'Capricorn', Taurus: 'Aquarius', Gemini: 'Pisces',
    Cancer: 'Aries', Leo: 'Taurus', Virgo: 'Gemini',
    Libra: 'Cancer', Scorpio: 'Leo', Sagittarius: 'Virgo',
    Capricorn: 'Libra', Aquarius: 'Scorpio', Pisces: 'Sagittarius',
  };
  const signLords = {
    Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury',
    Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
    Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter',
    Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
  };
  const tenthSign = tenthSigns[ascendant];
  return signLords[tenthSign] || 'Sun';
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: 20,
  },
  mapContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topPosition: {
    position: 'absolute',
    top: 15,
    alignItems: 'center',
  },
  bottomPosition: {
    position: 'absolute',
    bottom: 15,
    alignItems: 'center',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  leftWord: {
    textAlign: 'right',
  },
  rightWord: {
    textAlign: 'left',
  },
  soulWord: {
    fontSize: 10,
    fontWeight: '200',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  centerArea: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'transparent',
  },
  lightWave: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 248, 220, 0.15)',
  },
});