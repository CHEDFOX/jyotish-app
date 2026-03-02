import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, spacing } from '../theme';
import { transcribeAudio, chatWithOracle, textToSpeech } from '../api/backend';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NUM_DOTS = 12;
const RADIUS = 60;
const SILENCE_DURATION = 2000; // 2 seconds of silence to auto-send
const LOW_AUDIO_THRESHOLD = 0.25;

// Voice Visualizer Dots
const VoiceDots = ({ audioLevel, isExiting, onExitComplete, isOracle }) => {
  const dotScales = useRef(
    Array.from({ length: NUM_DOTS }, () => new Animated.Value(1))
  ).current;
  
  const exitAnim = useRef(new Animated.Value(0)).current;
  const implodeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExiting) return;

    dotScales.forEach((scale, i) => {
      const delay = i * 20;
      const intensity = 1 + (audioLevel * 1.2);

      setTimeout(() => {
        Animated.spring(scale, {
          toValue: intensity,
          tension: 400,
          friction: 5,
          useNativeDriver: true,
        }).start();
      }, delay);
    });
  }, [audioLevel, isExiting]);

  useEffect(() => {
    if (!isExiting) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.timing(implodeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(exitAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        if (onExitComplete) onExitComplete();
      });
    });
  }, [isExiting]);

  const getCircularPosition = (index) => {
    const angle = (index / NUM_DOTS) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * RADIUS,
      y: Math.sin(angle) * RADIUS,
    };
  };

  const exitTranslateY = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_HEIGHT],
  });

  const exitOpacity = exitAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0],
  });

  return (
    <Animated.View
      style={[
        styles.dotsContainer,
        {
          opacity: exitOpacity,
          transform: [{ translateY: exitTranslateY }],
        },
      ]}
    >
      {dotScales.map((scale, i) => {
        const circlePos = getCircularPosition(i);

        const translateX = implodeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [circlePos.x, 0],
        });

        const translateY = implodeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [circlePos.y, 0],
        });

        const dotScale = implodeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.3],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              isOracle && styles.dotOracle,
              {
                transform: [
                  { translateX },
                  { translateY },
                  { scale: Animated.multiply(scale, dotScale) },
                ],
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
};

