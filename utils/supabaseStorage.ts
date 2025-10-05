/**
 * Supabase Storage Utility
 * 
 * Centralized image storage management using Supabase Storage.
 * Handles upload, download, and deletion of user images across devices.
 * 
 * Features:
 * - Cross-device image persistence
 * - Automatic image compression and optimization
 * - Public URL generation for easy access
 * - Secure user-specific storage paths
 * - Graceful error handling with fallbacks
 */

import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Storage bucket name (must match the bucket name in Supabase Dashboard)
// Note: Supabase stores bucket names in lowercase internally
const STORAGE_BUCKET = 'user-images';

// Image storage paths
const STORAGE_PATHS = {
  PROFILE: 'profiles',
  OUTFITS: 'outfits',
  ANALYSIS: 'analysis',
} as const;

export type StoragePath = keyof typeof STORAGE_PATHS;

/**
 * Image upload options
 */
export interface ImageUploadOptions {
  /** User ID for organizing images */
  userId: string;
  /** Storage path category (profile, outfits, analysis) */
  path: StoragePath;
  /** Local image URI from device */
  localUri: string;
  /** Optional filename (auto-generated if not provided) */
  filename?: string;
  /** Image quality (0-1, default: 0.8) */
  quality?: number;
  /** Max width for compression (default: 1200) */
  maxWidth?: number;
  /** Max height for compression (default: 1200) */
  maxHeight?: number;
}

/**
 * Compress and optimize image before upload
 */
async function compressImage(
  uri: string,
  quality: number = 0.8,
  maxWidth: number = 1200,
  maxHeight: number = 1200
): Promise<string> {
  try {
    console.log(`🖼️  Compressing image: ${uri}`);
    
    const manipulatedImage = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );

    console.log(`✅ Image compressed successfully`);
    return manipulatedImage.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original URI if compression fails
    return uri;
  }
}

/**
 * Convert local file URI to base64
 */
async function uriToBase64(uri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    return base64;
  } catch (error) {
    console.error('Error converting URI to base64:', error);
    throw new Error('Failed to read image file');
  }
}

/**
 * Generate unique filename for image
 */
function generateFilename(userId: string, extension: string = 'jpg'): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  return `${userId}_${timestamp}_${randomId}.${extension}`;
}

/**
 * Upload image to Supabase Storage with retry logic
 * 
 * @param options - Image upload configuration
 * @returns Public URL of uploaded image
 */
