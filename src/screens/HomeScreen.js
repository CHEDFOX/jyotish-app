import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { colors, spacing } from '../theme';
import { chatWithOracle } from '../api/backend';
import VoiceChatScreen from './VoiceChatScreen';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import FeaturesTab from '../components/FeaturesTab';

const { width: SW, height: SH } = Dimensions.get('window');
const isLatinScript = (lang) => ['en', 'es', 'pt'].includes(lang);

// ─── STAR BACKGROUND ───
const StarField = () => {
  const stars = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i, left: Math.random() * SW, top: Math.random() * SH,
      size: Math.random() * 1.2 + 0.3, opacity: Math.random() * 0.15 + 0.03,
    })), []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map(s => <View key={s.id} style={{ position: 'absolute', left: s.left, top: s.top, width: s.size, height: s.size, borderRadius: s.size / 2, backgroundColor: colors.white, opacity: s.opacity }} />)}
    </View>
  );
};

// ─── TAB ICONS ───
const ChatIcon = ({ active }) => (
  <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', shadowColor: '#fff', shadowOpacity: active ? 0.4 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />
  </View>
);
const YouIcon = ({ active }) => (
  <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', shadowColor: '#fff', shadowOpacity: active ? 0.4 : 0, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />
  </View>
);
const FeaturesIcon = ({ active }) => {
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { const s = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true })); s.start(); return () => s.stop(); }, []);
  const lc = active ? colors.gold : 'rgba(212,175,55,0.4)';
  return (
    <View style={{ width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
      {Array.from({ length: 8 }, (_, i) => {
        const tr = Animated.add(rot, new Animated.Value(-i * 0.035)).interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
        const op = active ? (1 - i / 8) * 0.5 : (1 - i / 8) * 0.15;
        return (<Animated.View key={i} style={{ position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: tr }] }}><View style={{ position: 'absolute', top: 0, width: 1, height: 7, borderRadius: 0.5, backgroundColor: lc, opacity: op }} /></Animated.View>);
      })}
      <Animated.View style={{ position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center', transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
        <View style={{ position: 'absolute', top: 0, width: 1.5, height: 8, borderRadius: 0.75, backgroundColor: active ? colors.gold : 'rgba(212,175,55,0.5)', shadowColor: colors.gold, shadowOpacity: active ? 0.6 : 0, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } }} />
      </Animated.View>
    </View>
  );
};

// ─── CHART FINGERPRINT (always rotating) ───
const ChartFingerprint = ({ kundliData, size = 70 }) => {
  const planets = kundliData?.planets || kundliData?.raw?.planets || {};
  const r = size * 0.38, c = size / 2, ds = 2.5;
  const rot = useRef(new Animated.Value(0)).current;
  useEffect(() => { const s = Animated.loop(Animated.timing(rot, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true })); s.start(); return () => s.stop(); }, []);
  const pts = useMemo(() => ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'].map(n => {
    const h = (planets[n] || {}).house || 1;
    const a = ((h - 1) * 30 + 15) * (Math.PI / 180) - Math.PI / 2;
    return { n, x: c + Math.cos(a) * r, y: c + Math.sin(a) * r };
  }), [planets, size]);
  const lns = useMemo(() => pts.map((p, i) => {
    const nx = pts[(i + 1) % pts.length];
    const dx = nx.x - p.x, dy = nx.y - p.y;
    return { x: p.x, y: p.y, l: Math.sqrt(dx * dx + dy * dy), a: Math.atan2(dy, dx) * (180 / Math.PI), k: `${i}` };
  }), [pts]);
  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <View style={{ position: 'absolute', width: r * 2, height: r * 2, borderRadius: r, borderWidth: 0.3, borderColor: 'rgba(255,255,255,0.08)', left: c - r, top: c - r }} />
      {lns.map(l => <View key={l.k} style={{ position: 'absolute', left: l.x, top: l.y, width: l.l, height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: `${l.a}deg` }], transformOrigin: 'left center' }} />)}
      {pts.map(p => <View key={p.n} style={{ position: 'absolute', left: p.x - ds / 2, top: p.y - ds / 2, width: ds, height: ds, borderRadius: ds / 2, backgroundColor: 'rgba(255,255,255,0.6)' }} />)}
      <View style={{ position: 'absolute', left: c - 1.5, top: c - 1.5, width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.gold }} />
    </Animated.View>
  );
};

