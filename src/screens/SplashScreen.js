import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 250;

const SINGULARITY_X = -30;
const SINGULARITY_Y = SCREEN_HEIGHT / 2;

class ParticleSystem {
  constructor() {
    this.particles = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * SCREEN_WIDTH;
      const y = Math.random() * SCREEN_HEIGHT;
      
      this.particles.push({
        id: i,
        x,
        y,
        vx: 0,
        vy: 0,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.3 + 0.5,
        consumed: false,
      });
    }
  }

  update() {
    const G = 18;

    this.particles.forEach(p => {
      if (p.consumed) return;

      const dx = SINGULARITY_X - p.x;
      const dy = SINGULARITY_Y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 25) {
        p.consumed = true;
        p.opacity = 0;
        return;
      }

      const forceMag = G * (25000 / (dist * dist + 20));

      const nx = dx / dist;
      const ny = dy / dist;

      p.vx += nx * forceMag;
      p.vy += ny * forceMag;

      p.vx *= 0.94;
      p.vy *= 0.94;

      p.x += p.vx;
      p.y += p.vy;

      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      p.opacity = Math.min(1, 0.3 + speed * 0.015);
      p.size = Math.max(0.1, (dist / SCREEN_WIDTH) * 1.8);
    });
  }

  getState() {
    return this.particles.filter(p => !p.consumed);
  }

  allConsumed() {
    return this.particles.every(p => p.consumed);
  }
}

export default function SplashScreen({ onComplete }) {
  const [, forceUpdate] = useState(0);
  const [phase, setPhase] = useState('still');
  const systemRef = useRef(null);
  const frameRef = useRef(null);
  const completedRef = useRef(false);

  if (!systemRef.current) {
    systemRef.current = new ParticleSystem();
  }

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    if (onComplete) onComplete();
  };

  useEffect(() => {
    const stillTimer = setTimeout(() => {
      setPhase('pulling');
    }, 500);

    const failsafe = setTimeout(() => {
      complete();
    }, 2500);

    return () => {
      clearTimeout(stillTimer);
      clearTimeout(failsafe);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'pulling') return;

    const animate = () => {
      systemRef.current.update();
      forceUpdate(n => n + 1);

      if (systemRef.current.allConsumed()) {
        complete();
        return;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [phase]);

  const particles = systemRef.current.getState();

  return (
    <View style={styles.container}>
      {particles.map(p => (
        <View
          key={p.id}
          style={[
            styles.particle,
            {
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.void,
  },
  particle: {
    position: 'absolute',
    backgroundColor: colors.white,
  },
});