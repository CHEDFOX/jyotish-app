import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { colors, spacing } from '../theme';
import { chatWithOracle } from '../api/backend';
import VoiceChatScreen from './VoiceChatScreen';
import SoulMap from '../components/SoulMap';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TABS = {
  CHAT: 'chat',
  ASTRO: 'astro',
  PROFILE: 'profile',
};

const CONTENT = {
  en: {
    askPlaceholder: 'Ask The Stars...',
    kundliMatch: 'Kundli Match',
    dailyHoroscope: 'Daily Horoscope',
    gemstones: 'Gemstones',
    remedies: 'Remedies',
    comingSoon: 'Coming Soon',
    sunSign: 'Sun Sign',
    moonSign: 'Moon Sign',
    ascendant: 'Ascendant',
    currentDasha: 'Current Dasha',
    nakshatra: 'Nakshatra',
    logout: 'Logout',
    thinking: 'The Oracle Is Thinking...',
  },
  hi: {
    askPlaceholder: 'तारों से पूछें...',
    kundliMatch: 'कुंडली मिलान',
    dailyHoroscope: 'दैनिक राशिफल',
    gemstones: 'रत्न',
    remedies: 'उपाय',
    comingSoon: 'जल्द आ रहा है',
    sunSign: 'सूर्य राशि',
    moonSign: 'चंद्र राशि',
    ascendant: 'लग्न',
    currentDasha: 'वर्तमान दशा',
    nakshatra: 'नक्षत्र',
    logout: 'लॉग आउट',
    thinking: 'ऑरेकल सोच रहा है...',
  },
  zh: {
    askPlaceholder: '问问星星...',
    kundliMatch: '星盘匹配',
    dailyHoroscope: '每日星座',
    gemstones: '宝石',
    remedies: '补救',
    comingSoon: '即将推出',
    sunSign: '太阳星座',
    moonSign: '月亮星座',
    ascendant: '上升',
    currentDasha: '当前大运',
    nakshatra: '星宿',
    logout: '登出',
    thinking: '神谕正在思考...',
  },
  es: {
    askPlaceholder: 'Pregunta A Las Estrellas...',
    kundliMatch: 'Match De Kundli',
    dailyHoroscope: 'Horóscopo Diario',
    gemstones: 'Gemas',
    remedies: 'Remedios',
    comingSoon: 'Próximamente',
    sunSign: 'Signo Solar',
    moonSign: 'Signo Lunar',
    ascendant: 'Ascendente',
    currentDasha: 'Dasha Actual',
    nakshatra: 'Nakshatra',
    logout: 'Cerrar Sesión',
    thinking: 'El Oráculo Está Pensando...',
  },
  pt: {
    askPlaceholder: 'Pergunte Às Estrelas...',
    kundliMatch: 'Match De Kundli',
    dailyHoroscope: 'Horóscopo Diário',
    gemstones: 'Pedras',
    remedies: 'Remédios',
    comingSoon: 'Em Breve',
    sunSign: 'Signo Solar',
    moonSign: 'Signo Lunar',
    ascendant: 'Ascendente',
    currentDasha: 'Dasha Atual',
    nakshatra: 'Nakshatra',
    logout: 'Sair',
    thinking: 'O Oráculo Está Pensando...',
  },
  ja: {
    askPlaceholder: '星に聞く...',
    kundliMatch: 'クンドリマッチ',
    dailyHoroscope: '毎日の星占い',
    gemstones: '宝石',
    remedies: '対策',
    comingSoon: '近日公開',
    sunSign: '太陽星座',
    moonSign: '月星座',
    ascendant: 'アセンダント',
    currentDasha: '現在のダシャー',
    nakshatra: 'ナクシャトラ',
    logout: 'ログアウト',
    thinking: 'オラクルが考えています...',
  },
};