// ─── PREMIUM SOUL MAP ───
const SoulMap = ({ soulProfile, language = 'en' }) => {
  const [revealedIndex, setRevealedIndex] = useState(-1);
  const centerScale = useRef(new Animated.Value(1)).current;
  const lightWave = useRef(new Animated.Value(0)).current;
  const lightOpacity = useRef(new Animated.Value(0)).current;
  const wordOpacities = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current;
  const wordColors = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const revealTimeout = useRef(null);
  const autoInterval = useRef(null);
  const lastRevealed = useRef([]);
  const latin = isLatinScript(language);

  // Breathing center — 4 second cycle
  const breathAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const b = Animated.loop(Animated.sequence([
      Animated.timing(breathAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(breathAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    b.start();
    return () => b.stop();
  }, []);
  const breathScale = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });

  // Orbiting dot — 20 second revolution
  const orbitAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const o = Animated.loop(Animated.timing(orbitAnim, { toValue: 1, duration: 20000, easing: Easing.linear, useNativeDriver: false }));
    o.start();
    return () => o.stop();
  }, []);

  // Traveling particles — 4 lines, staggered 8 second travel
  const particleAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const particleOpacities = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const runParticles = () => {
      [0, 1, 2, 3].forEach((i) => {
        const delay = i * 2000;
        setTimeout(() => {
          particleAnims[i].setValue(0);
          particleOpacities[i].setValue(0);
          Animated.parallel([
            Animated.timing(particleAnims[i], { toValue: 1, duration: 6000, easing: Easing.out(Easing.ease), useNativeDriver: false }),
            Animated.sequence([
              Animated.timing(particleOpacities[i], { toValue: 1, duration: 500, useNativeDriver: false }),
              Animated.delay(4000),
              Animated.timing(particleOpacities[i], { toValue: 0, duration: 1500, useNativeDriver: false }),
            ]),
          ]).start();
        }, delay);
      });
    };
    runParticles();
    const interval = setInterval(runParticles, 10000);
    return () => clearInterval(interval);
  }, []);

  // Default labels and revealed text
  const defaultLabels = {
    en: ['dharma', 'karma', 'kama', 'moksha'],
    hi: ['धर्म', 'कर्म', 'काम', 'मोक्ष'],
    zh: ['法', '业', '欲', '解脱'],
    es: ['dharma', 'karma', 'deseo', 'libertad'],
    pt: ['dharma', 'karma', 'desejo', 'libertação'],
    ja: ['ダルマ', 'カルマ', '欲望', '解脱'],
  };
  const labels = defaultLabels[language] || defaultLabels.en;
  const revealed = soulProfile
    ? [soulProfile.dharma, soulProfile.karma, soulProfile.kama, soulProfile.moksha]
    : ['sacred path', 'walk your road', 'heart speaks', 'journey home'];

  const [displayTexts, setDisplayTexts] = useState(labels);

  const pickRandom = () => {
    const avail = [0, 1, 2, 3].filter(i => !lastRevealed.current.includes(i));
    const pool = avail.length > 0 ? avail : [0, 1, 2, 3];
    const idx = pool[Math.floor(Math.random() * pool.length)];
    lastRevealed.current.push(idx);
    if (lastRevealed.current.length > 2) lastRevealed.current.shift();
    return idx;
  };

  const revealOne = (idx) => {
    if (revealedIndex >= 0) {
      const prev = revealedIndex;
      Animated.timing(wordColors[prev], { toValue: 0, duration: 300, useNativeDriver: false }).start();
      Animated.timing(wordOpacities[prev], { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
        setDisplayTexts(p => { const n = [...p]; n[prev] = labels[prev]; return n; });
        Animated.timing(wordOpacities[prev], { toValue: 1, duration: 300, useNativeDriver: false }).start();
      });
    }
    setTimeout(() => {
      // Rush particle to the word
      particleAnims[idx].setValue(0);
      particleOpacities[idx].setValue(1);
      Animated.parallel([
        Animated.timing(particleAnims[idx], { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(particleOpacities[idx], { toValue: 0, duration: 200, useNativeDriver: false }),
        ]),
      ]).start();

      Animated.timing(wordOpacities[idx], { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
        setDisplayTexts(p => { const n = [...p]; n[idx] = revealed[idx]; return n; });
        Animated.timing(wordColors[idx], { toValue: 1, duration: 400, useNativeDriver: false }).start();
        Animated.timing(wordOpacities[idx], { toValue: 1, duration: 400, useNativeDriver: false }).start();
      });
      setRevealedIndex(idx);
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
      revealTimeout.current = setTimeout(() => {
        Animated.timing(wordColors[idx], { toValue: 0, duration: 500, useNativeDriver: false }).start();
        Animated.timing(wordOpacities[idx], { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
          setDisplayTexts(p => { const n = [...p]; n[idx] = labels[idx]; return n; });
          Animated.timing(wordOpacities[idx], { toValue: 1, duration: 300, useNativeDriver: false }).start();
        });
        setRevealedIndex(-1);
      }, 5000);
    }, revealedIndex >= 0 ? 350 : 0);
  };

  // Auto reveal all 4 every 4 minutes
  useEffect(() => {
    autoInterval.current = setInterval(() => {
      [0, 1, 2, 3].forEach((i) => {
        setTimeout(() => {
          particleAnims[i].setValue(0); particleOpacities[i].setValue(1);
          Animated.parallel([
            Animated.timing(particleAnims[i], { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
            Animated.sequence([Animated.delay(300), Animated.timing(particleOpacities[i], { toValue: 0, duration: 200, useNativeDriver: false })]),
          ]).start();
          Animated.timing(wordOpacities[i], { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
            setDisplayTexts(p => { const n = [...p]; n[i] = revealed[i]; return n; });
            Animated.timing(wordColors[i], { toValue: 1, duration: 400, useNativeDriver: false }).start();
            Animated.timing(wordOpacities[i], { toValue: 1, duration: 400, useNativeDriver: false }).start();
          });
        }, i * 400);
      });
      setTimeout(() => {
        [0, 1, 2, 3].forEach((i) => {
          Animated.timing(wordColors[i], { toValue: 0, duration: 500, useNativeDriver: false }).start();
          Animated.timing(wordOpacities[i], { toValue: 0, duration: 150, useNativeDriver: false }).start(() => {
            setDisplayTexts(p => { const n = [...p]; n[i] = labels[i]; return n; });
            Animated.timing(wordOpacities[i], { toValue: 1, duration: 300, useNativeDriver: false }).start();
          });
        });
        setRevealedIndex(-1);
      }, 10000);
    }, 240000);
    return () => { if (autoInterval.current) clearInterval(autoInterval.current); };
  }, []);

  const handleTap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(centerScale, { toValue: 0.7, duration: 80, useNativeDriver: false }),
      Animated.timing(centerScale, { toValue: 1.15, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: false }),
      Animated.timing(centerScale, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
    lightWave.setValue(0); lightOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(lightWave, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.sequence([
        Animated.timing(lightOpacity, { toValue: 0.4, duration: 150, useNativeDriver: false }),
        Animated.timing(lightOpacity, { toValue: 0, duration: 450, useNativeDriver: false }),
      ]),
    ]).start();
    revealOne(pickRandom());
  };

  useEffect(() => () => {
    if (revealTimeout.current) clearTimeout(revealTimeout.current);
    if (autoInterval.current) clearInterval(autoInterval.current);
  }, []);

  const lightScale = lightWave.interpolate({ inputRange: [0, 1], outputRange: [0, 3] });
  const orbitDeg = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ws = latin ? {} : { letterSpacing: 0 };

  // Line + particle positions: top, left, right, bottom
  const lineLen = 50;
  const lineData = [
    { x1: 0, y1: -8, x2: 0, y2: -(8 + lineLen), dir: 'v', sign: -1 },   // top (dharma)
    { x1: -8, y1: 0, x2: -(8 + lineLen), y2: 0, dir: 'h', sign: -1 },   // left (karma)
    { x1: 8, y1: 0, x2: 8 + lineLen, y2: 0, dir: 'h', sign: 1 },        // right (kama)
    { x1: 0, y1: 8, x2: 0, y2: 8 + lineLen, dir: 'v', sign: 1 },         // bottom (moksha)
  ];

  const renderWord = (idx) => {
    const textColor = wordColors[idx].interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(255,255,255,0.5)', 'rgba(212,175,55,0.9)'],
    });
    return (
      <View style={_sm.wordWrap}>
        <Animated.Text style={[_sm.word, ws, { opacity: wordOpacities[idx], color: textColor }]}>
          {displayTexts[idx]}
        </Animated.Text>
      </View>
    );
  };

  return (
    <View style={_sm.container}>
      {/* Top — dharma */}
      {renderWord(0)}

      {/* Middle */}
      <View style={_sm.middleRow}>
        {renderWord(1)}

        <TouchableWithoutFeedback onPress={handleTap}>
          <View style={_sm.centerArea}>
            {/* Connecting lines */}
            {lineData.map((ld, i) => (
              <View key={`line-${i}`} style={{
                position: 'absolute',
                left: ld.dir === 'h' ? (ld.sign < 0 ? -(lineLen) : 8) : -0.15,
                top: ld.dir === 'v' ? (ld.sign < 0 ? -(lineLen) : 8) : -0.15,
                width: ld.dir === 'h' ? lineLen : 0.3,
                height: ld.dir === 'v' ? lineLen : 0.3,
                backgroundColor: 'rgba(255,255,255,0.04)',
              }} />
            ))}

            {/* Traveling particles on each line */}
            {lineData.map((ld, i) => {
              const travel = particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, lineLen * ld.sign] });
              return (
                <Animated.View key={`particle-${i}`} style={{
                  position: 'absolute',
                  left: ld.dir === 'h' ? undefined : -1,
                  top: ld.dir === 'v' ? undefined : -1,
                  width: 2, height: 2, borderRadius: 1,
                  backgroundColor: colors.gold,
                  opacity: particleOpacities[i],
                  transform: ld.dir === 'h' ? [{ translateX: travel }] : [{ translateY: travel }],
                }} />
              );
            })}

            {/* Light wave */}
            <Animated.View style={[_sm.lightWave, { opacity: lightOpacity, transform: [{ scale: lightScale }] }]} />

            {/* Orbiting dot */}
            <Animated.View style={{ position: 'absolute', width: 60, height: 60, transform: [{ rotate: orbitDeg }] }}>
              <View style={{ position: 'absolute', top: 0, left: 29, width: 2, height: 2, borderRadius: 1, backgroundColor: colors.gold, opacity: 0.08 }} />
            </Animated.View>

            {/* Breathing center */}
            <Animated.View style={[_sm.centerDot, { transform: [{ scale: Animated.multiply(centerScale, breathScale) }] }]} />
          </View>
        </TouchableWithoutFeedback>

        {renderWord(2)}
      </View>

      {/* Bottom — moksha */}
      {renderWord(3)}
    </View>
  );
};

