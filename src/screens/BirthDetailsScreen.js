import React, { useState, useRef, useEffect } from 'react';
import { saveBirthData } from '../api/userService';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing } from '../theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GOOGLE_PLACES_API_KEY = 'AIzaSyDREL8c7cGEV3R1igFTWHay4IqOJn8-B0k';

const STEPS = {
  DATE: 'date',
  TIME: 'time',
  PLACE: 'place',
};

const CONTENT = {
  en: {
    date: {
      title: 'When Did You Arrive On Earth?',
    },
    time: {
      title: 'What Time You Arrived?',
    },
    place: {
      title: 'Where Did You Take Your First Breath?',
      placeholder: 'Search City...',
    },
    continue: 'Continue',
  },
  hi: {
    date: {
      title: 'आप पृथ्वी पर कब आए?',
    },
    time: {
      title: 'आप किस समय आए?',
    },
    place: {
      title: 'आपने अपनी पहली सांस कहां ली?',
      placeholder: 'शहर खोजें...',
    },
    continue: 'आगे बढ़ें',
  },
  zh: {
    date: {
      title: '你何时来到地球?',
    },
    time: {
      title: '你何时到达?',
    },
    place: {
      title: '你在哪里呼吸了第一口气?',
      placeholder: '搜索城市...',
    },
    continue: '继续',
  },
  es: {
    date: {
      title: '¿Cuándo Llegaste A La Tierra?',
    },
    time: {
      title: '¿A Qué Hora Llegaste?',
    },
    place: {
      title: '¿Dónde Tomaste Tu Primer Aliento?',
      placeholder: 'Buscar Ciudad...',
    },
    continue: 'Continuar',
  },
  pt: {
    date: {
      title: 'Quando Você Chegou Na Terra?',
    },
    time: {
      title: 'Que Horas Você Chegou?',
    },
    place: {
      title: 'Onde Você Deu Seu Primeiro Suspiro?',
      placeholder: 'Buscar Cidade...',
    },
    continue: 'Continuar',
  },
  ja: {
    date: {
      title: 'いつ地球に来ましたか?',
    },
    time: {
      title: '何時に到着しましたか?',
    },
    place: {
      title: '最初の呼吸をどこでしましたか?',
      placeholder: '都市を検索...',
    },
    continue: '続ける',
  },
};

