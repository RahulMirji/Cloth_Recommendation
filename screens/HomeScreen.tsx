/**
 * Home Screen
 * 
 * Main landing screen after authentication.
 * Shows personalized greeting and feature cards for AI Stylist and Outfit Scorer.
 * 
 * Features:
 * - Dynamic greeting with user's name
 * - Gradient feature cards
 * - Navigation to AI Stylist and Outfit Scorer
 * - Dark mode support
 * - How it works section
 */

import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Sparkles, Shirt, User, Wand2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Image,
  Modal,
} from 'react-native';

import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { Strings } from '@/constants/strings';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { Footer } from '@/components/Footer';

export function HomeScreen() {
  const { settings, userProfile } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const [showGuidance, setShowGuidance] = useState(false);

  // Get user name or default to 'Guest'
  const userName = userProfile?.name || 'Guest';

  // Check if user needs guidance (no profile photo)
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const hasProfileImage = userProfile?.profileImage && 
          (userProfile.profileImage.startsWith('http://') || userProfile.profileImage.startsWith('https://'));
        
        // Show guidance if user doesn't have a profile image
        if (!hasProfileImage) {
          // Small delay to let the screen mount
          setTimeout(() => setShowGuidance(true), 1000);
        }
      } catch (error) {
        console.error('Error checking first time user:', error);
      }
    };

    checkFirstTimeUser();
  }, [userProfile?.profileImage]);

  const handleCloseGuidance = async () => {
    setShowGuidance(false);
  };

  const handleGoToProfile = async () => {
    setShowGuidance(false);
    router.push('/profile' as any);
  };

  const ProfileButton = () => {
    // Validate that profile image is a valid URL (Supabase Storage or other valid URL)
    const isValidUrl = (url: string | undefined): boolean => {
      if (!url || url.trim() === '') return false;
      // Check if it's a Supabase Storage URL or other valid http/https URL
      return url.startsWith('http://') || url.startsWith('https://');
    };
    
    const hasProfileImage = isValidUrl(userProfile?.profileImage);

    return (
      <TouchableOpacity
        style={styles.profileButtonContainer}
        onPress={() => router.push('/profile' as any)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.profileButtonGlow,
          hasProfileImage && styles.profileButtonGlowActive
        ]}>
          {hasProfileImage ? (
            <Image 
              source={{ uri: userProfile.profileImage }} 
              style={styles.profileImage}
              onError={(error) => {
                console.error('Error loading profile image:', error.nativeEvent.error);
              }}
            />
          ) : (
            <View style={[
              styles.profilePlaceholder,
              isDarkMode && styles.profilePlaceholderDark
            ]}>
              <User size={18} color={isDarkMode ? Colors.white : Colors.primary} strokeWidth={2.5} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {isDarkMode && (
        <LinearGradient
          colors={['#0F172A', '#0F172A']}
          style={StyleSheet.absoluteFill}
        />
      )}
      
      {/* First-Time User Guidance Modal */}
      <Modal
        visible={showGuidance}
        transparent
        animationType="fade"
        onRequestClose={handleCloseGuidance}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.guidanceCard, isDarkMode && styles.guidanceCardDark]}>
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={handleCloseGuidance}
            >
              <X size={24} color={isDarkMode ? Colors.white : Colors.text} />
            </TouchableOpacity>
            
            <View style={styles.guidanceIconContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guidanceIcon}
              >
                <User size={40} color={Colors.white} strokeWidth={2.5} />
              </LinearGradient>
            </View>
            
            <Text style={[styles.guidanceTitle, isDarkMode && styles.textDark]}>
              Welcome to AI DressUp! 👋
            </Text>
            
            <Text style={[styles.guidanceText, isDarkMode && styles.guidanceTextDark]}>
              Let's set up your profile to get personalized fashion recommendations!
            </Text>
            
            <View style={styles.guidanceSteps}>
              <View style={styles.guidanceStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={[styles.stepText, isDarkMode && styles.guidanceTextDark]}>
                  Click the profile icon in the top right corner
                </Text>
              </View>
              
              <View style={styles.guidanceStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={[styles.stepText, isDarkMode && styles.guidanceTextDark]}>
                  Upload your profile photo by tapping the camera icon
                </Text>
              </View>
              
              <View style={styles.guidanceStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={[styles.stepText, isDarkMode && styles.guidanceTextDark]}>
                  Fill in your details for better recommendations
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.guidanceButton}
              onPress={handleGoToProfile}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.guidanceButtonGradient}
              >
                <Text style={styles.guidanceButtonText}>Set Up Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleCloseGuidance}>
              <Text style={[styles.skipText, isDarkMode && styles.guidanceTextDark]}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Scrollable Header */}
        <View style={[styles.customHeader, isDarkMode && styles.customHeaderDark]}>
          <View style={styles.logoContainer}>
            {/* Clothing Icon with Gradient Background and Glow */}
            <View style={styles.logoIconContainer}>
              <LinearGradient
                colors={[Colors.gradient.start, Colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoIconGradient}
              >
                <Shirt size={22} color={Colors.white} strokeWidth={2.5} />
              </LinearGradient>
            </View>
            
            {/* Plain Text without gradient background */}
            <Text style={[styles.logoText, { color: isDarkMode ? Colors.white : Colors.text }]}>
              AI DressUp
            </Text>
          </View>
          
          <ProfileButton />
        </View>

        {/* Header with Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, isDarkMode && styles.textDark]}>
              {Strings.home.greeting(userName)}
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
              {Strings.home.subtitle}
            </Text>
          </View>
        </View>


        {/* Feature Cards */}
        <View style={styles.cardsContainer}>
          {/* Outfit Scorer Card - First */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/outfit-scorer')}
          >
            <LinearGradient
              colors={[Colors.secondary, Colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Sparkles size={32} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>
                {Strings.home.outfitScorer.title}
              </Text>
              <Text style={styles.cardDescription}>
                {Strings.home.outfitScorer.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* AI Stylist Card - Second (Beta) */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/ai-stylist')}
          >
            <LinearGradient
              colors={[Colors.gradient.start, Colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Beta Tag */}
              <View style={styles.betaTag}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
              
              <View style={styles.cardIcon}>
                <Camera size={32} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>
                {Strings.home.aiStylist.title}
              </Text>
              <Text style={styles.cardDescription}>
                {Strings.home.aiStylist.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* AI Image Generator Card - Third (Beta) */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/ai-image-generator')}
          >
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Beta Tag */}
              <View style={styles.betaTag}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
              
              <View style={styles.cardIcon}>
                <Wand2 size={32} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>
                AI Image Generator
              </Text>
              <Text style={styles.cardDescription}>
                Create any image you can imagine with AI-powered generation
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* How It Works Section */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, isDarkMode && styles.textDark]}>
            {Strings.home.howItWorks.title}
          </Text>
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={styles.infoStep}>
              {Strings.home.howItWorks.step1Title}
            </Text>
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              {Strings.home.howItWorks.step1Text}
            </Text>
          </View>
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={styles.infoStep}>
              {Strings.home.howItWorks.step2Title}
            </Text>
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              {Strings.home.howItWorks.step2Text}
            </Text>
          </View>
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={styles.infoStep}>
              {Strings.home.howItWorks.step3Title}
            </Text>
            <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
              {Strings.home.howItWorks.step3Text}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  // Custom scrollable header styles
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  customHeaderDark: {
    backgroundColor: '#0F172A',
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoIconContainer: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    // Enhanced glow effect for icon only
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 10,
  },
  logoIconGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  // Profile button styles
  profileButtonContainer: {
    marginRight: 8,
  },
  profileButtonGlow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  profileButtonGlowActive: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  profilePlaceholderDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 8,
  },
  textDark: {
    color: Colors.white,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: FontWeights.regular,
  },
  subtitleDark: {
    color: Colors.textLight,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 40,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardGradient: {
    padding: 28,
    minHeight: 200,
    justifyContent: 'center',
  },
  betaTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  betaText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  betaSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  betaSubtitleContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: -8,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: FontSizes.body,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  infoCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoStep: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  infoTextDark: {
    color: Colors.textLight,
  },
  // Guidance Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  guidanceCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  guidanceCardDark: {
    backgroundColor: '#1E293B',
  },
  closeModalButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 1,
  },
  guidanceIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  guidanceIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  guidanceTitle: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  guidanceText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guidanceTextDark: {
    color: Colors.textLight,
  },
  guidanceSteps: {
    gap: 16,
    marginBottom: 24,
  },
  guidanceStep: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.body,
    color: Colors.text,
    lineHeight: 22,
  },
  guidanceButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  guidanceButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guidanceButtonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  skipText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: FontWeights.medium,
  },
});