const _sm = StyleSheet.create({
  container: { width: 260, height: 220, alignItems: 'center', justifyContent: 'center' },
  wordWrap: { width: 140, height: 24, alignItems: 'center', justifyContent: 'center' },
  word: { fontSize: 11, fontWeight: '300', color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'lowercase', textAlign: 'center' },
  middleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginVertical: 20 },
  centerArea: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20 },
  centerDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.3)' },
  lightWave: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,248,220,0.08)' },
});

// ─── ARCHETYPES (fallback) ───
const ARCHETYPES = {
  Aries: { en: 'The Pioneer', hi: 'अग्रणी' }, Taurus: { en: 'The Sensualist', hi: 'रसिक' },
  Gemini: { en: 'The Storyteller', hi: 'कथावाचक' }, Cancer: { en: 'The Nurturer', hi: 'पालनकर्ता' },
  Leo: { en: 'The Luminary', hi: 'प्रकाशमान' }, Virgo: { en: 'The Analyst', hi: 'विश्लेषक' },
  Libra: { en: 'The Harmonist', hi: 'सामंजस्यकर्ता' }, Scorpio: { en: 'The Alchemist', hi: 'रसायनी' },
  Sagittarius: { en: 'The Philosopher', hi: 'दार्शनिक' }, Capricorn: { en: 'The Architect', hi: 'वास्तुकार' },
  Aquarius: { en: 'The Visionary', hi: 'द्रष्टा' }, Pisces: { en: 'The Mystic', hi: 'रहस्यवादी' },
};