// Scroll Picker Component with fade effect
const ScrollPicker = ({ data, selectedIndex, onSelect, itemHeight = 50 }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0) {
      scrollRef.current.scrollToOffset({
        offset: selectedIndex * itemHeight,
        animated: false,
      });
    }
  }, []);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / itemHeight);
    if (index >= 0 && index < data.length && index !== selectedIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(index);
    }
  };

  const renderItem = ({ item, index }) => {
    const distance = Math.abs(index - selectedIndex);
    const opacity = distance === 0 ? 1 : distance === 1 ? 0.4 : 0.15;
    
    return (
      <View style={[styles.pickerItem, { height: itemHeight }]}>
        <Text style={[styles.pickerText, { opacity }]}>
          {item}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.pickerContainer, { height: itemHeight * 5 }]}>
      <View style={[styles.pickerHighlight, { top: itemHeight * 2, height: itemHeight }]} />
      
      <FlatList
        ref={scrollRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        contentContainerStyle={{ paddingVertical: itemHeight * 2 }}
        getItemLayout={(data, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />
    </View>
  );
};

// Generate data for pickers
const generateDays = () => Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const generateMonths = () => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const generateYears = () => Array.from({ length: 100 }, (_, i) => String(2025 - i));
const generateHours = () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const generateMinutes = () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function BirthDetailsScreen({ onComplete, language = 'en' }) {
  const [step, setStep] = useState(STEPS.DATE);
  
  // Date state
  const [dayIndex, setDayIndex] = useState(14);
  const [monthIndex, setMonthIndex] = useState(0);
  const [yearIndex, setYearIndex] = useState(25);
  
  // Time state
  const [hourIndex, setHourIndex] = useState(12);
  const [minuteIndex, setMinuteIndex] = useState(0);
  
  // Place state
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const searchTimeout = useRef(null);
  const content = CONTENT[language] || CONTENT.en;

  const days = generateDays();
  const months = generateMonths();
  const years = generateYears();
  const hours = generateHours();
  const minutes = generateMinutes();

  const animateTransition = (callback) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleDateContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateTransition(() => setStep(STEPS.TIME));
  };

  const handleTimeContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateTransition(() => setStep(STEPS.PLACE));
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === STEPS.TIME) {
      animateTransition(() => setStep(STEPS.DATE));
    } else if (step === STEPS.PLACE) {
      animateTransition(() => setStep(STEPS.TIME));
    }
  };

  // Google Places API search
  const handlePlaceSearch = async (query) => {
    setPlaceQuery(query);
    setSelectedPlace(null);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (query.length < 3) {
      setPlaceResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`
        );
        const data = await response.json();
        
        if (data.predictions) {
          setPlaceResults(data.predictions.map(p => ({
            id: p.place_id,
            name: p.structured_formatting.main_text,
            fullName: p.description,
          })));
        }
      } catch (error) {
        console.error('Places search error:', error);
      }
      setIsSearching(false);
    }, 300);
  };

  const handlePlaceSelect = async (place) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPlaceQuery(place.name);
    setPlaceResults([]);
    
    // Get place details for coordinates
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.id}&fields=geometry,formatted_address&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();
      
      if (data.result) {
        setSelectedPlace({
          id: place.id,
          name: place.name,
          fullName: place.fullName,
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
        });
      }
    } catch (error) {
      console.error('Place details error:', error);
      setSelectedPlace({
        id: place.id,
        name: place.name,
        fullName: place.fullName,
      });
    }
  };

  const handleComplete = async () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  
  const birthData = {
    date: {
      day: days[dayIndex],
      month: months[monthIndex],
      monthIndex: monthIndex + 1,
      year: years[yearIndex],
    },
    time: {
      hour: hours[hourIndex],
      minute: minutes[minuteIndex],
    },
    place: selectedPlace,
  };
  
  // Save birth data to database
  await saveBirthData(birthData);
  
  if (onComplete) onComplete(birthData);
};

  const renderDate = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>{content.date.title}</Text>

      <View style={styles.datePickerRow}>
        <ScrollPicker
          data={days}
          selectedIndex={dayIndex}
          onSelect={setDayIndex}
        />
        <ScrollPicker
          data={months}
          selectedIndex={monthIndex}
          onSelect={setMonthIndex}
        />
        <ScrollPicker
          data={years}
          selectedIndex={yearIndex}
          onSelect={setYearIndex}
        />
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.continueButton} onPress={handleDateContinue}>
          <Text style={styles.continueText}>{content.continue}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTime = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{content.time.title}</Text>

      <View style={styles.timePickerRow}>
        <ScrollPicker
          data={hours}
          selectedIndex={hourIndex}
          onSelect={setHourIndex}
        />
        <Text style={styles.timeSeparator}>:</Text>
        <ScrollPicker
          data={minutes}
          selectedIndex={minuteIndex}
          onSelect={setMinuteIndex}
        />
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.continueButton} onPress={handleTimeContinue}>
          <Text style={styles.continueText}>{content.continue}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlace = () => (
    <View style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{content.place.title}</Text>

      <TextInput
        style={styles.searchInput}
        value={placeQuery}
        onChangeText={handlePlaceSearch}
        placeholder={content.place.placeholder}
        placeholderTextColor={colors.ash}
        autoCorrect={false}
      />

      {isSearching && (
        <ActivityIndicator color={colors.silver} style={styles.loader} />
      )}

      {placeResults.length > 0 && (
        <View style={styles.resultsContainer}>
          {placeResults.map((place) => (
            <TouchableOpacity
              key={place.id}
              style={styles.resultItem}
              onPress={() => handlePlaceSelect(place)}
            >
              <Text style={styles.resultName}>{place.name}</Text>
              <Text style={styles.resultFullName} numberOfLines={1}>{place.fullName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.bottomSection}>
        {selectedPlace && (
          <TouchableOpacity style={styles.continueButton} onPress={handleComplete}>
            <Text style={styles.continueText}>{content.continue}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === STEPS.DATE && renderDate()}
        {step === STEPS.TIME && renderTime()}
        {step === STEPS.PLACE && renderPlace()}
      </Animated.View>
      
      {/* Progress dots */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, step === STEPS.DATE && styles.progressDotActive]} />
        <View style={[styles.progressDot, step === STEPS.TIME && styles.progressDotActive]} />
        <View style={[styles.progressDot, step === STEPS.PLACE && styles.progressDotActive]} />
      </View>
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
    paddingHorizontal: spacing.xl,
  },
  stepContainer: {
    flex: 1,
    paddingTop: SCREEN_HEIGHT * 0.12,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 0,
    padding: spacing.md,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 24,
    color: colors.silver,
  },
  title: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 34,
    marginTop: spacing.xxl,
  },
  // Date/Time Picker
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.white,
    marginHorizontal: spacing.sm,
  },
  pickerContainer: {
    width: 80,
    overflow: 'hidden',
  },
  pickerHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.abyss,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ash,
    zIndex: -1,
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.white,
  },
  // Place Search
  searchInput: {
    fontSize: 17,
    color: colors.white,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.ash,
  },
  loader: {
    marginTop: spacing.md,
  },
  resultsContainer: {
    marginTop: spacing.md,
    backgroundColor: colors.abyss,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.ash,
    maxHeight: 200,
  },
  resultItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ash,
  },
  resultName: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  resultFullName: {
    fontSize: 12,
    color: colors.silver,
    marginTop: 2,
  },
  // Bottom Section
  bottomSection: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  continueButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.gold,
    letterSpacing: 0.3,
  },
  // Progress Dots
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ash,
  },
  progressDotActive: {
    backgroundColor: colors.white,
  },
});