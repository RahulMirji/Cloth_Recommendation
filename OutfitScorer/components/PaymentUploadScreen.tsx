/**
 * Payment Upload Screen
 * Allows users to upload payment proof for credit purchase
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { 
  QrCode, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  X,
  ImageIcon,
  Zap,
  Clock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/contexts/AlertContext';
import getThemedColors from '@/constants/themedColors';
import { RazorpayPayment } from '@/components/RazorpayPayment';
import { type CreditPlan } from '@/utils/razorpayService';

interface PaymentUploadScreenProps {
  visible: boolean;
  onClose: () => void;
}

// Use local QR code image
const QR_CODE_IMAGE = require('@/assets/images/qr.jpg');

export const PaymentUploadScreen: React.FC<PaymentUploadScreenProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { session, settings } = useApp();
  const { showAlert } = useAlert();

  // Theme detection
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const themedColors = getThemedColors(isDarkMode);

  const [utrNumber, setUtrNumber] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showManualPayment, setShowManualPayment] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showAlert('error', 'Permission Denied', 'Please allow access to your photos to upload payment proof.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressedImage = await compressImage(result.assets[0].uri);
        setScreenshot(compressedImage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlert('error', 'Image Selection Failed', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    // Removed - single upload option only
    return;
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  };

  const uploadScreenshotToSupabase = async (uri: string): Promise<string> => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `${session.user.id}_${timestamp}_${randomId}.jpg`;
    const filePath = `payments/${fileName}`;

    try {
      console.log('🔹 Starting screenshot upload...');
      setUploadProgress(10);

      // Step 1: Compress image (same as OutfitScorer)
      console.log('🔹 Compressing image...');
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setUploadProgress(30);

      // Step 2: Convert to base64 (same as OutfitScorer)
      console.log('🔹 Converting to base64...');
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: 'base64' as any,
      });
      setUploadProgress(50);

      // Step 3: Create FormData for React Native (same as OutfitScorer)
      console.log('🔹 Creating FormData...');
      const formData = new FormData();
      formData.append('file', {
        uri: manipResult.uri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      // Step 4: Upload using fetch API (same as OutfitScorer)
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        throw new Error('EXPO_PUBLIC_SUPABASE_URL is not configured in environment variables');
      }
      
      const uploadUrl = `${supabaseUrl}/storage/v1/object/user-images/${filePath}`;
      
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      console.log('🔹 Uploading to:', uploadUrl);
      setUploadProgress(70);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentSession?.access_token}`,
        },
        body: formData,
      });

      setUploadProgress(90);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('❌ Upload failed:', uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.statusText || 'Unknown error'}`);
      }

      console.log('✅ Upload successful');

      // Step 5: Get public URL
      const { data: urlData } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath);

      console.log('✅ Public URL:', urlData.publicUrl);
      setUploadProgress(100);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      throw new Error(error.message || 'Failed to upload screenshot');
    }
  };

  const submitPayment = async () => {
    // Validation
    if (!utrNumber.trim()) {
      showAlert('error', 'Missing Information', 'Please enter UTR number.');
      return;
    }

    if (utrNumber.length !== 12) {
      showAlert('error', 'Invalid UTR', 'UTR number must be exactly 12 digits.');
      return;
    }

    if (!screenshot) {
      showAlert('error', 'Missing Screenshot', 'Please upload payment screenshot.');
      return;
    }

    if (!session?.user?.id) {
      showAlert('error', 'Authentication Required', 'User not authenticated. Please login again.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload screenshot to Supabase storage
      setUploadProgress(30);
      const screenshotUrl = await uploadScreenshotToSupabase(screenshot);
      
      setUploadProgress(60);
      
      // Submit payment using RPC function
      const { data, error } = await (supabase.rpc as any)('submit_payment_request', {
        p_plan_slug: 'monthly_pro',
        p_utr: utrNumber.trim(),
        p_screenshot_url: screenshotUrl,
      });

      if (error) {
        // Handle duplicate request error with friendly message
        if (error.message.includes('DUPLICATE_REQUEST')) {
          showAlert(
            'info',
            '⏳ Payment Already Submitted',
            'You have a pending payment request. Our team will review it within 2 hours. Please check back soon!'
          );
          // Close modal after showing alert
          setTimeout(() => {
            onClose();
          }, 3000);
          return; // Exit without throwing error
        }
        throw new Error(`Submission failed: ${error.message}`);
      }

      setUploadProgress(100);

      // Success
      showAlert(
        'success',
        'Payment Submitted!',
        'Your payment will be reviewed within 2 hours.'
      );

      // Reset form
      setUtrNumber('');
      setScreenshot(null);
      
      // Close modal
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error: any) {
      console.error('Error submitting payment:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to submit payment. Please try again.';
      const errorTitle = errorMessage.includes('network') || errorMessage.includes('Network')
        ? '🌐 Network Error'
        : errorMessage.includes('invalid') || errorMessage.includes('Invalid')
        ? '❌ Invalid Information'
        : '⚠️ Submission Failed';
      
      showAlert('error', errorTitle, errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Dark Overlay */}
      <View style={styles.modalOverlay}>
        {/* Centered Card Container */}
        <View style={[
          styles.modalCard,
          { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
        ]}>
          {/* Gradient Header with Close Button */}
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Upload size={28} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Upgrade to Pro</Text>
                <Text style={styles.headerSubtitle}>Unlock unlimited credits</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <X size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {/* Premium Price Banner */}
            <LinearGradient
              colors={['#8B5CF6', '#EC4899', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.priceBanner}
            >
              <View style={styles.priceMainSection}>
                <Text style={styles.priceAmount}>₹29</Text>
                <Text style={styles.priceFrequency}>/month</Text>
              </View>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.featureText}>100 Credits</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.featureText}>30 Days Access</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.featureText}>All Features Unlocked</Text>
                </View>
                <View style={styles.featureItem}>
                  <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.featureText}>Priority Support</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Choose Payment Method Section */}
            {!showManualPayment ? (
              <>
                {/* Payment Method Selection Header */}
                <View style={styles.paymentMethodHeader}>
                  <Text style={[styles.paymentMethodTitle, { color: themedColors.text }]}>
                    Choose Payment Method
                  </Text>
                  <Text style={[styles.paymentMethodSubtitle, { color: themedColors.textSecondary }]}>
                    Select your preferred payment option
                  </Text>
                </View>

                {/* Razorpay Payment Button */}
                <RazorpayPayment
                  credits={100 as CreditPlan}
                  userId={session?.user?.id || ''}
                  userEmail={session?.user?.email}
                  userName={session?.user?.user_metadata?.name}
                  userPhone={session?.user?.user_metadata?.phone}
                  onSuccess={(data) => {
                    // Only alert shown for payment - single source of truth
                    showAlert('success', '🎉 Payment Successful!', `${data.credits} credits have been added to your account instantly!`);
                    setTimeout(() => {
                      onClose();
                    }, 2000);
                  }}
                  onFailure={(error) => {
                    console.error('Razorpay payment failed:', error);
                    // Handle user cancellation gracefully
                    if (error.code === 2) {
                      showAlert('info', 'Payment Cancelled', 'You cancelled the payment. No charges were made.');
                    } else {
                      showAlert('error', 'Payment Failed', error.message || 'Unable to process payment. Please try again.');
                    }
                  }}
                >
                  {({ isProcessing, initiatePayment }) => (
                    <TouchableOpacity
                      style={styles.razorpayButtonContainer}
                      onPress={initiatePayment}
                      disabled={isProcessing}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.razorpayGradient}
                      >
                        <View style={styles.paymentButtonContent}>
                          <View style={styles.paymentButtonLeft}>
                            <View style={styles.paymentIconContainer}>
                              <Zap size={24} color="#FFFFFF" strokeWidth={2.5} fill="#FFFFFF" />
                            </View>
                            <View style={styles.paymentButtonTextContainer}>
                              <Text style={styles.paymentButtonTitle}>
                                {isProcessing ? 'Processing Payment...' : 'Pay with Razorpay'}
                              </Text>
                              <Text style={styles.paymentButtonSubtitle}>
                                Instant activation • UPI, Cards, Wallets
                              </Text>
                            </View>
                          </View>
                          {isProcessing ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <View style={styles.instantBadge}>
                              <Text style={styles.instantBadgeText}>INSTANT</Text>
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </RazorpayPayment>

                {/* Divider */}
                <View style={styles.paymentDivider}>
                  <View style={[styles.paymentDividerLine, { backgroundColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' }]} />
                  <Text style={[styles.paymentDividerText, { color: themedColors.textSecondary }]}>OR</Text>
                  <View style={[styles.paymentDividerLine, { backgroundColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' }]} />
                </View>

                {/* Manual Payment Button */}
                <TouchableOpacity
                  style={[
                    styles.manualPaymentButtonContainer,
                    { borderColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' }
                  ]}
                  onPress={() => setShowManualPayment(true)}
                  activeOpacity={0.85}
                >
                  <View style={[
                    styles.manualPaymentButton,
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB' }
                  ]}>
                    <View style={styles.paymentButtonContent}>
                      <View style={styles.paymentButtonLeft}>
                        <View style={[
                          styles.paymentIconContainer,
                          { backgroundColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' }
                        ]}>
                          <QrCode size={24} color="#6B7280" strokeWidth={2.5} />
                        </View>
                        <View style={styles.paymentButtonTextContainer}>
                          <Text style={[styles.manualPaymentButtonTitle, { color: themedColors.text }]}>
                            Pay via UPI (Manual)
                          </Text>
                          <Text style={[styles.manualPaymentButtonSubtitle, { color: themedColors.textSecondary }]}>
                            2 hours review • Upload screenshot
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        styles.reviewBadge,
                        { backgroundColor: isDarkMode ? '#3A3A3A' : '#E5E7EB' }
                      ]}>
                        <Clock size={14} color="#6B7280" strokeWidth={2.5} />
                        <Text style={styles.reviewBadgeText}>2 HRS</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Payment Method Info */}
                <View style={[
                  styles.paymentInfoContainer,
                  { 
                    backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                    borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'
                  }
                ]}>
                  <AlertCircle size={20} color="#8B5CF6" strokeWidth={2.5} />
                  <Text style={[styles.paymentInfoText, { color: themedColors.text }]}>
                    <Text style={{ fontWeight: '800' }}>Razorpay</Text> provides instant activation, while 
                    <Text style={{ fontWeight: '800' }}> Manual Payment</Text> requires admin verification within 2 hours.
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowManualPayment(false);
                    setUtrNumber('');
                    setScreenshot(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.backButtonContent}>
                    <X size={20} color="#8B5CF6" strokeWidth={2.5} />
                    <Text style={[styles.backButtonText, { color: themedColors.text }]}>
                      Back to Payment Methods
                    </Text>
                  </View>
                </TouchableOpacity>

            {/* QR Code Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <QrCode size={22} color="#8B5CF6" strokeWidth={2.5} />
                <Text style={[styles.sectionTitle, { color: themedColors.text }]}>
                  QR Code Image
                </Text>
              </View>
              
              {/* Merchant Name */}
              <Text style={[styles.merchantName, { color: themedColors.text }]}>
                Rahul Mirji
              </Text>
              
              {/* QR Code Container with Gradient Border */}
              <View style={styles.qrCodeWrapper}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.qrGradientBorder}
                >
                  <View style={[
                    styles.qrContainer,
                    { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                  ]}>
                    <Image 
                      source={QR_CODE_IMAGE}
                      style={styles.qrCode}
                      resizeMode="cover"
                    />
                  </View>
                </LinearGradient>
              </View>
              
              {/* UPI ID */}
              <Text style={[styles.upiId, { color: themedColors.textSecondary }]}>
                rahul.mirji@ptyes
              </Text>
              
              <Text style={[styles.qrInstructions, { color: themedColors.textSecondary }]}>
                Scan with any UPI app to pay
              </Text>
            </View>

            {/* UTR Number Input */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CheckCircle2 size={22} color="#8B5CF6" strokeWidth={2.5} />
                <Text style={[styles.inputLabel, { color: themedColors.text }]}>
                  UTR / Transaction Reference Number *
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDarkMode ? '#1E1E1E' : '#F9FAFB',
                    color: themedColors.text,
                    borderColor: utrNumber.length > 0 ? '#8B5CF6' : (isDarkMode ? '#3A3A3A' : '#E5E7EB')
                  }
                ]}
                placeholder="Enter 12-digit UTR number"
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                value={utrNumber}
                onChangeText={setUtrNumber}
                keyboardType="numeric"
                maxLength={12}
                editable={!isUploading}
              />
              <Text style={[styles.helperText, { color: themedColors.textSecondary }]}>
                Find this in your payment confirmation SMS/email
              </Text>
            </View>

            {/* Screenshot Upload */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <ImageIcon size={22} color="#8B5CF6" strokeWidth={2.5} />
                <Text style={[styles.inputLabel, { color: themedColors.text }]}>
                  Payment Screenshot *
                </Text>
              </View>
              
              {screenshot ? (
                <View style={styles.screenshotPreviewContainer}>
                  <View style={styles.screenshotPreview}>
                    <Image 
                      source={{ uri: screenshot }} 
                      style={styles.screenshotImage}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => setScreenshot(null)}
                      activeOpacity={0.8}
                    >
                      <X size={20} color="#fff" strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.screenshotSuccessIndicator}>
                    <CheckCircle2 size={18} color="#10B981" strokeWidth={2.5} />
                    <Text style={styles.screenshotSuccessText}>Screenshot uploaded!</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadAreaWrapper}>
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadGradientBorder}
                  >
                    <TouchableOpacity
                      style={[
                        styles.uploadArea,
                        { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
                      ]}
                      onPress={handlePickImage}
                      activeOpacity={0.7}
                      disabled={isUploading}
                    >
                      <LinearGradient
                        colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.uploadGradientBg}
                      >
                        <View style={styles.uploadIconContainer}>
                          <LinearGradient
                            colors={['#8B5CF6', '#EC4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.uploadIconGradient}
                          >
                            <ImageIcon size={32} color="#FFFFFF" strokeWidth={2} />
                          </LinearGradient>
                        </View>
                        <Text style={[styles.uploadTitle, { color: themedColors.text }]}>
                          Tap to Upload Screenshot
                        </Text>
                        <Text style={[styles.uploadSubtitle, { color: themedColors.textSecondary }]}>
                          Select payment screenshot from gallery
                        </Text>
                        <View style={styles.uploadHintBadge}>
                          <Text style={styles.uploadHintText}>JPG, PNG • Max 5MB</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* Instructions */}
            <View style={[
              styles.instructionsContainer,
              { 
                backgroundColor: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.08)',
                borderColor: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'
              }
            ]}>
              <AlertCircle size={22} color="#8B5CF6" strokeWidth={2.5} />
              <Text style={[styles.instructionsText, { color: themedColors.text }]}>
                After completing the payment, enter the 12-digit UTR number and upload a clear screenshot. 
                Your Pro subscription will be activated within 2 hours after admin review.
              </Text>
            </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButtonContainer, isUploading && styles.submitButtonDisabled]}
                  onPress={submitPayment}
                  activeOpacity={0.85}
                  disabled={isUploading}
                >
                  <LinearGradient
                    colors={isUploading ? ['#9CA3AF', '#6B7280'] : ['#10B981', '#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {isUploading ? (
                      <>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.submitButtonText}>
                          Uploading... {uploadProgress}%
                        </Text>
                      </>
                    ) : (
                      <>
                        <Upload size={20} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.submitButtonText}>Submit Payment Proof</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal Overlay & Card
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    height: '90%',  // Changed from maxHeight to height for proper constraint
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    flexDirection: 'column',
  },
  // Gradient Header
  gradientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  // Premium Price Banner
  priceBanner: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  priceMainSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
  },
  priceFrequency: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  // Merchant Info
  merchantName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  // QR Code with Gradient Border
  qrCodeWrapper: {
    marginBottom: 10,
  },
  qrGradientBorder: {
    padding: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: 1,
  },
  qrCode: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  upiId: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  qrInstructions: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    letterSpacing: 1,
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '500',
  },
  // Enhanced Upload Area with Gradient Border
  uploadAreaWrapper: {
    borderRadius: 20,
  },
  uploadGradientBorder: {
    padding: 3,
    borderRadius: 20,
  },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 17,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadGradientBg: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadIconGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  uploadHintBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  uploadHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // Screenshot Preview
  screenshotPreviewContainer: {
    gap: 12,
  },
  screenshotSuccessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  screenshotSuccessText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  screenshotPreview: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  screenshotImage: {
    width: '100%',
    height: 280,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 18,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    fontWeight: '500',
  },
  submitButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    elevation: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  // Payment Method Selection
  paymentMethodHeader: {
    marginBottom: 20,
    gap: 6,
  },
  paymentMethodTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  paymentMethodSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Razorpay Button
  razorpayButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 20,
  },
  razorpayGradient: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  paymentButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    minHeight: 88,
  },
  paymentButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  paymentIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentButtonTextContainer: {
    flex: 1,
    gap: 4,
  },
  paymentButtonTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  paymentButtonSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  instantBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  instantBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  // Payment Divider
  paymentDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  paymentDividerLine: {
    flex: 1,
    height: 1,
  },
  paymentDividerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Manual Payment Button
  manualPaymentButtonContainer: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  manualPaymentButton: {
    borderRadius: 14,
  },
  manualPaymentButtonTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  manualPaymentButtonSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#6B7280',
    letterSpacing: 0.8,
  },
  // Payment Info Container
  paymentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  // Back Button
  backButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
