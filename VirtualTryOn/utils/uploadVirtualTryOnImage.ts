/**
 * Virtual Try-On Image Upload Utility
 * 
 * Specialized upload function for virtual try-on images that:
 * - Uploads preprocessed images WITHOUT any transformation
 * - Preserves exact dimensions (1024x1024)
 * - Disables Supabase's automatic image optimization
 * 
 * IMPORTANT: This is ONLY for virtual try-on. Other features use the
 * standard upload with transformation for better performance.
 */

import { supabase } from '@/lib/supabase';

interface UploadOptions {
  userId: string;
  localUri: string;
  folder?: string;
}

/**
 * Upload image to Supabase Storage without any transformation
 * Preserves exact dimensions for AI API compatibility
 */
export async function uploadVirtualTryOnImage(
  options: UploadOptions
): Promise<string> {
  const { userId, localUri, folder = 'virtual-try-on' } = options;

  try {
    console.log('📤 Uploading virtual try-on image (no transformation)...');
    console.log('📂 Local URI:', localUri);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${userId}_${timestamp}_${randomString}.jpg`;
    const filePath = `${folder}/${userId}/${fileName}`;

    console.log('📝 Upload path:', filePath);

    // Create FormData for React Native
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      type: 'image/jpeg',
      name: fileName,
    } as any);

    console.log('📦 Preparing upload...');

    // Upload using fetch API (same approach as PaymentUploadScreen)
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
    const uploadUrl = `${supabaseUrl}/storage/v1/object/user-images/${filePath}`;
    
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    console.log('🔹 Uploading to Supabase...');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentSession?.access_token}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ Upload failed:', uploadResponse.status, errorText);
      throw new Error(`Upload failed: ${uploadResponse.statusText || 'Unknown error'}`);
    }

    console.log('✅ Upload successful:', filePath);

    // Get public URL WITHOUT transformation parameters
    const { data: urlData } = supabase.storage
      .from('user-images')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log('🌐 Public URL (no transform):', publicUrl);

    // Verify the URL doesn't have transform parameters
    if (publicUrl.includes('transform=')) {
      console.warn('⚠️ Warning: URL contains transform parameter!');
    }

    return publicUrl;
  } catch (error) {
    console.error('❌ Error uploading virtual try-on image:', error);
    throw error;
  }
}

/**
 * Upload both user and outfit images for virtual try-on
 * Returns both public URLs
 */
export async function uploadVirtualTryOnImages(
  userId: string,
  userImageUri: string,
  outfitImageUri: string
): Promise<{ userImageUrl: string; outfitImageUrl: string }> {
  console.log('📤 Uploading both virtual try-on images...');

  const [userImageUrl, outfitImageUrl] = await Promise.all([
    uploadVirtualTryOnImage({ userId, localUri: userImageUri }),
    uploadVirtualTryOnImage({ userId, localUri: outfitImageUri }),
  ]);

  console.log('✅ Both images uploaded successfully');
  console.log('👤 User image:', userImageUrl);
  console.log('👕 Outfit image:', outfitImageUrl);

  return {
    userImageUrl,
    outfitImageUrl,
  };
}
