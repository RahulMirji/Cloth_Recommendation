import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';

/**
 * Image Preprocessing Utilities for Virtual Try-On
 * 
 * Ensures all images are in the correct aspect ratio and size
 * for optimal PI API processing
 */

interface ImageInfo {
  uri: string;
  width: number;
  height: number;
}

interface PreprocessOptions {
  targetSize?: number;
  quality?: number;
  format?: SaveFormat;
}

/**
 * Calculate aspect ratio of an image
 */
const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
};

/**
 * Determine if image needs preprocessing
 */
const needsPreprocessing = (width: number, height: number, targetSize: number = 1024): boolean => {
  const aspectRatio = calculateAspectRatio(width, height);
  const isSquare = Math.abs(aspectRatio - 1) < 0.01; // Allow 1% tolerance
  const isCorrectSize = width === targetSize && height === targetSize;
  
  return !(isSquare && isCorrectSize);
};

/**
 * Crop image to square (1:1 aspect ratio) centered
 * This ensures maximum compatibility with AI models
 */
export const cropToSquare = async (
  imageUri: string,
  options: PreprocessOptions = {}
): Promise<string> => {
  const {
    targetSize = 1024,
    quality = 0.8,
    format = SaveFormat.JPEG,
  } = options;

  try {
    console.log('🖼️ Preprocessing image to square...');
    console.log('📂 Input URI:', imageUri);
    
    // Use Image.getSize to get dimensions (more reliable)
    const { Image } = require('react-native');
    
    // Get original image dimensions using a promise wrapper
    const getImageSize = (uri: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve, reject) => {
        Image.getSize(
          uri,
          (width: number, height: number) => resolve({ width, height }),
          (error: any) => reject(error)
        );
      });
    };

    const { width, height } = await getImageSize(imageUri);
    console.log(`📏 Original dimensions: ${width}x${height}`);

    // Calculate crop dimensions to center the image
    const minDimension = Math.min(width, height);
    const originX = Math.floor((width - minDimension) / 2);
    const originY = Math.floor((height - minDimension) / 2);

    console.log(`✂️ Cropping to square: ${minDimension}x${minDimension} at (${originX}, ${originY})`);

    // Crop to square and resize
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX,
            originY,
            width: minDimension,
            height: minDimension,
          },
        },
        {
          resize: {
            width: targetSize,
            height: targetSize,
          },
        },
      ],
      {
        compress: quality,
        format,
      }
    );

    console.log(`✅ Image preprocessed to ${targetSize}x${targetSize}`);
    console.log(`📦 Processed URI: ${result.uri}`);
    console.log(`📐 Result dimensions: ${result.width}x${result.height}`);

    return result.uri;
  } catch (error) {
    console.error('❌ Error preprocessing image:', error);
    // Return original URI if preprocessing fails
    return imageUri;
  }
};

/**
 * Preprocess image for virtual try-on
 * Main function to use before uploading to Supabase
 */
export const preprocessForVirtualTryOn = async (
  imageUri: string
): Promise<string> => {
  console.log('🔄 Starting virtual try-on preprocessing...');
  console.log('📥 Input image URI:', imageUri);
  
  const processedUri = await cropToSquare(imageUri, {
    targetSize: 1024,  // Optimal size for AI processing
    quality: 0.8,      // Good balance between quality and file size
    format: SaveFormat.JPEG, // Smaller file size than PNG
  });

  console.log('📤 Output image URI:', processedUri);
  console.log('✅ Preprocessing complete!');
  
  return processedUri;
};

/**
 * Batch preprocess multiple images
 * Useful for processing both user and outfit images together
 */
export const preprocessImages = async (
  imageUris: string[]
): Promise<string[]> => {
  console.log(`🔄 Preprocessing ${imageUris.length} images...`);
  
  const processedImages = await Promise.all(
    imageUris.map(uri => preprocessForVirtualTryOn(uri))
  );

  console.log('✅ All images preprocessed successfully');
  return processedImages;
};

/**
 * Get image info without processing
 * Useful for debugging and logging
 */
export const getImageInfo = async (imageUri: string): Promise<ImageInfo> => {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [],
    { compress: 1 }
  );

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
};