// ─── ORACLE MESSAGE ───
const OracleMessage = ({ text, hook, onHookTap, fontFamily }) => (
  <View style={s.oracleBubble}>
    <Text style={[s.oracleText, fontFamily && { fontFamily }]}>{text}</Text>
    {hook ? (
      <TouchableOpacity style={s.hookContainer} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (onHookTap) onHookTap(hook); }}>
        <Text style={s.hookText}>{hook}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── EMPTY CHAT ───
const STARTERS = {
  en: [{ text: 'Marriage', query: 'Will I have a happy married life?' }, { text: 'Career', query: 'How is my career looking?' }, { text: 'Today', query: 'What does today hold for me?' }],
  hi: [{ text: 'विवाह', query: 'क्या मेरी शादी सुखी होगी?' }, { text: 'करियर', query: 'मेरा करियर कैसा रहेगा?' }, { text: 'आज', query: 'आज मेरे लिए क्या है?' }],
};
const EmptyChat = ({ onSelect, language }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const latin = isLatinScript(language);
  const starters = STARTERS[language] || STARTERS.en;
  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }).start(); }, []);
  const t = ({ en: ['Ask The Oracle', 'or choose a topic'], hi: ['ऑरेकल से पूछें', 'या विषय चुनें'] })[language] || ['Ask The Oracle', 'or choose a topic'];
  return (
    <Animated.View style={[s.emptyContainer, { opacity: fadeAnim }]}>
      <Text style={[s.emptyTitle, !latin && { letterSpacing: 0, fontWeight: '400' }]}>{t[0]}</Text>
      <Text style={[s.emptySubtitle, !latin && { letterSpacing: 0 }]}>{t[1]}</Text>
      <View style={s.starterRow}>
        {starters.map(item => <TouchableOpacity key={item.text} style={s.starterPill} activeOpacity={0.7} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(item.query); }}><Text style={[s.starterText, !latin && { letterSpacing: 0 }]}>{item.text}</Text></TouchableOpacity>)}
      </View>
    </Animated.View>
  );
};

