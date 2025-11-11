/**
 * Supabase Storage Service for Image Uploads
 * Handles uploading images to Supabase storage and getting public URLs
 */

import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Get Supabase configuration from environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export interface ImageUploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
  path?: string;
}

class StorageService {
  private readonly bucketName = 'user-images';
  
  /**
   * Debug function to manually check bucket availability
   */
  async debugBuckets(): Promise<void> {
    console.log('=== BUCKET DEBUG INFO ===');
    console.log('Target bucket name:', `'${this.bucketName}'`);
    console.log('Bucket name length:', this.bucketName.length);
    console.log('Bucket name characters:', this.bucketName.split('').map(c => `'${c}'`));
    
    try {
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Auth status:', user ? 'Authenticated' : 'Not authenticated');
      if (authError) {
        console.error('❌ Auth error:', authError);
      }
      if (user) {
        console.log('👤 User ID:', user.id);
        console.log('📧 User Email:', user.email);
        console.log('👤 User Role:', user.role);
      }
      
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Error listing buckets:', error);
        console.error('📋 Error details:', {
          message: error.message
        });
        console.error('💡 This likely means:');
        console.error('   1. Storage access is not enabled for authenticated users');
        console.error('   2. RLS policies need to be configured in Supabase');
        console.error('   3. Storage bucket policies are missing');
        return;
      }
      
      console.log('Total buckets found:', buckets?.length || 0);
      
      if (buckets && buckets.length > 0) {
        buckets?.forEach((bucket, index) => {
          console.log(`Bucket ${index + 1}:`);
          console.log(`  Name: '${bucket.name}'`);
          console.log(`  Length: ${bucket.name.length}`);
          console.log(`  Characters: ${bucket.name.split('').map(c => `'${c}'`)}`);
          console.log(`  Exact match: ${bucket.name === this.bucketName}`);
          console.log(`  Case insensitive match: ${bucket.name.toLowerCase() === this.bucketName.toLowerCase()}`);
        });
      } else {
        console.log('❌ NO BUCKETS FOUND!');
        console.log('🚨 This indicates a permissions/policy issue.');
        console.log('💡 SOLUTION: Add these policies to your Supabase bucket:');
        console.log('');
        console.log('1. Go to Supabase Dashboard > Storage > Policies');
        console.log('2. Create a new policy for your bucket with these settings:');
        console.log('   - Name: "Allow authenticated users to read bucket"');
        console.log('   - Operation: SELECT');
        console.log('   - Target Roles: authenticated');
        console.log('   - SQL: (auth.uid() IS NOT NULL)');
        console.log('');
        console.log('3. Create another policy:');
        console.log('   - Name: "Allow authenticated users to upload"');
        console.log('   - Operation: INSERT');
        console.log('   - Target Roles: authenticated');
        console.log('   - SQL: (auth.uid() IS NOT NULL)');
        console.log('');
        console.log('4. Also create a bucket policy for listing:');
        console.log('   - Operation: SELECT');
        console.log('   - For bucket operations');
        console.log('');
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
    console.log('=== END BUCKET DEBUG ===');
  }
  
  /**
   * Initialize storage bucket (call this once in app setup)
   */
  async initializeBucket(): Promise<boolean> {
    try {
      console.log(`🔍 Checking for bucket: '${this.bucketName}'`);
      
      // Check if bucket exists and is accessible
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        return false;
      }

      console.log('📋 Available buckets:', buckets?.map(b => `'${b.name}'`).join(', '));
      console.log('🔎 Looking for bucket named:', `'${this.bucketName}'`);
      
      const bucketExists = buckets?.find(bucket => bucket.name === this.bucketName);
      
      if (bucketExists) {
        console.log(`✅ Found existing bucket: '${this.bucketName}'`);
        console.log('🧪 Testing bucket access...');
        
        // Test bucket access by trying to list files
        try {
          const { data: files, error: testError } = await supabase.storage
            .from(this.bucketName)
            .list('', { limit: 1 });
            
          if (testError) {
            console.error('❌ Bucket access test failed:', testError);
            return false;
          }
          
          console.log(`✅ Bucket '${this.bucketName}' is accessible. Found ${files?.length || 0} files.`);
          return true;
        } catch (accessError) {
          console.error('❌ Bucket access error:', accessError);
          return false;
        }
      } else {
        console.error(`❌ Bucket '${this.bucketName}' not found in available buckets.`);
        console.log('📋 Available buckets are:', buckets?.map(b => `'${b.name}'`));
        
        // Check for similar names (case sensitivity, etc.)
        const similarBuckets = buckets?.filter(b => 
          b.name.toLowerCase().includes('image') || 
          b.name.toLowerCase().includes('url')
        );
        
        if (similarBuckets && similarBuckets.length > 0) {
          console.log('🔍 Found similar buckets:', similarBuckets.map(b => `'${b.name}'`));
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Storage initialization error:', error);
      return false;
    }
  }

  /**
   * Upload image from local file URI
   * @param fileUri - Local file URI (from camera or image picker)
   * @param fileName - Optional custom filename
   */
  async uploadImage(fileUri: string, fileName?: string): Promise<ImageUploadResult> {
    console.log('🚀 === UPLOAD IMAGE STARTING ===');
    console.log('📁 File URI:', fileUri);
    console.log('🏷️  File name:', fileName || 'auto-generated');
    
    try {
      // Test Supabase connectivity first
      console.log('🔍 Testing Supabase connectivity...');
      try {
        const { data: testData, error: testError } = await supabase.storage.listBuckets();
        if (testError) {
          console.error('❌ Supabase connectivity test failed:', testError);
        } else {
          console.log('✅ Supabase is reachable, found', testData?.length || 0, 'buckets');
        }
      } catch (connectError) {
        console.error('❌ Network connectivity issue:', connectError);
        return {
          success: false,
          error: 'Cannot connect to Supabase. Please check your internet connection.'
        };
      }
      
      // Generate unique filename if not provided
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const defaultFileName = `ai-stylist-${timestamp}-${randomId}.jpg`;
      const finalFileName = fileName || defaultFileName;
      
      console.log('📝 Final filename:', finalFileName);

      let blob: Blob;

      if (Platform.OS === 'web') {
        // Web platform: handle File or Blob objects directly
        if (fileUri.startsWith('blob:')) {
          // Handle blob URLs
          const response = await fetch(fileUri);
          blob = await response.blob();
        } else if (fileUri.startsWith('data:')) {
          // Handle data URLs
          const response = await fetch(fileUri);
          blob = await response.blob();
        } else {
          // Try to fetch as a regular URL
          try {
            const response = await fetch(fileUri);
            blob = await response.blob();
          } catch (fetchError) {
            console.error('Failed to fetch image from URI:', fetchError);
            throw new Error('Web platform requires blob: or data: URLs, or fetchable URLs');
          }
        }
      } else {
        // Mobile platform: Read file directly and use React Native's file upload
        console.log('📱 Preparing file for upload...');
        console.log('   File URI:', fileUri);
        
        // Try multiple approaches for React Native compatibility
        try {
          // Approach 1: Use FormData with the file URI directly
          console.log('� Attempting FormData upload (Method 1)...');
          const formData = new FormData();
          formData.append('file', {
            uri: fileUri,
            type: 'image/jpeg',
            name: finalFileName,
          } as any);
          
          // Upload using FormData
          const filePath = `ai-stylist/${timestamp}/${finalFileName}`;
          console.log(`� Uploading with FormData to: ${filePath}`);
          
          const uploadUrl = `${supabaseUrl}/storage/v1/object/${this.bucketName}/${filePath}`;
          const { data: { session } } = await supabase.auth.getSession();
          
          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
            },
            body: formData,
          });
          
          if (!uploadResponse.ok) {
            console.log('❌ FormData upload failed, trying Blob method...');
            throw new Error(`FormData upload failed: ${uploadResponse.status}`);
          }
          
          console.log('✅ FormData upload successful!');
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from(this.bucketName)
            .getPublicUrl(filePath);

          return {
            success: true,
            publicUrl: publicUrlData.publicUrl,
            path: filePath
          };
          
        } catch (formDataError) {
          console.log('⚠️  FormData failed, trying Blob conversion...');
          console.error('FormData error:', formDataError);
          
          // Approach 2: Fall back to base64 + Blob
          console.log('� Reading file as base64...');
          const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log(`📊 Base64 length: ${base64.length} chars`);

          console.log('🔄 Creating data URI...');
          const dataUri = `data:image/jpeg;base64,${base64}`;
          
          console.log('🌐 Fetching data URI to create Blob...');
          const response = await fetch(dataUri);
          console.log('✅ Fetch successful, status:', response.status);
          blob = await response.blob();
          console.log('✅ Blob created, size:', blob.size, 'type:', blob.type);
        }
      }

      // Upload to Supabase storage
      console.log('📤 Uploading to Supabase Storage...');
      const filePath = `ai-stylist/${timestamp}/${finalFileName}`;
      console.log(`   Bucket: ${this.bucketName}`);
      console.log(`   Path: ${filePath}`);
      console.log(`   Blob size: ${blob.size} bytes`);
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error details:', JSON.stringify(error, null, 2));
        
        // Check for specific error types
        if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          console.error('💡 This appears to be a network connectivity issue');
          console.error('   Possible causes:');
          console.error('   1. Device not connected to internet');
          console.error('   2. Supabase URL is unreachable');
          console.error('   3. Storage bucket permissions issue');
          console.error('   4. CORS policy blocking the request');
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Upload successful!');
      console.log('   Uploaded path:', data.path);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(data.path);

      return {
        success: true,
        publicUrl: publicUrlData.publicUrl,
        path: data.path
      };

    } catch (error) {
      console.error('Storage upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Upload image from camera capture (optimized for AI stylist)
   * @param imageUri - Image URI from camera
   */
  async uploadCameraImage(imageUri: string): Promise<ImageUploadResult> {
    const timestamp = Date.now();
    const fileName = `stylist-capture-${timestamp}.jpg`;
    return this.uploadImage(imageUri, fileName);
  }

  /**
   * Delete image from storage
   * @param filePath - File path in storage
   */
  async deleteImage(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Storage delete error:', error);
      return false;
    }
  }

  /**
   * Get public URL for existing file
   * @param filePath - File path in storage
   */
  getPublicUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }

  /**
   * List uploaded images for current session
   * @param limit - Maximum number of files to return
   */
  async listImages(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list('', {
          limit,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('List images error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Storage list error:', error);
      return [];
    }
  }

  /**
   * Clean up old images (for maintenance)
   * @param daysOld - Delete images older than this many days
   */
  async cleanupOldImages(daysOld: number = 7): Promise<number> {
    try {
      const images = await this.listImages(1000); // Get more for cleanup
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;
      for (const image of images) {
        const imageDate = new Date(image.created_at);
        if (imageDate < cutoffDate) {
          const deleted = await this.deleteImage(image.name);
          if (deleted) deletedCount++;
        }
      }

      console.log(`Cleaned up ${deletedCount} old images`);
      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }
}

export const storageService = new StorageService();
export default storageService;