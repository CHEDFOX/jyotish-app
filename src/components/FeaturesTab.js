import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

const { width: SW } = Dimensions.get('window');
const CARD_W = SW * 0.38;
const CARD_H = CARD_W * 1.15;

// ─── FEATURE CATEGORIES (Netflix-style rows) ───

const CATEGORIES = [
  {
    id: 'today',
    title: "Today's Guide",
    titleHi: 'आज का मार्गदर्शन',
    features: [
      { id: 'daily-vibe', icon: '🔮', label: 'Your Vibe', labelHi: 'आपकी ऊर्जा', sub: 'Right now', color: '#8B5CF6' },
      { id: 'power-hours', icon: '⏰', label: 'Power Hours', labelHi: 'शक्ति घंटे', sub: 'Hourly guide', color: '#3B82F6' },
      { id: 'planet-strength', icon: '📊', label: 'Planet Power', labelHi: 'ग्रह शक्ति', sub: 'Live dashboard', color: '#10B981' },
      { id: 'festivals', icon: '🪔', label: 'Festivals', labelHi: 'त्योहार', sub: 'Coming up', color: '#F59E0B' },
    ],
  },
  {
    id: 'love',
    title: 'Love & Relationships',
    titleHi: 'प्रेम और रिश्ते',
    features: [
      { id: 'cosmic-match', icon: '💕', label: 'Cosmic Match', labelHi: 'कॉस्मिक मैच', sub: '7 types', color: '#EC4899' },
      { id: 'ideal-partner', icon: '💫', label: 'Ideal Partner', labelHi: 'आदर्श साथी', sub: 'Find them', color: '#F472B6' },
      { id: 'match-oracle', icon: '🔮', label: 'Match Oracle', labelHi: 'मैच ओरेकल', sub: 'Ask anything', color: '#A855F7' },
      { id: 'relationship-xray', icon: '🔬', label: 'X-Ray', labelHi: 'एक्स-रे', sub: 'Deep dive', color: '#8B5CF6' },
    ],
  },
  {
    id: 'identity',
    title: 'Know Yourself',
    titleHi: 'खुद को जानें',
    features: [
      { id: 'soul-profile', icon: '✨', label: 'Soul Profile', labelHi: 'आत्मा प्रोफ़ाइल', sub: 'Who you are', color: '#D4AF37' },
      { id: 'rare-traits', icon: '💎', label: 'Rare Traits', labelHi: 'दुर्लभ गुण', sub: 'Only X% have', color: '#14B8A6' },
      { id: 'cosmic-novel', icon: '📖', label: 'Life Story', labelHi: 'जीवन कहानी', sub: 'Your book', color: '#6366F1' },
      { id: 'personal-deities', icon: '🙏', label: 'Your Deities', labelHi: 'आपके देवता', sub: 'Who to worship', color: '#F97316' },
    ],
  },
  {
    id: 'money',
    title: 'Money & Career',
    titleHi: 'धन और करियर',
    features: [
      { id: 'money-calendar', icon: '💰', label: 'Money Calendar', labelHi: 'धन कैलेंडर', sub: 'Best days', color: '#22C55E' },
      { id: 'gemstone-profile', icon: '💎', label: 'Gemstones', labelHi: 'रत्न', sub: 'Buy & pre-book', color: '#0EA5E9' },
      { id: 'year-map', icon: '📅', label: 'Year Map', labelHi: 'वर्ष नक्शा', sub: '2026 ahead', color: '#8B5CF6' },
      { id: 'danger-radar', icon: '⚡', label: 'Danger Radar', labelHi: 'खतरा रडार', sub: 'Warnings', color: '#EF4444' },
    ],
  },
  {
    id: 'decisions',
    title: 'Life Decisions',
    titleHi: 'जीवन निर्णय',
    features: [
      { id: 'what-if', icon: '🔄', label: 'What If?', labelHi: 'क्या होगा?', sub: 'Simulate paths', color: '#6366F1' },
      { id: 'find-muhurta', icon: '🕐', label: 'Best Date', labelHi: 'शुभ मुहूर्त', sub: '80 topics', color: '#D4AF37' },
      { id: 'past-event', icon: '🔍', label: 'Past Event', labelHi: 'पिछली घटना', sub: 'Why it happened', color: '#64748B' },
      { id: 'family-karma', icon: '👨‍👩‍👧', label: 'Family Karma', labelHi: 'परिवार कर्म', sub: 'Connections', color: '#A855F7' },
    ],
  },
];

// ─── FEATURE CARD ───

const FeatureCard = ({ feature, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { borderColor: feature.color + '20' }]}
    activeOpacity={0.7}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(feature.id);
    }}
  >
    <View style={[styles.cardIconWrap, { backgroundColor: feature.color + '12' }]}>
      <Text style={styles.cardIcon}>{feature.icon}</Text>
    </View>
    <Text style={styles.cardLabel} numberOfLines={1}>{feature.label}</Text>
    <Text style={styles.cardSub} numberOfLines={1}>{feature.sub}</Text>
  </TouchableOpacity>
);

// ─── CATEGORY ROW ───

const CategoryRow = ({ category, language, onFeaturePress }) => {
  const isHindi = language === 'hi';
  return (
    <View style={styles.rowContainer}>
      <Text style={styles.rowTitle}>
        {isHindi ? category.titleHi : category.title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowScroll}
        decelerationRate="fast"
        snapToInterval={CARD_W + 12}
      >
        {category.features.map(f => (
          <FeatureCard
            key={f.id}
            feature={{ ...f, label: isHindi ? f.labelHi : f.label }}
            onPress={onFeaturePress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ─── MAIN FEATURES TAB ───

export default function FeaturesTab({ language, onNavigate, kundliData }) {
  const isHindi = language === 'hi';

  const handleFeaturePress = useCallback((featureId) => {
    if (onNavigate) onNavigate(featureId);
  }, [onNavigate]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>
        {isHindi ? 'खोजें' : 'Explore'}
      </Text>
      {CATEGORIES.map(cat => (
        <CategoryRow
          key={cat.id}
          category={cat}
          language={language}
          onFeaturePress={handleFeaturePress}
        />
      ))}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

// ─── STYLES ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    fontSize: 28,
    fontWeight: '200',
    color: colors.white,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  rowContainer: {
    marginBottom: 28,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  rowScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2,
    marginTop: 'auto',
  },
  cardSub: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  bottomPad: {
    height: 40,
  },
});