import React, { useState, useRef, useEffect } from 'react';
import { saveUserInfo } from '../api/userService';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import * as Linking from 'expo-linking';
import { colors, spacing } from '../theme';
import { auth, supabase } from '../api/supabase';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STEPS = {
  NAME: 'name',
  PASSCODE: 'passcode',
  CONTACT: 'contact',
  VERIFY: 'verify',
};

const CONTENT = {
  en: {
    name: {
      title: 'The Name That Carries Your Essence',
      placeholder: 'Your Name',
    },
    passcode: {
      title: 'Create Your Sacred Key',
    },
    contact: {
      title: 'The Path Of Signal',
      emailPlaceholder: 'your@email.com',
      button: 'Send Link',
    },
    verify: {
      line1: 'In Your Email Lies',
      line2: 'The Door To The Universe.',
      line3: 'The Stars Await Your Step.',
      resend: 'Resend',
      infoTitle: 'A Link Has Been Sent To Your Mail.',
      infoSubtitle: 'Verify Your Presence',
    },
    continue: 'Continue',
    error: 'Something Went Wrong. Please Try Again.',
  },
  hi: {
    name: {
      title: 'वो नाम जो आपके अस्तित्व को धारण करे',
      placeholder: 'आपका नाम',
    },
    passcode: {
      title: 'अपनी पवित्र कुंजी बनाएं',
    },
    contact: {
      title: 'संकेत का मार्ग',
      emailPlaceholder: 'your@email.com',
      button: 'लिंक भेजें',
    },
    verify: {
      line1: 'आपके ईमेल में छुपा है',
      line2: 'ब्रह्मांड का द्वार।',
      line3: 'तारे आपके कदम की प्रतीक्षा में हैं।',
      resend: 'पुनः भेजें',
      infoTitle: 'आपके मेल पर एक लिंक भेजा गया है।',
      infoSubtitle: 'अपनी उपस्थिति सत्यापित करें',
    },
    continue: 'आगे बढ़ें',
    error: 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
  },
  zh: {
    name: {
      title: '承载你灵魂的名字',
      placeholder: '你的名字',
    },
    passcode: {
      title: '创建你的神圣密钥',
    },
    contact: {
      title: '信号之路',
      emailPlaceholder: 'your@email.com',
      button: '发送链接',
    },
    verify: {
      line1: '在你的邮件中',
      line2: '藏着通往宇宙的门。',
      line3: '星辰等待你的脚步。',
      resend: '重新发送',
      infoTitle: '链接已发送至你的邮箱。',
      infoSubtitle: '验证你的存在',
    },
    continue: '继续',
    error: '出了点问题。请重试。',
  },
  es: {
    name: {
      title: 'El Nombre Que Lleva Tu Esencia',
      placeholder: 'Tu Nombre',
    },
    passcode: {
      title: 'Crea Tu Llave Sagrada',
    },
    contact: {
      title: 'El Camino De La Señal',
      emailPlaceholder: 'tu@correo.com',
      button: 'Enviar Enlace',
    },
    verify: {
      line1: 'En Tu Correo Yace',
      line2: 'La Puerta Al Universo.',
      line3: 'Las Estrellas Esperan Tu Paso.',
      resend: 'Reenviar',
      infoTitle: 'Un Enlace Ha Sido Enviado A Tu Correo.',
      infoSubtitle: 'Verifica Tu Presencia',
    },
    continue: 'Continuar',
    error: 'Algo Salió Mal. Por Favor Intenta De Nuevo.',
  },
  pt: {
    name: {
      title: 'O Nome Que Carrega Sua Essência',
      placeholder: 'Seu Nome',
    },
    passcode: {
      title: 'Crie Sua Chave Sagrada',
    },
    contact: {
      title: 'O Caminho Do Sinal',
      emailPlaceholder: 'seu@email.com',
      button: 'Enviar Link',
    },
    verify: {
      line1: 'No Seu Email Está',
      line2: 'A Porta Para O Universo.',
      line3: 'As Estrelas Aguardam Seu Passo.',
      resend: 'Reenviar',
      infoTitle: 'Um Link Foi Enviado Para Seu Email.',
      infoSubtitle: 'Verifique Sua Presença',
    },
    continue: 'Continuar',
    error: 'Algo Deu Errado. Por Favor Tente Novamente.',
  },
  ja: {
    name: {
      title: 'あなたの本質を宿す名前',
      placeholder: 'お名前',
    },
    passcode: {
      title: '神聖な鍵を作成',
    },
    contact: {
      title: '信号の道',
      emailPlaceholder: 'your@email.com',
      button: 'リンクを送信',
    },
    verify: {
      line1: 'あなたのメールに',
      line2: '宇宙への扉がある。',
      line3: '星があなたを待っています。',
      resend: '再送信',
      infoTitle: 'リンクがメールに送信されました。',
      infoSubtitle: 'あなたの存在を確認してください',
    },
    continue: '続ける',
    error: '問題が発生しました。もう一度お試しください。',
  },
};