export default function VoiceChatScreen({ onClose, onConversationUpdate, kundliData, language = 'en' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOracleSpeaking, setIsOracleSpeaking] = useState(false);
  const [status, setStatus] = useState('');
  const [conversation, setConversation] = useState([]);

  const recording = useRef(null);
  const meteringInterval = useRef(null);
  const silenceStartTime = useRef(null);
  const soundObject = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isProcessingRef = useRef(false);
  const hasSpokenRef = useRef(false);

  const CONTENT = {
    en: { 
      listening: 'Listening...', 
      processing: 'Processing...', 
      thinking: 'Oracle is thinking...',
      speaking: 'Oracle is speaking...',
    },
    hi: { 
      listening: 'सुन रहे हैं...', 
      processing: 'प्रोसेसिंग...', 
      thinking: 'ऑरेकल सोच रहा है...',
      speaking: 'ऑरेकल बोल रहा है...',
    },
  };

  const content = CONTENT[language] || CONTENT.en;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    startRecording();

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (meteringInterval.current) {
      clearInterval(meteringInterval.current);
      meteringInterval.current = null;
    }
    if (recording.current) {
      try {
        recording.current.stopAndUnloadAsync();
      } catch (e) {}
      recording.current = null;
    }
    if (soundObject.current) {
      try {
        soundObject.current.unloadAsync();
      } catch (e) {}
      soundObject.current = null;
    }
  };

  const startRecording = async () => {
    if (isProcessingRef.current) return;
    
    try {
      console.log('Starting recording...');
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        console.log('Permission denied');
        handleExit();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
      setIsRecording(true);
      setStatus(content.listening);
      silenceStartTime.current = null;
      hasSpokenRef.current = false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Start metering with silence detection
      meteringInterval.current = setInterval(async () => {
        if (!recording.current || isProcessingRef.current) return;
        
        try {
          const status = await recording.current.getStatusAsync();
          
          // Simulate audio level (metering not always available)
          let level = Math.random() * 0.5 + 0.1;
          
          // If we have actual metering data, use it
          if (status.metering !== undefined && status.metering !== null) {
            const db = status.metering;
            level = Math.max(0, Math.min(1, (db + 60) / 60));
          }
          
          setAudioLevel(level);
          
          // Silence detection logic
          if (level < LOW_AUDIO_THRESHOLD) {
            // Low audio detected
            if (hasSpokenRef.current) {
              // User has spoken before, start silence timer
              if (!silenceStartTime.current) {
                silenceStartTime.current = Date.now();
                console.log('Silence started...');
              } else if (Date.now() - silenceStartTime.current > SILENCE_DURATION) {
                // Silence threshold reached, process recording
                console.log('Silence threshold reached, processing...');
                processRecording();
              }
            }
          } else {
            // Sound detected
            hasSpokenRef.current = true;
            silenceStartTime.current = null;
          }
          
        } catch (e) {
          // Ignore metering errors
        }
      }, 150);

    } catch (error) {
      console.error('Start recording error:', error);
      handleExit();
    }
  };

  const processRecording = async () => {
    if (isProcessingRef.current || !recording.current) return;
    isProcessingRef.current = true;

    console.log('Processing recording...');
    
    // Stop metering
    if (meteringInterval.current) {
      clearInterval(meteringInterval.current);
      meteringInterval.current = null;
    }
    
    setAudioLevel(0);
    setIsRecording(false);
    setIsProcessing(true);
    setStatus(content.processing);

    try {
      await recording.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.current.getURI();
      recording.current = null;
      
      console.log('Recording URI:', uri);

      if (uri) {
        // Transcribe
        console.log('Transcribing...');
        const transcribeResult = await transcribeAudio(uri);
        console.log('Transcript:', transcribeResult);

        if (transcribeResult.success && transcribeResult.transcript?.trim()) {
          const userText = transcribeResult.transcript.trim();
          
          // Add user message to conversation
          const newConversation = [...conversation, { role: 'user', content: userText }];
          setConversation(newConversation);
          
          // Get Oracle response
          setStatus(content.thinking);
          console.log('Getting Oracle response...');
          const chatResult = await chatWithOracle(userText, kundliData);
          console.log('Oracle response:', chatResult);

          if (chatResult.success && chatResult.data?.response) {
            const oracleText = chatResult.data.response;
            
            // Add oracle message to conversation
            const updatedConversation = [...newConversation, { role: 'oracle', content: oracleText }];
            setConversation(updatedConversation);
            
            // Convert to speech and play
            setStatus(content.speaking);
            setIsOracleSpeaking(true);
            await playOracleResponse(oracleText);
            setIsOracleSpeaking(false);
          }
        } else {
          console.log('No transcript received');
        }
      }

      // Reset and start listening again
      setIsProcessing(false);
      isProcessingRef.current = false;
      startRecording();

    } catch (error) {
      console.error('Process recording error:', error);
      setIsProcessing(false);
      isProcessingRef.current = false;
      startRecording();
    }
  };

  const playOracleResponse = async (text) => {
  try {
    console.log('Getting TTS for:', text.substring(0, 50) + '...');
    const ttsResult = await textToSpeech(text);
    console.log('TTS result success:', ttsResult.success);
    
    if (ttsResult.success && ttsResult.audio) {
      console.log('Got audio, saving to file...');
      
      // Save base64 audio to file
      const audioUri = FileSystem.cacheDirectory + 'oracle_response_' + Date.now() + '.mp3';
      await FileSystem.writeAsStringAsync(audioUri, ttsResult.audio, {
        encoding: 'base64',
      });
      
      console.log('Audio saved to:', audioUri);
      
      // Play audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      console.log('Creating sound...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, volume: 1.0 }
      );
      soundObject.current = sound;
      console.log('Playing audio...');
      
      // Animate dots while speaking
      const speakingInterval = setInterval(() => {
        setAudioLevel(Math.random() * 0.8 + 0.2);
      }, 100);
      
      // Wait for audio to finish
      return new Promise((resolve) => {
        sound.setOnPlaybackStatusUpdate((playbackStatus) => {
          if (playbackStatus.didJustFinish) {
            console.log('Audio finished playing');
            clearInterval(speakingInterval);
            setAudioLevel(0);
            sound.unloadAsync();
            soundObject.current = null;
            resolve();
          }
        });
      });
      
    } else {
      console.log('TTS failed or no audio:', ttsResult.error);
    }
  } catch (error) {
    console.error('Play oracle response error:', error);
  }
};

  const handleExit = () => {
    cleanup();
    
    // Send conversation to chat screen
    if (onConversationUpdate && conversation.length > 0) {
      onConversationUpdate(conversation);
    }
    
    setIsExiting(true);
  };

  const handleExitComplete = () => {
    if (onClose) onClose();
  };

  // Manual stop button (tap on dots)
  const handleManualStop = () => {
    if (isRecording && !isProcessingRef.current) {
      hasSpokenRef.current = true; // Force it to process
      processRecording();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleExit}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* Center area - tap to manually stop */}
      <TouchableOpacity 
        style={styles.centerContainer}
        activeOpacity={0.9}
        onPress={handleManualStop}
      >
        <VoiceDots
          audioLevel={audioLevel}
          isExiting={isExiting}
          onExitComplete={handleExitComplete}
          isOracle={isOracleSpeaking}
        />
      </TouchableOpacity>

      {/* Status Text */}
      {!isExiting && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{status}</Text>
          {isRecording && !isProcessing && (
            <Text style={styles.hintText}>Tap circle to send • Auto-sends after silence</Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    padding: spacing.md,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 28,
    color: colors.silver,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    width: RADIUS * 2 + 40,
    height: RADIUS * 2 + 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
  },
  dotOracle: {
    backgroundColor: colors.gold,
  },
  statusContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.silver,
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 12,
    color: colors.ash,
    marginTop: spacing.sm,
  },
});