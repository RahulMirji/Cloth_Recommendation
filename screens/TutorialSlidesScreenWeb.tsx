/**
 * Tutorial Slides Screen - Web Compatible Version
 * 
 * Custom onboarding tutorial that works on web, iOS, and Android.
 * Simple swipeable slides with manual navigation.
 * 
 * Features:
 * - 3 informative slides about app capabilities
 * - Skip button to jump to user info
 * - Next/Done navigation
 * - Beautiful icons and descriptions
 * - Works on all platforms
 */

import { router } from 'expo-router';
import { Camera, Sparkles, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { Strings } from '@/constants/strings';

const { width, height } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
}

/**
 * Icon wrapper component for tutorial slides
 */
const IconContainer = ({ children, bgColor }: { children: React.ReactNode; bgColor: string }) => (
  <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
    {children}
  </View>
);

/**
 * Tutorial Slides Screen Component
 */
export default function TutorialSlidesScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 0,
      title: Strings.onboarding.tutorial.slide1.title,
      subtitle: Strings.onboarding.tutorial.slide1.subtitle,
      icon: <Camera size={64} color="#fff" strokeWidth={1.5} />,
      bgColor: Colors.gradient.start,
    },
    {
      id: 1,
      title: Strings.onboarding.tutorial.slide2.title,
      subtitle: Strings.onboarding.tutorial.slide2.subtitle,
      icon: <Sparkles size={64} color="#fff" strokeWidth={1.5} />,
      bgColor: '#E91E63',
    },
    {
      id: 2,
      title: Strings.onboarding.tutorial.slide3.title,
      subtitle: Strings.onboarding.tutorial.slide3.subtitle,
      icon: <TrendingUp size={64} color="#fff" strokeWidth={1.5} />,
      bgColor: '#673AB7',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleDone();
    }
  };

  const handleSkip = () => {
    router.replace('/onboarding-user-info' as any);
  };

  const handleDone = () => {
    router.replace('/onboarding-user-info' as any);
  };

  const currentSlideData = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <LinearGradient
      colors={[currentSlideData.bgColor, '#1a1a2e']}
      style={styles.container}
    >
      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{Strings.onboarding.tutorial.skip}</Text>
        </TouchableOpacity>
      )}

      {/* Slide Content */}
      <View style={styles.slideContent}>
        <IconContainer bgColor="rgba(255, 255, 255, 0.2)">
          {currentSlideData.icon}
        </IconContainer>

        <Text style={styles.title}>{currentSlideData.title}</Text>
        <Text style={styles.subtitle}>{currentSlideData.subtitle}</Text>
      </View>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentSlide === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Next/Done Button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextText}>
          {isLastSlide ? Strings.onboarding.tutorial.done : Strings.onboarding.tutorial.next}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 60,
    paddingVertical: 16,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  nextText: {
    color: '#673AB7',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
