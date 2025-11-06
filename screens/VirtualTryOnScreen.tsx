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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { generateTryOnImage } from '../services/piApiService';
import { useRouter } from 'expo-router';
import { useImageUpload } from '@/OutfitScorer/hooks/useImageUpload';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/contexts/AlertContext';
import { Camera, Upload } from 'lucide-react-native';
import Colors from '@/constants/colors';

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

      // Upload images to Supabase Storage
      console.log('⬆️ Uploading user image...');
      const userImageUpload = await uploadOutfitImage(userPhotoUri, 'OUTFITS');
      console.log('✅ User image upload result:', userImageUpload);

      console.log('⬆️ Uploading outfit image...');
      const outfitImageUpload = await uploadOutfitImage(outfitPhotoUri, 'OUTFITS');
      console.log('✅ Outfit image upload result:', outfitImageUpload);

      if (!userImageUpload.success || !outfitImageUpload.success) {
        const errorMsg = `User upload: ${userImageUpload.error || 'OK'}, Outfit upload: ${outfitImageUpload.error || 'OK'}`;
        console.error('❌ Upload failed:', errorMsg);
        showAlert('error', 'Upload Failed', errorMsg);
        setLoading(false);
        return;
      }

      // Call API with uploaded image URLs
      console.log('🎨 Calling PI API...');
      console.log('User image URL:', userImageUpload.url);
      console.log('Outfit image URL:', outfitImageUpload.url);
      
      const result = await generateTryOnImage(userImageUpload.url!, outfitImageUpload.url!);
      console.log('🎨 PI API result:', result);

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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Virtual Try-On</Text>
        <Text style={styles.subtitle}>
          Upload your photo and an outfit to see how it looks on you!
        </Text>

        {/* User Photo Upload */}
        <View style={styles.uploadSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Your Photo</Text>
          {userPhotoUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: userPhotoUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setUserPhotoUri(null)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={() => takePhoto('user')}
              >
                <Camera size={24} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]} 
                onPress={() => pickImage('user')}
              >
                <Upload size={24} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Outfit Photo Upload */}
        <View style={styles.uploadSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.textDark]}>Outfit Photo</Text>
          {outfitPhotoUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: outfitPhotoUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => setOutfitPhotoUri(null)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={() => takePhoto('outfit')}
              >
                <Camera size={24} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]} 
                onPress={() => pickImage('outfit')}
              >
                <Upload size={24} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!userPhotoUri || !outfitPhotoUri || loading) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerate}
          disabled={!userPhotoUri || !outfitPhotoUri || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>Generate Try-On</Text>
          )}
        </TouchableOpacity>

        {loading && (
          <Text style={styles.loadingText}>
            Generating your virtual try-on... This may take 15-30 seconds.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  uploadSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  textDark: {
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontSize: 14,
  },
});
