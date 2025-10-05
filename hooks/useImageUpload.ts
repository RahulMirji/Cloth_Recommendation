/**
 * Profile Image Upload Hook
 * 
 * Provides functionality to upload profile images to Supabase Storage
 * with automatic compression, optimization, and cross-device persistence.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToStorage, replaceImage, validateImageUrl, type StoragePath } from '@/utils/supabaseStorage';
import { useApp } from '@/contexts/AppContext';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { userProfile, session, updateUserProfile } = useApp();

  /**
   * Pick image from gallery with permissions
   */
  const pickImageFromGallery = useCallback(async (): Promise<string | null> => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to upload images.'
        );
        return null;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    }
  }, []);

  /**
   * Pick image from camera with permissions
   */
  const pickImageFromCamera = useCallback(async (): Promise<string | null> => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera to take photos.'
        );
        return null;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri;
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }, []);

  /**
   * Upload profile image to Supabase Storage
   */
  const uploadProfileImage = useCallback(
    async (localUri: string): Promise<ImageUploadResult> => {
      if (!session?.user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      setIsUploading(true);

      try {
        console.log('🖼️  Uploading profile image to Supabase Storage...');

        // Replace old image with new one
        const publicUrl = await replaceImage(userProfile.profileImage, {
          userId: session.user.id,
          path: 'PROFILE',
          localUri,
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 800,
        });

        console.log('✅ Profile image uploaded successfully:', publicUrl);

        // Update profile with new image URL
        await updateUserProfile({ profileImage: publicUrl });

        return {
          success: true,
          url: publicUrl,
        };
      } catch (error) {
        console.error('❌ Error uploading profile image:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        };
      } finally {
        setIsUploading(false);
      }
    },
    [session, userProfile.profileImage, updateUserProfile]
  );

  /**
   * Upload outfit/analysis image to Supabase Storage
   */
  const uploadOutfitImage = useCallback(
    async (localUri: string, type: 'OUTFITS' | 'ANALYSIS' = 'OUTFITS'): Promise<ImageUploadResult> => {
      if (!session?.user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      setIsUploading(true);

      try {
        console.log(`🖼️  Uploading ${type.toLowerCase()} image to Supabase Storage...`);

        const publicUrl = await uploadImageToStorage({
          userId: session.user.id,
          path: type,
          localUri,
          quality: 0.8,
          maxWidth: 1200,
          maxHeight: 1200,
        });

        console.log(`✅ ${type} image uploaded successfully:`, publicUrl);

        return {
          success: true,
          url: publicUrl,
        };
      } catch (error) {
        console.error(`❌ Error uploading ${type} image:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        };
      } finally {
        setIsUploading(false);
      }
    },
    [session]
  );

  /**
   * Complete flow: Pick image from gallery and upload to Supabase Storage
   */
  const pickAndUploadProfileImage = useCallback(async (): Promise<ImageUploadResult> => {
    const localUri = await pickImageFromGallery();

    if (!localUri) {
      return {
        success: false,
        error: 'No image selected',
      };
    }

    return uploadProfileImage(localUri);
  }, [pickImageFromGallery, uploadProfileImage]);

  /**
   * Complete flow: Take photo from camera and upload to Supabase Storage
   */
  const takeAndUploadProfilePhoto = useCallback(async (): Promise<ImageUploadResult> => {
    const localUri = await pickImageFromCamera();

    if (!localUri) {
      return {
        success: false,
        error: 'No photo taken',
      };
    }

    return uploadProfileImage(localUri);
  }, [pickImageFromCamera, uploadProfileImage]);

  /**
   * Complete flow: Pick outfit image and upload
   */
  const pickAndUploadOutfitImage = useCallback(async (): Promise<ImageUploadResult> => {
    const localUri = await pickImageFromGallery();

    if (!localUri) {
      return {
        success: false,
        error: 'No image selected',
      };
    }

    return uploadOutfitImage(localUri, 'OUTFITS');
  }, [pickImageFromGallery, uploadOutfitImage]);

  /**
   * Complete flow: Take outfit photo from camera and upload
   */
  const takeAndUploadOutfitPhoto = useCallback(async (): Promise<ImageUploadResult> => {
    const localUri = await pickImageFromCamera();

    if (!localUri) {
      return {
        success: false,
        error: 'No photo taken',
      };
    }

    return uploadOutfitImage(localUri, 'OUTFITS');
  }, [pickImageFromCamera, uploadOutfitImage]);

  /**
   * Validate if image URL is accessible
   */
  const isImageValid = useCallback(async (url: string | undefined): Promise<boolean> => {
    return validateImageUrl(url);
  }, []);

  return {
    // State
    isUploading,

    // Basic image picking
    pickImageFromGallery,
    pickImageFromCamera,

    // Upload functions
    uploadProfileImage,
    uploadOutfitImage,

    // Complete flows (pick + upload)
    pickAndUploadProfileImage,
    takeAndUploadProfilePhoto,
    pickAndUploadOutfitImage,
    takeAndUploadOutfitPhoto,

    // Utilities
    isImageValid,
  };
}