// ─── MODALS ───
const LANG_LIST = [{ code: 'en', name: 'English' }, { code: 'hi', name: 'हिंदी' }, { code: 'zh', name: '中文' }, { code: 'es', name: 'Español' }, { code: 'pt', name: 'Português' }, { code: 'ja', name: '日本語' }];
const LanguagePicker = ({ visible, current, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={s.modalContent}>
        {LANG_LIST.map(l => <TouchableOpacity key={l.code} style={[s.langOption, current === l.code && s.langOptionActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(l.code); }}><Text style={[s.langOptionText, current === l.code && s.langOptionTextActive]}>{l.name}</Text></TouchableOpacity>)}
      </View>
    </TouchableOpacity>
  </Modal>
);
const TYPO_LIST = [{ id: 'sans', name: 'Sans', preview: 'The stars speak to you', font: undefined }, { id: 'serif', name: 'Serif', preview: 'The stars speak to you', font: 'NotoSerif' }, { id: 'classic', name: 'Classic', preview: 'The stars speak to you', font: 'PlayfairDisplay' }];
const TypographyPicker = ({ visible, current, onSelect, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
      <View style={s.modalContent}>
        {TYPO_LIST.map(t => <TouchableOpacity key={t.id} style={[s.langOption, current === t.id && s.langOptionActive]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(t.id); }}><Text style={[s.typoName, current === t.id && s.langOptionTextActive]}>{t.name}</Text><Text style={[s.typoPreview, t.font && { fontFamily: t.font }]}>{t.preview}</Text></TouchableOpacity>)}
      </View>
    </TouchableOpacity>
  </Modal>
);

// ─── YOU TAB ───
const YouTab = ({ userData, kundliData, language, onLogout, onLanguageChange, fontFamily, typography, onTypographyChange }) => {
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showTypoPicker, setShowTypoPicker] = useState(false);
  const latin = isLatinScript(language);

  // Get archetype from soul profile (real data) or fallback
  const soulProfile = kundliData?.soul_profile || kundliData?.soulProfile;
  const ascendant = kundliData?.raw?.ascendant?.rashi_english || kundliData?.ascendant || 'Pisces';
  const archetype = soulProfile?.archetype || ARCHETYPES[ascendant]?.[latin ? 'en' : language] || ARCHETYPES[ascendant]?.en || 'Seeker';

  const lb = { en: { typography: 'Typography', language: 'Language', signOut: 'Sign Out' }, hi: { typography: 'टाइपोग्राफी', language: 'भाषा', signOut: 'लॉग आउट' } };
  const label = lb[language] || lb.en;


  const handleTypoSelect = async (id) => { if (onTypographyChange) onTypographyChange(id); setShowTypoPicker(false); };
  const handleLangSelect = async (code) => { await SecureStore.setItemAsync('user_language', code); setShowLangPicker(false); if (onLanguageChange) onLanguageChange(code); };

  const langName = LANG_LIST.find(l => l.code === language)?.name || 'English';
  const typoName = TYPO_LIST.find(t => t.id === typography)?.name || 'Sans';

  return (
    <View style={s.youContainer}>
      <LanguagePicker visible={showLangPicker} current={language} onSelect={handleLangSelect} onClose={() => setShowLangPicker(false)} />
      <TypographyPicker visible={showTypoPicker} current={typography} onSelect={handleTypoSelect} onClose={() => setShowTypoPicker(false)} />
      <View style={s.youHeader}>
        <ChartFingerprint kundliData={kundliData} size={70} />
        <Text style={[s.youName, !latin && { letterSpacing: 0, fontWeight: '400' }]}>{userData?.name || 'Seeker'}</Text>
        <Text style={[s.youArchetype, !latin && { letterSpacing: 0 }]}>{archetype}</Text>
      </View>
      <View style={s.youCenterSection}>
        <SoulMap soulProfile={soulProfile} language={language} />
      </View>
      <View style={s.youBottomSection}>
        <View style={s.settingsSection}>
          <TouchableOpacity style={s.settingRow} onPress={() => setShowTypoPicker(true)}><Text style={[s.settingLabel, !latin && { letterSpacing: 0 }]}>{label.typography}</Text><Text style={s.settingValue}>{typoName}  ›</Text></TouchableOpacity>
          <TouchableOpacity style={s.settingRow} onPress={() => setShowLangPicker(true)}><Text style={[s.settingLabel, !latin && { letterSpacing: 0 }]}>{label.language}</Text><Text style={s.settingValue}>{langName}  ›</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (onLogout) onLogout(); }}><Text style={[s.logoutText, !latin && { letterSpacing: 0 }]}>{label.signOut}</Text></TouchableOpacity>
      </View>
    </View>
  );
};

