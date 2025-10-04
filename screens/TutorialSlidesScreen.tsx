/**
 * Tutorial Slides Screen
 * 
 * Onboarding tutorial with 3 slides explaining app features.
 * Uses react-native-onboarding-swiper for smooth slide transitions.
 * 
 * Features:
 * - 3 informative slides about app capabilities
 * - Skip button to jump to user info
 * - Next/Done navigation
 * - Beautiful icons and descriptions
 */

import { router } from 'expo-router';
import Onboarding from 'react-native-onboarding-swiper';
import { Camera, Sparkles, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import Colors from '@/constants/colors';
import { Strings } from '@/constants/strings';

/**
 * Icon wrapper component for tutorial slides
 */
const IconContainer = ({ children, bgColor }: { children: React.ReactNode; bgColor: string }) => (
  <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
    {children}
  </View>
);

export function TutorialSlidesScreen() {
  /**
   * Navigate to user info form after tutorial
   */
  const handleDone = () => {
    router.replace('/onboarding-user-info' as any);
  };

  /**
   * Skip tutorial and go straight to user info
   */
  const handleSkip = () => {
    router.replace('/onboarding-user-info' as any);
  };

  return (
    <Onboarding
      onSkip={handleSkip}
      onDone={handleDone}
      skipLabel={Strings.onboarding.tutorial.skip}
      nextLabel={Strings.onboarding.tutorial.next}
      pages={[
        {
          backgroundColor: Colors.gradient.start,
          image: (
            <IconContainer bgColor="rgba(255, 255, 255, 0.2)">
              <Camera size={64} color={Colors.white} strokeWidth={2} />
            </IconContainer>
          ),
          title: Strings.onboarding.tutorial.slide1.title,
          subtitle: Strings.onboarding.tutorial.slide1.subtitle,
        },
        {
          backgroundColor: Colors.secondary,
          image: (
            <IconContainer bgColor="rgba(255, 255, 255, 0.2)">
              <Sparkles size={64} color={Colors.white} strokeWidth={2} />
            </IconContainer>
          ),
          title: Strings.onboarding.tutorial.slide2.title,
          subtitle: Strings.onboarding.tutorial.slide2.subtitle,
        },
        {
          backgroundColor: Colors.primaryDark,
          image: (
            <IconContainer bgColor="rgba(255, 255, 255, 0.2)">
              <TrendingUp size={64} color={Colors.white} strokeWidth={2} />
            </IconContainer>
          ),
          title: Strings.onboarding.tutorial.slide3.title,
          subtitle: Strings.onboarding.tutorial.slide3.subtitle,
        },
      ]}
      containerStyles={styles.container}
      imageContainerStyles={styles.imageContainer}
      titleStyles={styles.title}
      subTitleStyles={styles.subtitle}
      // Customize button colors
      skipToLabel={Strings.onboarding.tutorial.done}
      bottomBarHighlight={false}
      controlStatusBar={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    paddingBottom: 60,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.white,
    paddingHorizontal: 50,
    lineHeight: 26,
    opacity: 0.9,
  },
});
