/**
 * Profile Image Upload Hook
 * 
 * Provides functionality to upload profile images to Supabase Storage
 * with automatic compression, optimization, and cross-device persistence.
 */

import { useState, useCallback } from 'react';
import { uploadImageToStorage, replaceImage } from '@/utils/supabaseStorage';
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
        // Replace old image with new one
        const publicUrl = await replaceImage(userProfile.profileImage, {
          userId: session.user.id,
          path: 'PROFILE',
          localUri,
          quality: 0.8,
          maxWidth: 800,
          maxHeight: 800,
        });

        // Update profile with new image URL
        await updateUserProfile({ profileImage: publicUrl });

        return {
          success: true,
          url: publicUrl,
        };
      } catch (error) {
        console.error('Error uploading profile image:', error);
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
        const publicUrl = await uploadImageToStorage({
          userId: session.user.id,
          path: type,
          localUri,
          quality: 0.8,
          maxWidth: 1200,
          maxHeight: 1200,
        });

        return {
          success: true,
          url: publicUrl,
        };
      } catch (error) {
        console.error(`Error uploading ${type} image:`, error);
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

  return {
    isUploading,
    uploadProfileImage,
    uploadOutfitImage,
  };
}