// Astro Tab Component
const AstroTab = ({ content }) => {
  const features = [
    { id: 'kundli', name: content.kundliMatch, active: true },
    { id: 'horoscope', name: content.dailyHoroscope, active: false },
    { id: 'gemstones', name: content.gemstones, active: false },
    { id: 'remedies', name: content.remedies, active: false },
  ];

  return (
    <View style={styles.astroContainer}>
      <View style={styles.featuresGrid}>
        {features.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[styles.featureOrb, !feature.active && styles.featureOrbDisabled]}
            onPress={() => {
              if (feature.active) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
            activeOpacity={feature.active ? 0.7 : 1}
          >
            <View style={styles.orbOuter}>
              <View style={styles.orbMiddle}>
                <View style={styles.orbInner}>
                  <Text style={[styles.featureName, !feature.active && styles.featureNameDisabled]}>
                    {feature.name}
                  </Text>
                  {!feature.active && (
                    <Text style={styles.comingSoon}>{content.comingSoon}</Text>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Profile Tab Component - Apple Style
const ProfileTab = ({ content, userData, kundliData, language, onLogout }) => {
  // Generate archetype based on ascendant
  const getArchetype = () => {
    const ascendant = kundliData?.raw?.ascendant || kundliData?.ascendant || 'Aries';
    
    const archetypes = {
      'Aries': { en: 'The Pioneer', hi: 'अग्रणी', zh: '先锋', es: 'El Pionero', pt: 'O Pioneiro', ja: '開拓者' },
      'Taurus': { en: 'The Sensualist', hi: 'रसिक', zh: '感官者', es: 'El Sensualista', pt: 'O Sensualista', ja: '官能者' },
      'Gemini': { en: 'The Storyteller', hi: 'कथावाचक', zh: '说书人', es: 'El Narrador', pt: 'O Contador', ja: '語り部' },
      'Cancer': { en: 'The Nurturer', hi: 'पालनकर्ता', zh: '养育者', es: 'El Protector', pt: 'O Protetor', ja: '養育者' },
      'Leo': { en: 'The Luminary', hi: 'प्रकाशमान', zh: '发光体', es: 'El Luminario', pt: 'O Luminário', ja: '発光体' },
      'Virgo': { en: 'The Analyst', hi: 'विश्लेषक', zh: '分析师', es: 'El Analista', pt: 'O Analista', ja: '分析家' },
      'Libra': { en: 'The Harmonist', hi: 'सामंजस्यकर्ता', zh: '和谐者', es: 'El Armonizador', pt: 'O Harmonizador', ja: '調和者' },
      'Scorpio': { en: 'The Alchemist', hi: 'रसायनी', zh: '炼金术士', es: 'El Alquimista', pt: 'O Alquimista', ja: '錬金術師' },
      'Sagittarius': { en: 'The Philosopher', hi: 'दार्शनिक', zh: '哲学家', es: 'El Filósofo', pt: 'O Filósofo', ja: '哲学者' },
      'Capricorn': { en: 'The Architect', hi: 'वास्तुकार', zh: '建筑师', es: 'El Arquitecto', pt: 'O Arquiteto', ja: '建築家' },
      'Aquarius': { en: 'The Visionary', hi: 'द्रष्टा', zh: '远见者', es: 'El Visionario', pt: 'O Visionário', ja: '先見者' },
      'Pisces': { en: 'The Mystic', hi: 'रहस्यवादी', zh: '神秘者', es: 'El Místico', pt: 'O Místico', ja: '神秘者' },
    };
    
    const lang = language || 'en';
    return archetypes[ascendant]?.[lang] || archetypes['Aries'][lang];
  };

  return (
    <View style={styles.profileContainer}>
      {/* Planet Symbol */}
      <View style={styles.planetContainer}>
        <View style={styles.planetGlow} />
        <Text style={styles.planetSymbol}>✧</Text>
      </View>

      {/* Name */}
      <Text style={styles.userName}>
        {userData?.name || 'Seeker'}
      </Text>

      {/* Archetype */}
      <Text style={styles.archetype}>
        {getArchetype()}
      </Text>

      {/* Soul Map */}
      <SoulMap kundliData={kundliData} language={language} />

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (onLogout) onLogout();
        }}
      >
        <Text style={styles.logoutText}>{content.logout}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Voice Button Component
const VoiceButton = ({ onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.voiceButton,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.voiceButtonInner} />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ language = 'en', userData, birthData, kundliData, onLogout }) {
  const [activeTab, setActiveTab] = useState(TABS.CHAT);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollViewRef = useRef(null);
  const content = CONTENT[language] || CONTENT.en;

  const handleTabPress = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleVoicePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowVoiceChat(true);
  };

  const handleVoiceClose = () => {
    setShowVoiceChat(false);
  };

  // Handle voice conversation updates
  const handleConversationUpdate = useCallback((voiceConversation) => {
    console.log('Voice conversation received:', voiceConversation);
    if (voiceConversation && voiceConversation.length > 0) {
      setMessages(prev => [...prev, ...voiceConversation]);
    }
  }, []);

  // Send text message
  // Send text message
  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return;

    const userMessage = { role: 'user', content: text };
    
    // Get current messages for history
    const currentMessages = [...messages, userMessage];
    
    setMessages(currentMessages);
    setInputText('');
    setIsThinking(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Send conversation history to backend
      const result = await chatWithOracle(text, kundliData, currentMessages);
      setIsThinking(false);

      if (result.success && result.data?.response) {
        const oracleMessage = { role: 'oracle', content: result.data.response };
        setMessages(prev => [...prev, oracleMessage]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsThinking(false);
    }
  }, [kundliData, messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
    }
  };

  // Show voice chat screen
  if (showVoiceChat) {
    return (
      <VoiceChatScreen
        language={language}
        kundliData={kundliData}
        onClose={handleVoiceClose}
        onConversationUpdate={handleConversationUpdate}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Chat Tab Content */}
      {activeTab === TABS.CHAT && (
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.oracleBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' ? styles.userText : styles.oracleText,
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            ))}

            {isThinking && (
              <View style={styles.thinkingContainer}>
                <Text style={styles.thinkingText}>{content.thinking}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={content.askPlaceholder}
                placeholderTextColor={colors.ash}
                multiline
                maxLength={500}
              />
              {inputText.trim().length > 0 && (
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Text style={styles.sendIcon}>↑</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {activeTab === TABS.ASTRO && <AstroTab content={content} />}
      {activeTab === TABS.PROFILE && (
        <ProfileTab
          content={content}
          userData={userData}
          kundliData={kundliData}
          language={language}
          onLogout={onLogout}
        />
      )}

      {/* Voice Button - Only show on Chat tab */}
      {activeTab === TABS.CHAT && (
        <View style={styles.voiceButtonContainer}>
          <VoiceButton onPress={handleVoicePress} />
        </View>
      )}

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress(TABS.CHAT)}
        >
          <View style={[styles.tabDot, activeTab === TABS.CHAT && styles.tabDotActive]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress(TABS.ASTRO)}
        >
          <View style={[styles.tabDot, activeTab === TABS.ASTRO && styles.tabDotActive]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => handleTabPress(TABS.PROFILE)}
        >
          <View style={[styles.tabDot, activeTab === TABS.PROFILE && styles.tabDotActive]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  chatContainer: {
    flex: 1,
    paddingTop: 60,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 18,
    marginBottom: spacing.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.white,
  },
  oracleBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.abyss,
    borderWidth: 1,
    borderColor: colors.ash,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.void,
  },
  oracleText: {
    color: colors.white,
  },
  thinkingContainer: {
    alignSelf: 'flex-start',
    padding: spacing.md,
  },
  thinkingText: {
    fontSize: 14,
    color: colors.silver,
    fontStyle: 'italic',
  },
  inputWrapper: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 160,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.abyss,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.ash,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.white,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.void,
  },
  voiceButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.ash,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.void,
  },
  voiceButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ash,
  },
  astroContainer: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  featureOrb: {
    width: (SCREEN_WIDTH - spacing.lg * 4 - spacing.xl) / 2,
    aspectRatio: 1,
  },
  featureOrbDisabled: {
    opacity: 0.4,
  },
  orbOuter: {
    flex: 1,
    borderRadius: 1000,
    backgroundColor: colors.abyss,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  orbMiddle: {
    flex: 1,
    borderRadius: 1000,
    backgroundColor: colors.void,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.ash,
  },
  orbInner: {
    flex: 1,
    borderRadius: 1000,
    backgroundColor: colors.abyss,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  featureNameDisabled: {
    color: colors.silver,
  },
  comingSoon: {
    fontSize: 9,
    color: colors.ash,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileContainer: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
    backgroundColor: colors.void,
  },
  planetContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  planetGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  planetSymbol: {
    fontSize: 40,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 26,
    fontWeight: '200',
    color: colors.white,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  archetype: {
    fontSize: 13,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 2,
    marginBottom: 20,
  },
  logoutButton: {
    marginTop: 'auto',
    marginBottom: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 100, 100, 0.7)',
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingBottom: 40,
    gap: spacing.xl,
  },
  tabItem: {
    padding: spacing.md,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ash,
  },
  tabDotActive: {
    backgroundColor: colors.white,
  },
});