// Waiting Dots Component
const WaitingDots = ({ verified, onAnimationComplete }) => {
  const NUM_DOTS = 6;
  const RADIUS = 24;

  const dotAnims = useRef(
    Array.from({ length: NUM_DOTS }, () => ({
      scale: new Animated.Value(1),
      opacity: new Animated.Value(0.3),
      x: new Animated.Value(0),
      y: new Animated.Value(0),
    }))
  ).current;

  const [currentDot, setCurrentDot] = useState(0);
  const exitAnim = useRef(new Animated.Value(0)).current;

  // Circular pulse animation
  useEffect(() => {
    if (verified) return;

    const pulse = () => {
      const dot = dotAnims[currentDot];

      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot.scale, {
            toValue: 1.6,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(dot.opacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot.scale, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(dot.opacity, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setCurrentDot((prev) => (prev + 1) % NUM_DOTS);
      });
    };

    const timer = setTimeout(pulse, 80);
    return () => clearTimeout(timer);
  }, [currentDot, verified]);

  // Exit animation when verified
  useEffect(() => {
    if (!verified) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Step 1: Rearrange to horizontal line
    const lineAnimations = dotAnims.map((dot, i) => {
      const targetX = (i - 2.5) * 12;
      const targetY = 0;

      return Animated.parallel([
        Animated.spring(dot.x, {
          toValue: targetX,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(dot.y, {
          toValue: targetY,
          tension: 120,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(dot.opacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dot.scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(lineAnimations).start(() => {
      setTimeout(() => {
        Animated.timing(exitAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          if (onAnimationComplete) onAnimationComplete();
        });
      }, 150);
    });
  }, [verified]);

  const getCircularPosition = (index) => {
    const angle = (index / NUM_DOTS) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * RADIUS,
      y: Math.sin(angle) * RADIUS,
    };
  };

  return (
    <View style={styles.dotsContainer}>
      {dotAnims.map((anim, i) => {
        const circlePos = getCircularPosition(i);

        const translateX = verified
          ? Animated.add(
              anim.x,
              exitAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, SCREEN_WIDTH],
              })
            )
          : circlePos.x;

        const scaleX = exitAnim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [1, 1, 12],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                transform: [
                  { translateX: verified ? translateX : circlePos.x },
                  { translateY: verified ? anim.y : circlePos.y },
                  { scale: anim.scale },
                  { scaleX: verified ? scaleX : 1 },
                ],
                opacity: anim.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// Info Icon Component
const InfoIcon = ({ onPress }) => (
  <TouchableOpacity style={styles.infoButton} onPress={onPress}>
    <View style={styles.infoIcon}>
      <Text style={styles.infoIconText}>i</Text>
    </View>
  </TouchableOpacity>
);

// Info Modal Component
const InfoModal = ({ visible, onClose, content }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.modalOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{content.infoTitle}</Text>
        <Text style={styles.modalSubtitle}>{content.infoSubtitle}</Text>
      </View>
    </TouchableOpacity>
  </Modal>
);

export default function AuthScreen({ onComplete, language = 'en' }) {
  const [step, setStep] = useState(STEPS.NAME);
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [contact, setContact] = useState('');
  const [contactType, setContactType] = useState('email');
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const userData = useRef(null);

  const content = CONTENT[language] || CONTENT.en;

  // Animate text on verify screen
  useEffect(() => {
    if (step === STEPS.VERIFY) {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [step]);

  const handleAuthSuccess = async (user) => {
  // Save user info to database
  await saveUserInfo(name, passcode);
  
  userData.current = {
    name,
    passcode,
    contact,
    contactType,
    user,
  };
  setVerified(true);
};

  const handleExitAnimationComplete = () => {
    if (onComplete && userData.current) {
      onComplete(userData.current);
    }
  };

  // Handle deep link
  useEffect(() => {
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (url && (url.includes('access_token') || url.includes('token='))) {
        try {
          let accessToken, refreshToken;
          
          if (url.includes('#')) {
            const params = new URLSearchParams(url.split('#')[1]);
            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
          } else {
            const params = new URLSearchParams(url.split('?')[1]);
            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
          }

          if (accessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (!error && data.session) {
              handleAuthSuccess(data.session.user);
            }
          }
        } catch (e) {
          console.error('Deep link error:', e);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription?.remove();
  }, [name, passcode, contact, contactType]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleAuthSuccess(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [name, passcode, contact, contactType]);

  // Enable resend after 30 seconds
  useEffect(() => {
    if (step === STEPS.VERIFY && !verified) {
      setCanResend(false);
      const timer = setTimeout(() => {
        setCanResend(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [step, verified]);

  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 300);
  }, [step]);

  const animateTransition = (callback) => {
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

  const handleNameSubmit = () => {
    if (name.trim().length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateTransition(() => setStep(STEPS.PASSCODE));
  };

  const handlePasscodeChange = (value) => {
    if (value.length <= 4) {
      setPasscode(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (value.length === 4) {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          animateTransition(() => setStep(STEPS.CONTACT));
        }, 200);
      }
    }
  };

  const handleContactSubmit = async () => {
    if (contact.trim().length < 5) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const redirectUrl = Linking.createURL('auth');
      let result;

      if (contactType === 'email') {
        result = await supabase.auth.signInWithOtp({
          email: contact.trim().toLowerCase(),
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
      } else {
        result = await auth.sendOTP(contact.trim());
      }

      if (result.error) {
        Alert.alert('Error', result.error.message || content.error);
        setIsLoading(false);
        return;
      }

      animateTransition(() => setStep(STEPS.VERIFY));
    } catch (error) {
      Alert.alert('Error', content.error);
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const redirectUrl = Linking.createURL('auth');

      if (contactType === 'email') {
        await supabase.auth.signInWithOtp({
          email: contact.trim().toLowerCase(),
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
      } else {
        await auth.sendOTP(contact.trim());
      }

      setTimeout(() => setCanResend(true), 30000);
    } catch (error) {
      Alert.alert('Error', content.error);
      setCanResend(true);
    }

    setIsLoading(false);
  };

  const renderName = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>{content.name.title}</Text>

      <TextInput
        ref={inputRef}
        style={styles.textInput}
        value={name}
        onChangeText={setName}
        placeholder={content.name.placeholder}
        placeholderTextColor={colors.ash}
        autoCapitalize="words"
        autoCorrect={false}
        onSubmitEditing={handleNameSubmit}
        returnKeyType="next"
      />

      {name.trim().length >= 2 && (
        <TouchableOpacity style={styles.continueButton} onPress={handleNameSubmit}>
          <Text style={styles.continueText}>{content.continue}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPasscode = () => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>{content.passcode.title}</Text>

    <View style={styles.passcodeContainer}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.passcodeBox,
            passcode.length > i && styles.passcodeBoxFilled,
          ]}
        >
          {passcode.length > i && <View style={styles.passcodeDot} />}
        </View>
      ))}
    </View>

    <TextInput
      ref={inputRef}
      style={styles.hiddenInput}
      value={passcode}
      onChangeText={handlePasscodeChange}
      keyboardType="number-pad"
      maxLength={4}
      autoFocus
    />
  </View>
);

  const renderContact = () => (
  <View style={styles.stepContainer}>
    <Text style={styles.title}>{content.contact.title}</Text>

    <TextInput
      ref={inputRef}
      style={styles.textInput}
      value={contact}
      onChangeText={setContact}
      placeholder={content.contact.emailPlaceholder}
      placeholderTextColor={colors.ash}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      onSubmitEditing={handleContactSubmit}
      returnKeyType="send"
      editable={!isLoading}
    />

    {contact.trim().length >= 5 && (
      <TouchableOpacity
        style={[styles.continueButton, isLoading && styles.buttonDisabled]}
        onPress={handleContactSubmit}
        disabled={isLoading}
      >
        <Text style={styles.continueText}>
          {isLoading ? '...' : content.contact.button}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

  const renderVerify = () => (
  <View style={styles.verifyContainer}>
    {/* Info Icon - Top Left */}
    <InfoIcon onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowInfo(true);
    }} />

    {/* Info Modal */}
    <InfoModal 
      visible={showInfo} 
      onClose={() => setShowInfo(false)} 
      content={content.verify}
    />

    {/* Text above animation */}
    <Animated.View style={[styles.verifyTextTop, { opacity: textFadeAnim }]}>
      <Text style={styles.verifyLine1}>{content.verify.line1}</Text>
      <Text style={styles.verifyLine2}>{content.verify.line2}</Text>
    </Animated.View>

    {/* Animation */}
    <WaitingDots
      verified={verified}
      onAnimationComplete={handleExitAnimationComplete}
    />

    {/* Text below animation */}
    <Animated.View style={[styles.verifyTextBottom, { opacity: textFadeAnim }]}>
      <Text style={styles.verifyLine3}>{content.verify.line3}</Text>
    </Animated.View>

    {/* Resend */}
    {!verified && (
      <TouchableOpacity
        style={styles.resendLink}
        onPress={handleResend}
        disabled={!canResend || isLoading}
      >
        <Text style={[styles.resendText, canResend && styles.resendTextActive]}>
          {content.verify.resend}
        </Text>
      </TouchableOpacity>
    )}

    {/* Skip Button for Testing */}
    {!verified && (
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          if (onComplete) {
            onComplete({
              name,
              passcode,
              contact,
              contactType: 'email',
              user: null,
            });
          }
        }}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    )}
  </View>
);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === STEPS.NAME && renderName()}
        {step === STEPS.PASSCODE && renderPasscode()}
        {step === STEPS.CONTACT && renderContact()}
        {step === STEPS.VERIFY && renderVerify()}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  stepContainer: {
    marginTop: SCREEN_HEIGHT * 0.25,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.silver,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },
  textInput: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.ash,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },
  passcodeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  passcodeBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.ash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passcodeBoxFilled: {
    borderColor: colors.white,
  },
  passcodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  toggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.ash,
  },
  toggleActive: {
    borderColor: colors.white,
    backgroundColor: colors.white,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.silver,
  },
  toggleTextActive: {
    color: colors.void,
  },
  continueButton: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gold,
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Verify screen
  verifyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    position: 'absolute',
    top: 60,
    left: 0,
    padding: spacing.md,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.silver,
    fontStyle: 'italic',
  },
  dotsContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.white,
  },
  verifyTextContainer: {
    alignItems: 'center',
  },
  verifyLine1: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.silver,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  verifyLine2: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.silver,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  verifyLine3: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.white,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  resendLink: {
    position: 'absolute',
    bottom: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ash,
  },
  resendTextActive: {
    color: colors.gold,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.abyss,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.ash,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 22,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.silver,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.2,
  },
  skipButton: {
  position: 'absolute',
  bottom: 40,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
},
skipText: {
  fontSize: 12,
  color: colors.ash,
},
verifyTextTop: {
  alignItems: 'center',
  marginBottom: spacing.xxl,
},
verifyTextBottom: {
  alignItems: 'center',
  marginTop: spacing.xxl,
},
});