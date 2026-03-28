import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

const STAR_TEMPS = [
  '#FFFCF8', '#BED2FF', '#F0EEE8', '#AAC3FF',
  '#E6DCCD', '#DCC8BE', '#D2E1FF',
];

function Star({ x, y, size, color, baseOpacity, speed, phase, hasDiffraction }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: (1 / speed) * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: (1 / speed) * 1000,
          useNativeDriver: true,
        }),
      ])
    );
    // Offset start time by phase
    setTimeout(() => loop.start(), phase * 500);
    return () => loop.stop();
  }, []);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [baseOpacity * 0.6, Math.min(1, baseOpacity * 1.4)],
  });

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: x,
          top: y,
          width: size * 2,
          height: size * 2,
          borderRadius: size,
          backgroundColor: color,
          opacity,
          shadowColor: color,
          shadowOpacity: hasDiffraction ? 0.8 : 0.3,
          shadowRadius: hasDiffraction ? size * 3 : size,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    />
  );
}

export default function Starfield() {
  const stars = useMemo(() => {
    const all = [];
    // Dust — tiny, very faint
    for (let i = 0; i < 120; i++) {
      all.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 0.4 + 0.1,
        color: STAR_TEMPS[Math.floor(Math.random() * STAR_TEMPS.length)],
        baseOpacity: Math.random() * 0.12 + 0.02,
        speed: Math.random() * 0.003 + 0.001,
        phase: Math.random() * Math.PI * 2,
        hasDiffraction: false,
      });
    }
    // Background stars
    for (let i = 0; i < 100; i++) {
      all.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 0.8 + 0.3,
        color: STAR_TEMPS[Math.floor(Math.random() * STAR_TEMPS.length)],
        baseOpacity: Math.random() * 0.3 + 0.08,
        speed: Math.random() * 0.005 + 0.001,
        phase: Math.random() * Math.PI * 2,
        hasDiffraction: false,
      });
    }
    // Mid stars
    for (let i = 0; i < 35; i++) {
      all.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 1.0 + 0.6,
        color: STAR_TEMPS[Math.floor(Math.random() * STAR_TEMPS.length)],
        baseOpacity: Math.random() * 0.4 + 0.2,
        speed: Math.random() * 0.008 + 0.003,
        phase: Math.random() * Math.PI * 2,
        hasDiffraction: Math.random() > 0.6,
      });
    }
    // Bright foreground
    for (let i = 0; i < 8; i++) {
      all.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: Math.random() * 1.2 + 1.0,
        color: STAR_TEMPS[Math.floor(Math.random() * 3)],
        baseOpacity: Math.random() * 0.3 + 0.5,
        speed: Math.random() * 0.015 + 0.005,
        phase: Math.random() * Math.PI * 2,
        hasDiffraction: true,
      });
    }
    return all;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep space gradient via layered views */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
      <View style={[StyleSheet.absoluteFill, {
        backgroundColor: 'transparent',
        // Subtle warm center via border trickery — just keep pure black
      }]} />
      {stars.map((s, i) => <Star key={i} {...s} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
});