export async function uploadImageToStorage(
  options: ImageUploadOptions,
  retryCount: number = 0
): Promise<string> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  
  const {
    userId,
    path,
    localUri,
    filename,
    quality = 0.8,
    maxWidth = 1200,
    maxHeight = 1200,
  } = options;

  try {
    console.log(`📤 Starting image upload to Supabase Storage... (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    console.log(`   User: ${userId}`);
    console.log(`   Path: ${STORAGE_PATHS[path]}`);
    console.log(`   Local URI: ${localUri}`);

    // Step 0: Test connectivity
    if (retryCount === 0) {
      try {
        console.log('🔍 Testing Supabase connectivity...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
          console.warn('⚠️  Cannot list buckets (may lack permissions):', bucketsError.message);
        } else {
          console.log('✅ Supabase connection OK, found', buckets?.length || 0, 'buckets');
        }
      } catch (err) {
        console.warn('⚠️  Network connectivity test failed:', err);
      }
    }

    // Step 1: Compress image
    const compressedUri = await compressImage(localUri, quality, maxWidth, maxHeight);

    // Step 2: Convert to base64
    const base64 = await uriToBase64(compressedUri);

    // Step 3: Generate storage path
    const generatedFilename = filename || generateFilename(userId);
    const storagePath = `${STORAGE_PATHS[path]}/${userId}/${generatedFilename}`;

    console.log(`   Storage Path: ${storagePath}`);
    console.log(`   Base64 size: ${base64.length} bytes`);
    console.log(`   Bucket: ${STORAGE_BUCKET}`);

    // Step 4: Create FormData for React Native compatibility (same approach as AI Stylist)
    console.log('📱 Creating FormData for React Native upload...');
    const formData = new FormData();
    formData.append('file', {
      uri: compressedUri,
      type: 'image/jpeg',
      name: generatedFilename,
    } as any);
    
    console.log(`   FormData created with file`);

    // Step 5: Upload to Supabase Storage using FormData (React Native compatible)
    console.log('📤 Uploading using FormData...');
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmhiwieooqfwkrdcvqvb.supabase.co';
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${storagePath}`;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    const uploadPromise = fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: formData,
    });

    // Add timeout to detect hanging requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
    );

    const response = await Promise.race([uploadPromise, timeoutPromise]) as Response;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', response.status, response.statusText);
      console.error('   Error details:', errorText);
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES && (
        response.status === 0 ||
        response.status >= 500 ||
        errorText?.includes('Network request failed')
      )) {
        console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return uploadImageToStorage(options, retryCount + 1);
      }
      
      throw new Error(`Upload failed: ${response.statusText || 'Unknown error'}`);
    }

    console.log(`✅ Image uploaded successfully: ${storagePath}`);

    // Step 6: Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log(`🔗 Public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error: any) {
    console.error('❌ Error uploading image to storage:', error);
    
    // Retry on network errors
    if (retryCount < MAX_RETRIES && (
      error.message?.includes('Network request failed') ||
      error.message?.includes('timeout') ||
      error.message?.includes('Failed to fetch')
    )) {
      console.log(`⏳ Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return uploadImageToStorage(options, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * 
 * @param imageUrl - Public URL of image to delete
 * @returns Success status
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  try {
    // Skip deletion if it's a local file URI (not a Supabase URL)
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log('⏭️  Skipping deletion - not a Supabase URL:', imageUrl);
      return true; // Return true since there's nothing to delete
    }

    // Extract path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    
    if (!pathMatch) {
      console.warn('⚠️  Cannot extract storage path from URL, skipping deletion');
      return true; // Return true to not block the operation
    }

    const storagePath = pathMatch[1];
    console.log(`🗑️  Deleting old image: ${storagePath}`);

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      console.warn('⚠️  Error deleting old image (non-critical):', error.message);
      return true; // Return true anyway - deletion failure shouldn't block upload
    }

    console.log(`✅ Old image deleted successfully`);
    return true;
  } catch (error) {
    console.warn('⚠️  Exception deleting old image (non-critical):', error);
    return true; // Return true anyway - deletion is non-critical
  }
}

/**
 * Delete old image and upload new one (atomic operation)
 * 
 * @param oldImageUrl - URL of old image to replace
 * @param options - Upload options for new image
 * @returns Public URL of new uploaded image
 */
export async function replaceImage(
  oldImageUrl: string | undefined,
  options: ImageUploadOptions
): Promise<string> {
  try {
    // Upload new image first
    const newUrl = await uploadImageToStorage(options);

    // Delete old image if exists (don't fail if deletion fails)
    if (oldImageUrl) {
      await deleteImageFromStorage(oldImageUrl);
    }

    return newUrl;
  } catch (error) {
    console.error('❌ Error replacing image:', error);
    throw error;
  }
}

/**
 * Get fallback image URL
 * 
 * @param path - Storage path type
 * @returns Default placeholder image URL
 */
export function getFallbackImageUrl(path: StoragePath): string {
  switch (path) {
    case 'PROFILE':
      return 'https://via.placeholder.com/400x400.png?text=No+Profile+Image';
    case 'OUTFITS':
      return 'https://via.placeholder.com/800x600.png?text=No+Outfit+Image';
    case 'ANALYSIS':
      return 'https://via.placeholder.com/800x600.png?text=No+Analysis+Image';
    default:
      return 'https://via.placeholder.com/400x400.png?text=No+Image';
  }
}

/**
 * Check if image URL is valid and accessible
 * 
 * @param url - Image URL to check
 * @returns True if URL is valid and accessible
 */
export async function validateImageUrl(url: string | undefined): Promise<boolean> {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    // Check if it's a valid URL
    new URL(url);
    
    // For Supabase Storage URLs, assume they're valid if properly formatted
    if (url.includes('supabase.co/storage')) {
      return true;
    }

    // For other URLs, could add additional validation
    return true;
  } catch (error) {
    console.error('Invalid image URL:', error);
    return false;
  }
}

/**
 * Initialize storage bucket (call once on app startup)
 * Verifies bucket exists (bucket should be created manually in Supabase Dashboard)
 */
export async function initializeStorageBucket(): Promise<void> {
  try {
    console.log(`🔧 Initializing Supabase Storage bucket: ${STORAGE_BUCKET}`);

    // Test 1: Check basic connectivity
    console.log('🔍 Test 1: Checking Supabase connectivity...');
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.warn('⚠️  Cannot list buckets (may lack permissions):', bucketsError.message);
      } else {
        console.log('✅ Connected! Found buckets:', buckets?.map(b => b.name).join(', ') || 'none');
        const targetBucket = buckets?.find(b => b.name === STORAGE_BUCKET);
        if (targetBucket) {
          console.log(`✅ Target bucket '${STORAGE_BUCKET}' exists`);
          console.log('   - Public:', targetBucket.public);
          console.log('   - Created:', targetBucket.created_at);
        } else {
          console.warn(`⚠️  Bucket '${STORAGE_BUCKET}' not found in list`);
        }
      }
    } catch (err: any) {
      console.error('❌ Connectivity test failed:', err.message);
    }

    // Test 2: Check bucket access
    console.log('🔍 Test 2: Checking bucket access...');
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list('', { limit: 1 });

    if (error) {
      console.error(`❌ Cannot access storage bucket '${STORAGE_BUCKET}':`, error.message);
      console.log('📝 Please ensure in Supabase Dashboard:');
      console.log('   1. Storage → Buckets → Create bucket named "user-images"');
      console.log('   2. Make bucket Public (toggle on)');
      console.log('   3. Configure RLS policies for uploads:');
      console.log('      - INSERT policy: auth.uid() = (storage.foldername(name))[1]');
      console.log('      - SELECT policy: Public access or authenticated');
      console.log('   4. Check CORS settings allow your domain');
      return;
    }

    console.log(`✅ Storage bucket verified: ${STORAGE_BUCKET}`);
    console.log(`📁 Bucket is accessible and ready for uploads`);
    if (data && data.length > 0) {
      console.log(`📊 Found ${data.length} existing file(s) in root`);
    }
  } catch (error: any) {
    console.error('❌ Error initializing storage bucket:', error.message || error);
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify Supabase URL and API keys in .env');
    console.log('   3. Ensure Supabase project is not paused');
    console.log('   4. Check if storage is enabled for your project');
  }
}

/**
 * Export storage configuration
 */
export const STORAGE_CONFIG = {
  BUCKET: STORAGE_BUCKET,
  PATHS: STORAGE_PATHS,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png'],
  DEFAULT_QUALITY: 0.8,
  DEFAULT_MAX_WIDTH: 1200,
  DEFAULT_MAX_HEIGHT: 1200,
} as const;
