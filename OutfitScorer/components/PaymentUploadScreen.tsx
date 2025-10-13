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
  ImageIcon
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/contexts/AlertContext';
import getThemedColors from '@/constants/themedColors';

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
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
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
        // Handle duplicate request error
        if (error.message.includes('DUPLICATE_REQUEST')) {
          throw new Error('You already have a pending payment request. Please wait for admin review.');
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
      showAlert('error', 'Submission Failed', error.message || 'Failed to submit payment. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff' }
      ]}>
        {/* Header */}
        <View style={[
          styles.header,
          { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff' }
        ]}>
          <Text style={[
            styles.headerTitle,
            { color: themedColors.text }
          ]}>
            Upgrade to Pro
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <X size={24} color={themedColors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Price Banner */}
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.priceBanner}
          >
            <Text style={styles.priceLabel}>Monthly Subscription</Text>
            <Text style={styles.priceAmount}>₹29</Text>
            <Text style={styles.priceFeatures}>100 Credits • 30 Days Access</Text>
          </LinearGradient>

          {/* QR Code Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <QrCode size={24} color="#8B5CF6" />
              <Text style={[styles.sectionTitle, { color: themedColors.text }]}>
                Scan QR to Pay
              </Text>
            </View>
            <View style={[
              styles.qrContainer,
              { backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB' }
            ]}>
              <Image 
                source={QR_CODE_IMAGE}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.qrInstructions, { color: themedColors.textSecondary }]}>
              Scan this QR code with any UPI app to pay ₹29
            </Text>
          </View>

          {/* UTR Number Input */}
          <View style={styles.section}>
            <Text style={[styles.inputLabel, { color: themedColors.text }]}>
              UTR / Transaction Reference Number *
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB',
                  color: themedColors.text,
                  borderColor: isDarkMode ? '#3A3A3A' : '#E5E7EB'
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
              Must be exactly 12 digits
            </Text>
          </View>

          {/* Screenshot Upload */}
          <View style={styles.section}>
            <Text style={[styles.inputLabel, { color: themedColors.text }]}>
              Payment Screenshot *
            </Text>
            
            {screenshot ? (
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
                  <X size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadArea,
                  { 
                    backgroundColor: isDarkMode ? '#2A2A2A' : '#F9FAFB',
                    borderColor: isDarkMode ? '#3A3A3A' : '#E5E7EB'
                  }
                ]}
                onPress={handlePickImage}
                activeOpacity={0.8}
                disabled={isUploading}
              >
                <View style={styles.uploadIconContainer}>
                  <ImageIcon size={48} color="#8B5CF6" strokeWidth={1.5} />
                </View>
                <Text style={[styles.uploadTitle, { color: themedColors.text }]}>
                  Upload Payment Screenshot
                </Text>
                <Text style={[styles.uploadSubtitle, { color: themedColors.textSecondary }]}>
                  Tap to select from gallery
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Instructions */}
          <View style={[
            styles.instructionsContainer,
            { backgroundColor: isDarkMode ? '#2A2A2A' : '#F3F4F6' }
          ]}>
            <AlertCircle size={20} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
            <Text style={[styles.instructionsText, { color: themedColors.textSecondary }]}>
              After payment, enter the 12-digit UTR number and upload a screenshot. 
              Your request will be reviewed within 2 hours.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButtonContainer, isUploading && styles.submitButtonDisabled]}
            onPress={submitPayment}
            activeOpacity={0.9}
            disabled={isUploading}
          >
            <LinearGradient
              colors={isUploading ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#EC4899']}
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
                  <Upload size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Payment</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  priceBanner: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 8,
  },
  priceFeatures: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qrCode: {
    width: 250,
    height: 250,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
  },
  uploadArea: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  uploadButtons: {
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 16,
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  screenshotPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  screenshotImage: {
    width: '100%',
    height: 300,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  instructionsText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  submitButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
  },
  submitGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
});