// ─── FEATURES TAB (imported from components/FeaturesTab.js) ───

// ─── MAIN ───
export default function HomeScreen({ language = 'en', userData, birthData, kundliData, onLogout, onLanguageChange, onNavigate, chatMessages = [], onMessagesChange, fontFamily, typography = 'sans', onTypographyChange }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [messages, setMessages] = useState(chatMessages);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { if (onMessagesChange) onMessagesChange(messages); }, [messages]);
  const latin = isLatinScript(language);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim()) return;
    const userMsg = { role: 'user', content: text.trim() };
    const cur = [...messages, userMsg];
    setMessages(cur); setInputText(''); setIsThinking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const r = await chatWithOracle(text.trim(), kundliData, cur);
      setIsThinking(false);
      if (r.success && r.data?.response) { setMessages(p => [...p, { role: 'oracle', content: r.data.response, hook: r.data.hook || '' }]); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
      else { setMessages(p => [...p, { role: 'oracle', content: 'The stars are unclear. Please try again.' }]); }
    } catch (e) { setIsThinking(false); setMessages(p => [...p, { role: 'oracle', content: 'The stars are unclear. Please try again.' }]); }
  }, [kundliData, messages]);

  const handleHookTap = useCallback((hookText) => {
    setIsThinking(true);
    chatWithOracle("Tell me more about: " + hookText, kundliData, messages).then(result => {
      setIsThinking(false);
      if (result.success && result.data?.response) {
        setMessages(prev => [...prev, { role: 'oracle', content: result.data.response, hook: result.data.hook || '' }]);
      }
    }).catch(() => setIsThinking(false));
  }, [kundliData, messages]);
  const handleVoiceConv = useCallback((vc) => { if (vc?.length > 0) setMessages(p => [...p, ...vc]); }, []);
  if (showVoiceChat) return <VoiceChatScreen language={language} kundliData={kundliData} onClose={() => setShowVoiceChat(false)} onConversationUpdate={handleVoiceConv} />;

  return (
    <View style={s.container}>
      <StarField />
      {activeTab === 'chat' && (
        <KeyboardAvoidingView style={s.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <View style={s.topBar}><View /><TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setShowVoiceChat(true); }} style={s.voiceIcon}><View style={s.voiceDot} /></TouchableOpacity></View>
          {messages.length === 0 && !isThinking ? <EmptyChat onSelect={sendMessage} language={language} /> : (
            <ScrollView ref={scrollRef} style={s.messagesScroll} contentContainerStyle={s.messagesContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {messages.map((msg, i) => msg.role === 'user' ? <View key={i} style={s.userBubble}><Text style={s.userText}>{msg.content}</Text></View> : <OracleMessage key={i} text={msg.content} hook={msg.hook} onHookTap={handleHookTap} fontFamily={fontFamily} />)}
              {isThinking && <View style={s.thinkingWrap}><View style={s.thinkingDots}><View style={[s.tDot, { opacity: 0.4 }]} /><View style={[s.tDot, { opacity: 0.6 }]} /><View style={[s.tDot, { opacity: 0.8 }]} /></View></View>}
            </ScrollView>
          )}
          <View style={s.inputWrap}><View style={s.inputRow}>
            <TextInput style={s.textInput} value={inputText} onChangeText={setInputText} placeholder={latin ? 'Ask anything...' : 'कुछ भी पूछें...'} placeholderTextColor="rgba(255,255,255,0.25)" multiline maxLength={500} onSubmitEditing={() => { if (inputText.trim()) sendMessage(inputText); }} />
            {inputText.trim().length > 0 && <TouchableOpacity style={s.sendBtn} onPress={() => { if (inputText.trim()) sendMessage(inputText); }}><Text style={s.sendArrow}>↑</Text></TouchableOpacity>}
          </View></View>
        </KeyboardAvoidingView>
      )}
      {activeTab === 'features' && <FeaturesTab language={language} onNavigate={onNavigate} kundliData={kundliData} />}
      {activeTab === 'you' && <YouTab userData={userData} kundliData={kundliData} language={language} onLogout={onLogout} onLanguageChange={onLanguageChange} fontFamily={fontFamily} typography={typography} onTypographyChange={onTypographyChange} />}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('chat'); }}><ChatIcon active={activeTab === 'chat'} /></TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('features'); }}><FeaturesIcon active={activeTab === 'features'} /></TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab('you'); }}><YouIcon active={activeTab === 'you'} /></TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.void },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: 24, paddingBottom: 8 },
  voiceIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  voiceDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.3)' },
  chatArea: { flex: 1 }, messagesScroll: { flex: 1 }, messagesContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomRightRadius: 4, maxWidth: '78%', marginBottom: 16 },
  userText: { fontSize: 15, lineHeight: 21, color: colors.void },
  oracleBubble: { alignSelf: 'flex-start', maxWidth: '85%', marginBottom: 20 },
  oracleText: { fontSize: 15, lineHeight: 23, color: 'rgba(255,255,255,0.88)' },  // fontFamily applied inline
  hookContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  hookText: { fontSize: 14, lineHeight: 20, color: colors.gold, fontStyle: 'italic' },
  thinkingWrap: { alignSelf: 'flex-start', paddingVertical: 8 }, thinkingDots: { flexDirection: 'row', gap: 4 },
  tDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyTitle: { fontSize: 28, fontWeight: '200', color: colors.white, letterSpacing: 2 },  // fontFamily applied inline
  emptySubtitle: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, marginTop: 8 },
  starterRow: { flexDirection: 'row', gap: 10, marginTop: 32 },
  starterPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)' },
  starterText: { fontSize: 13, fontWeight: '400', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.3 },
  inputWrap: { paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 16 : 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 24, paddingLeft: 18, paddingRight: 6, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.06)' },
  textInput: { flex: 1, fontSize: 15, color: colors.white, maxHeight: 100, paddingVertical: 10 },  // fontFamily applied inline
  sendBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendArrow: { fontSize: 17, fontWeight: '600', color: colors.void, marginTop: -1 },
  featuresContainer: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 80 : 60 },
  featuresTitle: { fontSize: 28, fontWeight: '200', color: colors.white, letterSpacing: 1, marginBottom: 32 },
  featureCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  featureCardDisabled: { opacity: 0.5 }, featureTitle: { fontSize: 17, fontWeight: '400', color: colors.white },
  featureTitleDisabled: { color: colors.silver }, featureSubtitle: { fontSize: 12, fontWeight: '400', color: 'rgba(255,255,255,0.35)', marginTop: 4 },
  featureArrow: { fontSize: 24, fontWeight: '200', color: 'rgba(255,255,255,0.25)' },
  featureSoon: { fontSize: 10, fontWeight: '400', color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5, textTransform: 'uppercase' },
  youContainer: { flex: 1 },
  youHeader: { alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 70 : 50, paddingBottom: 8 },
  youName: { fontSize: 22, fontWeight: '200', color: colors.white, letterSpacing: 3, textTransform: 'uppercase', marginTop: 12 },
  youArchetype: { fontSize: 11, fontWeight: '400', color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, marginTop: 4 },
  youCenterSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  youBottomSection: { paddingBottom: Platform.OS === 'ios' ? 8 : 4 },
  settingsSection: { paddingHorizontal: 32, marginBottom: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  settingLabel: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  settingValue: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.3)' },
  logoutBtn: { alignItems: 'center', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)', marginHorizontal: 32 },
  logoutText: { fontSize: 13, fontWeight: '400', color: 'rgba(255,80,80,0.5)', letterSpacing: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { backgroundColor: colors.abyss, borderRadius: 20, padding: 8, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', width: '100%', maxWidth: 280 },
  langOption: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 },
  langOptionActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  langOptionText: { fontSize: 16, fontWeight: '300', color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  langOptionTextActive: { color: colors.white, fontWeight: '400' },
  typoName: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  typoPreview: { fontSize: 12, fontWeight: '300', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 4 },
  tabBar: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 34 : 20, gap: 48 },
  tabItem: { padding: 12 },
});