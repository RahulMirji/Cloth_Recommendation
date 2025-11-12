/**
 * Profile Screen
 * 
 * User profile management screen displayed as a modal.
 * Allows viewing and editing profile information.
 * 
 * Features:
 * - Profile photo upload with glowing gradient effect
 * - Edit/save modes
 * - All profile fields (name, email, phone, age, gender, bio)
 * - Logout functionality
 * - Full dark/light theme support
 * - Glassmorphism UI with gradient accents
 * - Enhanced visual hierarchy
 */

import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Camera, User, Mail, Phone, Calendar, Users, Edit3, LogOut, ArrowUp, Sparkles, Wand2, TrendingUp } from 'lucide-react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Animated,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { Strings } from '@/constants/strings';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { Footer } from '@/components/Footer';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useAlert } from '@/contexts/AlertContext';
import { CreditsCard } from '@/components/CreditsCard';
import { getUserCredits, UserCredits } from '@/OutfitScorer/services/creditService';
import { PaymentUploadScreen } from '@/OutfitScorer/components/PaymentUploadScreen';
import { AdminAccessButton } from '@/Dashboard/components/AdminAccessButton';

export function ProfileScreen() {
  const { userProfile, settings, updateUserProfile, logout, session } = useApp();
  const { uploadProfileImage, isUploading } = useImageUpload();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPhotoSuggestion, setShowPhotoSuggestion] = useState(false);
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  
  // Credits state
  const [outfitScorerCredits, setOutfitScorerCredits] = useState<UserCredits | null>(null);
  const [aiStylistCredits, setAiStylistCredits] = useState<UserCredits | null>(null);
  const [imageGenCredits, setImageGenCredits] = useState<UserCredits | null>(null);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  
  // Animation values
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update edited profile when userProfile changes
  React.useEffect(() => {
    setEditedProfile(userProfile);
  }, [userProfile]);

  // Check if user needs photo upload suggestion (no profile photo)
  useEffect(() => {
    const checkPhotoSuggestion = async () => {
      try {
        const hasProfileImage = userProfile?.profileImage && 
          (userProfile.profileImage.startsWith('http://') || userProfile.profileImage.startsWith('https://'));
        
        // Show suggestion if user doesn't have a profile image
        if (!hasProfileImage) {
          setTimeout(() => {
            setShowPhotoSuggestion(true);
            startFloatingAnimation();
          }, 800);
        }
      } catch (error) {
        console.error('Error checking photo suggestion:', error);
      }
    };

    checkPhotoSuggestion();
  }, [userProfile?.profileImage]);

  // Load credits for all features
  useEffect(() => {
    if (session?.user?.id) {
      loadAllCredits();
    }
  }, [session?.user?.id]);

  const loadAllCredits = async () => {
    if (!session?.user?.id) return;

    try {
      // Load Outfit Scorer credits
      const outfitCredits = await getUserCredits(session.user.id);
      setOutfitScorerCredits(outfitCredits);

      // For AI Stylist and Image Gen, we'll use the same credit service
      // but with different features (you can extend creditService later)
      // For now, using outfit_scorer credits as placeholder
      setAiStylistCredits(outfitCredits);
      setImageGenCredits(outfitCredits);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const handleUpgrade = () => {
    setShowPaymentScreen(true);
  };

  const handlePaymentClose = () => {
    setShowPaymentScreen(false);
    // Reload credits after payment submission
    loadAllCredits();
  };

  // Floating animation
  const startFloatingAnimation = () => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Floating effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulsing arrow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleCloseSuggestion = async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowPhotoSuggestion(false));
  };

  /**
   * Pick profile image from gallery and upload to Supabase
   */
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert(
        'warning',
        Strings.profile.permissions.title,
        Strings.profile.permissions.message
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIsUploadingImage(true);
      
      try {
        // Upload to Supabase Storage
        const uploadResult = await uploadProfileImage(result.assets[0].uri);
        
        if (uploadResult.success && uploadResult.url) {
          // Update profile with Supabase Storage URL
          const updates = { ...editedProfile, profileImage: uploadResult.url };
          setEditedProfile(updates);
          
          // Save to database if not in editing mode
          if (!isEditing) {
            await updateUserProfile(updates);
            showAlert('success', 'Profile photo updated successfully!');
          }
        } else {
          console.error('❌ Image upload failed:', uploadResult.error);
          showAlert(
            'error',
            'Upload Failed',
            uploadResult.error || 'Failed to upload image. Please try again.'
          );
        }
      } catch (error) {
        console.error('❌ Exception during image upload:', error);
        showAlert(
          'error',
          'Error',
          'An error occurred while uploading your photo. Please try again.'
        );
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  /**
   * Save profile edits
   */
  const handleSave = async () => {
    if (!editedProfile.name.trim()) {
      showAlert('warning', 'Required Field', Strings.profile.alerts.nameRequired);
      return;
    }
    if (!editedProfile.email.trim()) {
      showAlert('warning', 'Required Field', Strings.profile.alerts.emailRequired);
      return;
    }

    await updateUserProfile(editedProfile);
    setIsEditing(false);
  };

  /**
   * Cancel editing
   */
  const handleCancel = () => {
    setEditedProfile(userProfile);
    setIsEditing(false);
  };

  /**
   * Handle logout with confirmation
   */
  const handleLogout = () => {
    showAlert(
      'warning',
      Strings.profile.alerts.logoutTitle,
      Strings.profile.alerts.logoutMessage,
      [
        { text: Strings.profile.alerts.logoutCancel, style: 'cancel' },
        {
          text: Strings.profile.alerts.logoutConfirm,
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/sign-in' as any);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Photo Upload Suggestion Modal */}
      <Modal
        visible={showPhotoSuggestion}
        transparent
        animationType="none"
        onRequestClose={handleCloseSuggestion}
      >
        <View style={styles.suggestionOverlay}>
          <Animated.View 
            style={[
              styles.suggestionCloud,
              isDarkMode && styles.suggestionCloudDark,
              {
                opacity: fadeAnim,
                transform: [{ translateY: floatAnim }],
              },
            ]}
          >
            {/* Beautiful animated arrow pointing to profile */}
            <Animated.View 
              style={[
                styles.arrowContainer,
                {
                  opacity: fadeAnim,
                }
              ]}
            >
              <View style={styles.arrowWrapper}>
                {/* Glowing circle at the top with pulse animation */}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.arrowTopCircle}
                  >
                    <ArrowUp size={18} color={Colors.white} strokeWidth={3} />
                  </LinearGradient>
                </Animated.View>
                
                {/* Animated dots leading down */}
                <View style={styles.dotsContainer}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </Animated.View>

            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.suggestionIconBadge}
            >
              <Camera size={20} color={Colors.white} strokeWidth={2.5} />
            </LinearGradient>
            
            <Text style={[styles.suggestionTitle, isDarkMode && styles.textDark]}>
              📸 Upload Your Photo!
            </Text>
            
            <TouchableOpacity 
              style={styles.suggestionButton}
              onPress={handleCloseSuggestion}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.suggestionButtonGradient}
              >
                <Text style={styles.suggestionButtonText}>Got it! 👍</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header with Gradient Background */}
        <LinearGradient
          colors={isDarkMode ? ['#1E293B', '#0F172A'] : [Colors.primary, Colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <View style={[styles.iconButton, isDarkMode && styles.iconButtonDark]}>
                <ChevronLeft size={24} color={isDarkMode ? Colors.white : Colors.white} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            {!isEditing && (
              <TouchableOpacity style={styles.logoutButtonTop} onPress={handleLogout}>
                <View style={styles.iconButton}>
                  <LogOut size={20} color={Colors.white} strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            )}
            {isEditing && <View style={{ width: 48 }} />}
          </View>

          {/* Profile Photo Section - Inside Header */}
          <View style={styles.profilePhotoSection}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity 
                style={styles.avatarContainer} 
                onPress={pickImage}
                disabled={isUploadingImage}
                activeOpacity={0.8}
              >
                {/* Pro Users: Golden Premium Frame */}
                {outfitScorerCredits?.credits_cap === 100 ? (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500', '#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumFrame}
                  >
                    <View style={styles.avatarInnerContainer}>
                      {isUploadingImage ? (
                        <View style={styles.avatarPlaceholder}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                      ) : editedProfile.profileImage ? (
                        <Image source={{ uri: editedProfile.profileImage }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <User size={56} color={Colors.white} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                ) : (
                  /* Free Users: Regular Gradient Ring */
                  <LinearGradient
                    colors={['#FFFFFF', '#F3E8FF', '#FFFFFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.glowRing}
                  >
                    <View style={styles.avatarInnerContainer}>
                      {isUploadingImage ? (
                        <View style={styles.avatarPlaceholder}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                      ) : editedProfile.profileImage ? (
                        <Image source={{ uri: editedProfile.profileImage }} style={styles.avatar} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <User size={56} color={Colors.white} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                )}

                {/* Camera Badge */}
                <View style={styles.cameraIconBadge}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cameraIconGradient}
                  >
                    <Camera size={18} color={Colors.white} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Username */}
            <View style={styles.nameContainer}>
              <Text style={styles.profileName}>
                {userProfile.name || 'User'}
              </Text>
            </View>
            <Text style={styles.profileEmail}>{userProfile.email || ''}</Text>
          </View>
        </LinearGradient>
        {/* Profile Information Section */}
        <View style={styles.contentSection}>
          <View style={styles.sectionHeaderContainer}>
            <View style={styles.sectionTitleRow}>
              <User size={20} color={isDarkMode ? Colors.white : Colors.text} strokeWidth={2.5} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
                Personal Information
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editButtonInline, isEditing && styles.editButtonInlineSave]}
              onPress={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              activeOpacity={0.8}
            >
              <Edit3 size={14} color={isEditing ? Colors.white : Colors.primary} strokeWidth={2.5} />
              <Text style={[styles.editButtonText, isEditing && styles.editButtonTextSave]}>
                {isEditing ? 'Save' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name & Phone Row */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldCard, isDarkMode && styles.fieldCardDark, { flex: 1 }]}>
              <View style={styles.fieldIconContainer}>
                <User size={16} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>NAME</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, isDarkMode && styles.fieldInputDark]}
                    value={editedProfile.name}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                    placeholder="Your name"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  />
                ) : (
                  <Text style={[styles.fieldValue, isDarkMode && styles.fieldValueDark]}>
                    {userProfile.name || 'Not set'}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.fieldCard, isDarkMode && styles.fieldCardDark, { flex: 1 }]}>
              <View style={styles.fieldIconContainer}>
                <Phone size={16} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>PHONE</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, isDarkMode && styles.fieldInputDark]}
                    value={editedProfile.phone}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, phone: text })}
                    placeholder="Phone"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={[styles.fieldValue, isDarkMode && styles.fieldValueDark]}>
                    {userProfile.phone || 'Not set'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Age & Gender Row */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldCard, isDarkMode && styles.fieldCardDark, { flex: 1 }]}>
              <View style={styles.fieldIconContainer}>
                <Calendar size={16} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>AGE</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, isDarkMode && styles.fieldInputDark]}
                    value={editedProfile.age}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, age: text })}
                    placeholder="Age"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                    keyboardType="number-pad"
                  />
                ) : (
                  <Text style={[styles.fieldValue, isDarkMode && styles.fieldValueDark]}>
                    {userProfile.age || 'Not set'}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.fieldCard, isDarkMode && styles.fieldCardDark, { flex: 1 }]}>
              <View style={styles.fieldIconContainer}>
                <Users size={16} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.fieldContent}>
                <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>GENDER</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, isDarkMode && styles.fieldInputDark]}
                    value={editedProfile.gender}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, gender: text as '' | 'male' | 'female' | 'other' })}
                    placeholder="Gender"
                    placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  />
                ) : (
                  <Text style={[styles.fieldValue, isDarkMode && styles.fieldValueDark]}>
                    {userProfile.gender || 'Not set'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Email Field - Full Width */}
          <View style={[styles.fieldCard, styles.fullWidthCard, isDarkMode && styles.fieldCardDark]}>
            <View style={styles.fieldIconContainer}>
              <Mail size={16} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>EMAIL</Text>
              <Text style={[styles.fieldValue, isDarkMode && styles.fieldValueDark]}>
                {userProfile.email || 'Not set'}
              </Text>
            </View>
          </View>

          {/* Bio Field - Full Width */}
          <View style={[styles.fieldCard, styles.fullWidthCard, isDarkMode && styles.fieldCardDark]}>
            <View style={styles.fieldIconContainer}>
              <Edit3 size={16} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.fieldContent}>
              <Text style={[styles.fieldLabel, isDarkMode && styles.fieldLabelDark]}>ABOUT ME</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputMultiline, isDarkMode && styles.fieldInputDark]}
                  value={editedProfile.bio}
                  onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                  multiline
                  numberOfLines={3}
                />
              ) : (
                <Text style={[styles.fieldValue, isDarkMode && styles.fieldValueDark]}>
                  {userProfile.bio || 'Not set'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Credits Section */}
        {!isEditing && (
          <View style={styles.contentSection}>
            <View style={styles.sectionHeaderContainer}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={20} color={isDarkMode ? Colors.white : Colors.text} strokeWidth={2.5} />
                <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
                  Usage & Credits
                </Text>
              </View>
            </View>

            <View style={styles.creditsGrid}>
              {/* Outfit Scorer Credits */}
              {outfitScorerCredits && (
                <CreditsCard
                  icon={<Sparkles size={16} color="#fff" strokeWidth={2.5} />}
                  title="Outfit Scorer"
                  credits={outfitScorerCredits.credits_remaining}
                  maxCredits={outfitScorerCredits.credits_cap}
                  gradientColors={[Colors.secondary, Colors.primary]}
                  onUpgradePress={handleUpgrade}
                />
              )}

              {/* AI Stylist Credits */}
              {aiStylistCredits && (
                <CreditsCard
                  icon={<Camera size={16} color="#fff" strokeWidth={2.5} />}
                  title="AI Stylist"
                  credits={aiStylistCredits.credits_remaining}
                  maxCredits={aiStylistCredits.credits_cap}
                  gradientColors={[Colors.primary, Colors.secondary]}
                  onUpgradePress={handleUpgrade}
                />
              )}

              {/* Image Generator Credits */}
              {imageGenCredits && (
                <CreditsCard
                  icon={<Wand2 size={16} color="#fff" strokeWidth={2.5} />}
                  title="Image Generator"
                  credits={imageGenCredits.credits_remaining}
                  maxCredits={imageGenCredits.credits_cap}
                  gradientColors={['#FF6B6B', '#FF8E53']}
                  onUpgradePress={handleUpgrade}
                />
              )}
            </View>
          </View>
        )}

        {/* Admin Access Button - Only visible to admin users */}
        {!isEditing && (
          <View style={styles.contentSection}>
            <View style={styles.creditsGrid}>
              <AdminAccessButton 
                userEmail={userProfile.email} 
                isDarkMode={isDarkMode}
              />
            </View>
          </View>
        )}

        {/* Cancel Button (Edit Mode) */}
        {isEditing && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Footer showSocialLinks={true} showQuickLinks={true} />
        </View>
      </ScrollView>

      {/* Payment Upload Modal */}
      <PaymentUploadScreen
        visible={showPaymentScreen}
        onClose={handlePaymentClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  // New Modern Header with Gradient
  headerGradient: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  textDark: {
    color: Colors.white,
  },
  logoutButtonTop: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Profile Photo Section
  profilePhotoSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Content Sections
  contentSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  // Modern Field Cards
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fieldCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.08)',
  },
  fieldCardDark: {
    backgroundColor: '#1E293B',
    borderColor: 'rgba(139, 92, 246, 0.2)',
    shadowOpacity: 0.3,
  },
  fullWidthCard: {
    marginBottom: 12,
  },
  fieldIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 6,
  },
  fieldLabelDark: {
    color: '#94A3B8',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 22,
  },
  fieldValueDark: {
    color: '#F8FAFC',
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    padding: 0,
    lineHeight: 22,
  },
  fieldInputDark: {
    color: '#F8FAFC',
  },
  fieldInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Credits Grid
  creditsGrid: {
    gap: 12,
  },
  adminSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  // Action Buttons
  actionButtonsContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  // Avatar Styles
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  glowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  premiumFrame: {
    width: 140,
    height: 140,
    borderRadius: 70,
    padding: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarInnerContainer: {
    width: 132,
    height: 132,
    borderRadius: 66,
    overflow: 'hidden',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  cameraIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  editButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // More visible white background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonInlineActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  editButtonInlineSave: {
    backgroundColor: '#22C55E', // Green color for save button
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary, // Purple color for edit mode
  },
  editButtonTextSave: {
    color: Colors.white, // White color for save mode
  },
  proPillAvatar: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradePillAvatar: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  proPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 4,
  },
  proPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  upgradePillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    gap: 4,
  },
  upgradePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  footerContainer: {
    marginTop: 32,
    marginHorizontal: -20,
  },
  // Suggestion Cloud Styles
  suggestionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  suggestionCloud: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 280,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    alignItems: 'center',
  },
  suggestionCloudDark: {
    backgroundColor: '#1E293B',
  },
  arrowContainer: {
    position: 'absolute',
    top: -90,
    alignItems: 'center',
  },
  arrowWrapper: {
    alignItems: 'center',
  },
  arrowTopCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  dotsContainer: {
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  dot1: {
    opacity: 0.9,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.3,
  },
  suggestionIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  suggestionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestionButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionButtonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  // Legacy/Old Profile Info Section styles - keep for compatibility
  profileInfoSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  infoField: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
    backgroundColor: 'rgba(139, 92, 246, 0.02)',
  },
  infoFieldDark: {
    borderColor: 'rgba(139, 92, 246, 0.25)',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  lastInfoField: {
    marginBottom: 0,
  },
  infoFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoFieldLabel: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoFieldLabelDark: {
    color: Colors.textLight,
  },
  infoFieldValue: {
    fontSize: 16,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    lineHeight: 24,
  },
  infoFieldValueDark: {
    color: Colors.white,
  },
  cleanInput: {
    fontSize: 16,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    padding: 0,
    paddingTop: 4,
    paddingBottom: 4,
    lineHeight: 24,
  },
  cleanInputDark: {
    color: Colors.white,
  },
  cleanInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Legacy styles
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  infoCardDark: {
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: FontWeights.medium,
    color: Colors.text,
  },
  infoInput: {
    fontSize: 15,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    padding: 0,
    margin: 0,
  },
});
