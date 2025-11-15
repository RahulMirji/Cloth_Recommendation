import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useColorScheme,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateTryOnImage } from '../services/virtualTryOnRouter'; // Smart router: Gemini or Vertex AI
import { preprocessForVirtualTryOn } from '../utils/imagePreprocessor';
import { useRouter } from 'expo-router';
import { useImageUpload } from '@/OutfitScorer/hooks/useImageUpload';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/contexts/AlertContext';
import { Camera, Upload, Sparkles, User, Shirt, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function VirtualTryOnScreen() {
  const router = useRouter();
  const { session, settings } = useApp();
  const { uploadOutfitImage } = useImageUpload();
  const { showAlert } = useAlert();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  
  const [userPhotoUri, setUserPhotoUri] = useState<string | null>(null);
  const [outfitPhotoUri, setOutfitPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async (type: 'user' | 'outfit') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert('error', 'Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'user') {
        setUserPhotoUri(result.assets[0].uri);
      } else {
        setOutfitPhotoUri(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async (type: 'user' | 'outfit') => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert('error', 'Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'user') {
        setUserPhotoUri(result.assets[0].uri);
      } else {
        setOutfitPhotoUri(result.assets[0].uri);
      }
    }
  };

  const handleGenerate = async () => {
    if (!userPhotoUri || !outfitPhotoUri) {
      showAlert('error', 'Missing Images', 'Please upload both your photo and an outfit image.');
      return;
    }

    if (!session?.user?.id) {
      showAlert('error', 'Authentication Required', 'Please login to use virtual try-on.');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Starting virtual try-on generation...');
      console.log('📸 User photo URI:', userPhotoUri);
      console.log('👔 Outfit photo URI:', outfitPhotoUri);

      // STEP 1: Preprocess both images (optional - Gemini can handle various sizes)
      console.log('🔄 Preprocessing images...');
      const processedUserUri = await preprocessForVirtualTryOn(userPhotoUri);
      const processedOutfitUri = await preprocessForVirtualTryOn(outfitPhotoUri);
      console.log('✅ Images preprocessed');

      // STEP 2: Call Gemini API directly with local image URIs
      console.log('🎨 Calling Gemini API...');
      console.log('User image URI:', processedUserUri);
      console.log('Outfit image URI:', processedOutfitUri);
      
      const result = await generateTryOnImage(processedUserUri, processedOutfitUri);
      console.log('🎨 Gemini API result:', result);

      if (result.success && result.imageUrl) {
        console.log('✅ Generation successful! Image URL:', result.imageUrl);
        router.push({
          pathname: '/virtual-try-on-result' as any,
          params: { imageUrl: result.imageUrl },
        });
      } else {
        console.error('❌ Generation failed:', result.error);
        showAlert('error', 'Generation Failed', result.error || 'Failed to generate image. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      console.error('Error stack:', error.stack);
      showAlert('error', 'Error', error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, isDarkMode && styles.iconCircleDark]}>
              <Sparkles size={32} color={Colors.primary} />
            </View>
          </View>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>Virtual Try-On</Text>
          <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
            Experience the magic of AI-powered fashion. Upload your photo and try on any outfit instantly!
          </Text>
        </View>

        {/* Upload Cards */}
        <View style={styles.uploadContainer}>
          {/* User Photo Card */}
          <View style={[styles.uploadCard, isDarkMode && styles.uploadCardDark]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <User size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>Your Photo</Text>
            </View>
            
            {userPhotoUri ? (
              <View style={styles.imagePreviewCard}>
                <Image source={{ uri: userPhotoUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setUserPhotoUri(null)}
                >
                  <X size={18} color={Colors.white} />
                </TouchableOpacity>
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageBadge}>✓ Ready</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadActions}>
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={() => takePhoto('user')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadButtonInner, isDarkMode && styles.uploadButtonInnerDark]}>
                    <Camera size={28} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={() => pickImage('user')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadButtonInner, isDarkMode && styles.uploadButtonInnerDark]}>
                    <Upload size={28} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Outfit Photo Card */}
          <View style={[styles.uploadCard, isDarkMode && styles.uploadCardDark]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrapper}>
                <Shirt size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>Outfit Photo</Text>
            </View>
            
            {outfitPhotoUri ? (
              <View style={styles.imagePreviewCard}>
                <Image source={{ uri: outfitPhotoUri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setOutfitPhotoUri(null)}
                >
                  <X size={18} color={Colors.white} />
                </TouchableOpacity>
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageBadge}>✓ Ready</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadActions}>
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={() => takePhoto('outfit')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadButtonInner, isDarkMode && styles.uploadButtonInnerDark]}>
                    <Camera size={28} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.uploadButton} 
                  onPress={() => pickImage('outfit')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.uploadButtonInner, isDarkMode && styles.uploadButtonInnerDark]}>
                    <Upload size={28} color={Colors.primary} />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButtonWrapper,
            (!userPhotoUri || !outfitPhotoUri || loading) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={!userPhotoUri || !outfitPhotoUri || loading}
          activeOpacity={0.8}
        >
          <View style={styles.generateButton}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.generateButtonText}>Creating Magic...</Text>
              </View>
            ) : (
              <View style={styles.generateContent}>
                <Sparkles size={24} color={Colors.white} />
                <Text style={styles.generateButtonText}>Generate Try-On</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {loading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
              ✨ Gemini AI is working its magic... This may take 30-60 seconds
            </Text>
          </View>
        )}

        {/* Info Section */}
        {!loading && !userPhotoUri && !outfitPhotoUri && (
          <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
            <Text style={[styles.infoTitle, isDarkMode && styles.infoTitleDark]}>💡 Tips for Best Results</Text>
            <View style={styles.infoList}>
              <Text style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>• Use a clear, well-lit photo of yourself</Text>
              <Text style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>• Choose an outfit with good visibility</Text>
              <Text style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>• Front-facing photos work best</Text>
              <Text style={[styles.infoItem, isDarkMode && styles.infoItemDark]}>• ✨ Powered by Google Gemini AI</Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 32,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircleDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  subtitleDark: {
    color: '#94A3B8',
  },
  uploadContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  uploadCardDark: {
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardTitleDark: {
    color: '#F8FAFC',
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
  },
  uploadButtonInner: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadButtonInnerDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  imagePreviewCard: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  imageBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  generateButtonWrapper: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  generateButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  loadingTextDark: {
    color: '#94A3B8',
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoCardDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoTitleDark: {
    color: '#F8FAFC',
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  infoItemDark: {
    color: '#CBD5E1',
  },
});
