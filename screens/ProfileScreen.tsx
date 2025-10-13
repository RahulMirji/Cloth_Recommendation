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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
          {/* Header - Back arrow and Logout button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ChevronLeft size={28} color={isDarkMode ? Colors.white : Colors.text} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDarkMode && styles.textDark]}>
              {Strings.profile.title}
            </Text>
            {!isEditing && (
              <TouchableOpacity
                style={styles.logoutButtonTop}
                onPress={handleLogout}
              >
                <LogOut size={20} color={Colors.error} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
            {isEditing && <View style={{ width: 44 }} />}
          </View>


          {/* Profile Photo with Premium Frame */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <TouchableOpacity 
                style={styles.avatarContainer} 
                onPress={pickImage}
                disabled={isUploadingImage}
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
                        <View style={[styles.avatarPlaceholder, isDarkMode && styles.avatarPlaceholderDark]}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                      ) : editedProfile.profileImage ? (
                        <Image source={{ uri: editedProfile.profileImage }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, isDarkMode && styles.avatarPlaceholderDark]}>
                          <User size={48} color={isDarkMode ? Colors.white : Colors.primary} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                ) : (
                  /* Free Users: Regular Gradient Ring */
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary, Colors.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.glowRing}
                  >
                    <View style={styles.avatarInnerContainer}>
                      {isUploadingImage ? (
                        <View style={[styles.avatarPlaceholder, isDarkMode && styles.avatarPlaceholderDark]}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                      ) : editedProfile.profileImage ? (
                        <Image source={{ uri: editedProfile.profileImage }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, isDarkMode && styles.avatarPlaceholderDark]}>
                          <User size={48} color={isDarkMode ? Colors.white : Colors.primary} />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            
            {/* Pro/Upgrade Pill - Bottom RIGHT of avatar */}
            {outfitScorerCredits && (
              outfitScorerCredits.credits_cap === 100 ? (
                <View style={styles.proPillAvatar}>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.proPillGradient}
                  >
                    <Sparkles size={10} color={Colors.white} strokeWidth={2.5} />
                    <Text style={styles.proPillText}>PRO</Text>
                  </LinearGradient>
                </View>
              ) : (
                <TouchableOpacity style={styles.upgradePillAvatar} onPress={handleUpgrade} activeOpacity={0.8}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.upgradePillGradient}
                  >
                    <Text style={styles.upgradePillText}>Upgrade</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )
            )}
            </View>
            
            {/* Username with inline Edit/Save button */}
            <View style={styles.nameContainer}>
              <Text style={[styles.profileName, isDarkMode && styles.textDark]}>
                {userProfile.name || 'User'}
              </Text>
              <TouchableOpacity
                style={[styles.editButtonInline, isEditing && styles.editButtonInlineActive]}
                onPress={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                <Edit3 size={16} color={isEditing ? Colors.white : Colors.primary} strokeWidth={2.5} />
                <Text style={[styles.editButtonText, isEditing && styles.editButtonTextActive]}>
                  {isEditing ? 'Save' : 'Edit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Compact Profile Info Grid */}
          <View style={styles.section}>
            {/* Row 1: Name & Email */}
            <View style={styles.infoRow}>
              <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                    <User size={16} color={Colors.primary} />
                  </View>
                  <Text style={[styles.infoLabel, isDarkMode && styles.textDark]}>NAME</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.infoInput, isDarkMode && styles.inputDark]}
                    value={editedProfile.name}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textLight}
                  />
                ) : (
                  <Text style={[styles.infoValue, isDarkMode && styles.textDark]} numberOfLines={1}>
                    {userProfile.name || 'Not provided'}
                  </Text>
                )}
              </View>

              <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                    <Mail size={16} color={Colors.primary} />
                  </View>
                  <Text style={[styles.infoLabel, isDarkMode && styles.textDark]}>EMAIL</Text>
                </View>
                <Text style={[styles.infoValue, isDarkMode && styles.textDark]} numberOfLines={1}>
                  {userProfile.email || 'Not provided'}
                </Text>
              </View>
            </View>

            {/* Row 2: Phone & Age */}
            <View style={styles.infoRow}>
              <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                    <Phone size={16} color={Colors.primary} />
                  </View>
                  <Text style={[styles.infoLabel, isDarkMode && styles.textDark]}>PHONE</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.infoInput, isDarkMode && styles.inputDark]}
                    value={editedProfile.phone}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, phone: text })}
                    placeholder="Phone number"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={[styles.infoValue, isDarkMode && styles.textDark]} numberOfLines={1}>
                    {userProfile.phone || 'Not provided'}
                  </Text>
                )}
              </View>

              <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                    <Calendar size={16} color={Colors.primary} />
                  </View>
                  <Text style={[styles.infoLabel, isDarkMode && styles.textDark]}>AGE</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.infoInput, isDarkMode && styles.inputDark]}
                    value={editedProfile.age}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, age: text })}
                    placeholder="Your age"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                  />
                ) : (
                  <Text style={[styles.infoValue, isDarkMode && styles.textDark]} numberOfLines={1}>
                    {userProfile.age || 'Not provided'}
                  </Text>
                )}
              </View>
            </View>

            {/* Row 3: Gender & About Me */}
            <View style={styles.infoRow}>
              <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                    <Users size={16} color={Colors.primary} />
                  </View>
                  <Text style={[styles.infoLabel, isDarkMode && styles.textDark]}>GENDER</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.infoInput, isDarkMode && styles.inputDark]}
                    value={editedProfile.gender}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, gender: text as '' | 'male' | 'female' | 'other' })}
                    placeholder="Your gender"
                    placeholderTextColor={Colors.textLight}
                  />
                ) : (
                  <Text style={[styles.infoValue, isDarkMode && styles.textDark]} numberOfLines={1}>
                    {userProfile.gender || 'Not provided'}
                  </Text>
                )}
              </View>

              <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
                <View style={styles.infoCardHeader}>
                  <View style={[styles.infoIconContainer, isDarkMode && styles.inputIconContainerDark]}>
                    <Edit3 size={16} color={Colors.primary} />
                  </View>
                  <Text style={[styles.infoLabel, isDarkMode && styles.textDark]}>ABOUT ME</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.infoInput, isDarkMode && styles.inputDark]}
                    value={editedProfile.bio}
                    onChangeText={(text) => setEditedProfile({ ...editedProfile, bio: text })}
                    placeholder="Tell us about yourself"
                    placeholderTextColor={Colors.textLight}
                    multiline
                    numberOfLines={2}
                  />
                ) : (
                  <Text style={[styles.infoValue, isDarkMode && styles.textDark]} numberOfLines={2}>
                    {userProfile.bio || 'Not provided'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Credits Section */}
          {!isEditing && (
            <View style={styles.creditsSection}>
              <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>
                Usage & Credits
              </Text>

              {/* Outfit Scorer Credits */}
              {outfitScorerCredits && (
                <CreditsCard
                  icon={<Sparkles size={18} color="#fff" strokeWidth={2.5} />}
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
                  icon={<Camera size={18} color="#fff" strokeWidth={2.5} />}
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
                  icon={<Wand2 size={18} color="#fff" strokeWidth={2.5} />}
                  title="Image Generator"
                  credits={imageGenCredits.credits_remaining}
                  maxCredits={imageGenCredits.credits_cap}
                  gradientColors={['#FF6B6B', '#FF8E53']}
                  onUpgradePress={handleUpgrade}
                />
              )}
            </View>
          )}

          {/* Cancel Button (Edit Mode) */}
          {isEditing && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>
                {Strings.profile.cancelButton}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: Colors.background,
  },
  containerDark: {
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  textDark: {
    color: Colors.white,
  },
  logoutButtonTop: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  glowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  premiumFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
    elevation: 15,
  },
  avatarInnerContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  editButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  editButtonInlineActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
  },
  editButtonTextActive: {
    color: Colors.white,
  },
  proPillAvatar: {
    position: 'absolute',
    bottom: -5,
    right: -10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  upgradePillAvatar: {
    position: 'absolute',
    bottom: 30,
    right: -12,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  section: {
    gap: 10,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  inputIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconContainerDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    fontSize: FontSizes.body,
    color: Colors.text,
    padding: 0,
  },
  inputDark: {
    color: Colors.white,
  },
  inputValue: {
    fontSize: FontSizes.body,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
  },
  genderButtonText: {
    fontSize: FontSizes.small,
    color: Colors.text,
    fontWeight: FontWeights.medium,
  },
  genderButtonTextActive: {
    color: Colors.white,
  },
  cancelButton: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.bold,
    color: Colors.error,
  },
  footerContainer: {
    marginTop: 24,
    marginHorizontal: -16,
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
  creditsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: 16,
  },
  proPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 3,
  },
  proPillText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  upgradePillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  upgradePillText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
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
