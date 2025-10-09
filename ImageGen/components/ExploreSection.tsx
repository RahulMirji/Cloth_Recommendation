/**
 * Explore Section Component
 * 
 * AI Image Generator - allows users to generate custom images
 * using text prompts with Pollinations API.
 * 
 * Features:
 * - Text input for custom prompts
 * - AI image generation with Pollinations API
 * - Download generated images
 * - Loading animations
 * - Dark mode support
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  useColorScheme,
  ActivityIndicator,
  Animated,
  TextInput,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Download, Wand2 } from 'lucide-react-native';
import { Paths, File } from 'expo-file-system';

import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';
import { showCustomAlert } from '@/utils/customAlert';

export function ExploreSection() {
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  /**
   * Generate image from user prompt
   */
  const generateImage = async () => {
    if (!prompt.trim()) {
      showCustomAlert('warning', 'Empty Prompt', 'Please enter a description for the image you want to generate.');
      return;
    }

    setLoading(true);
    setGeneratedImageUrl(null);

    try {
      // Encode prompt for URL
      const encodedPrompt = encodeURIComponent(prompt.trim());
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;
      
      // Set the image URL
      setGeneratedImageUrl(imageUrl);

      // Animate image appearance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Error generating image:', error);
      showCustomAlert('error', 'Error', 'Failed to generate image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download generated image to device
   */
  const downloadImage = async () => {
    if (!generatedImageUrl) return;

    try {
      // For web, open in new tab
      if (Platform.OS === 'web') {
        Linking.openURL(generatedImageUrl);
        showCustomAlert('success', '✨ Success!', 'Image opened in new tab. Right-click to save.');
        return;
      }

      // For mobile, download directly using File.downloadFileAsync
      showCustomAlert('info', '⏳ Downloading...', 'Please wait while we save your image.');

      // Create filename with timestamp
      const fileName = `ai-image-${Date.now()}.png`;
      
      // Use File.downloadFileAsync to download directly to cache directory
      const downloadedFile = await File.downloadFileAsync(
        generatedImageUrl,
        new File(Paths.cache, fileName),
        { idempotent: true }
      );

      showCustomAlert(
        'success',
        '🎉 Image Saved Successfully!',
        `Your AI-generated image has been saved to your device.\n\nLocation: ${downloadedFile.uri}\n\nYou can find it in your device's file manager under the app's cache folder.`,
        [
          { text: 'OK', style: 'default' },
          {
            text: '🌐 View in Browser',
            onPress: () => Linking.openURL(generatedImageUrl),
            style: 'default'
          }
        ]
      );

    } catch (error: any) {
      console.error('Error downloading image:', error);
      
      // Fallback: open the URL in browser
      showCustomAlert(
        'warning',
        '⚠️ Alternative Method',
        'Direct download failed. Would you like to open in browser instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: '🌐 Open in Browser', 
            onPress: () => Linking.openURL(generatedImageUrl),
            style: 'default'
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleRow}>
          <Wand2 size={28} color={isDarkMode ? Colors.primary : Colors.primary} strokeWidth={2} />
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>
            AI Image Generator
          </Text>
        </View>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Describe any image and watch AI bring it to life
        </Text>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="e.g., Generate me an image of Mickey Mouse"
            placeholderTextColor={isDarkMode ? Colors.textLight : Colors.textSecondary}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={generateImage}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? [Colors.border, Colors.border] : [Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Generating...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color={Colors.white} strokeWidth={2.5} />
                <Text style={styles.buttonText}>Generate Image</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Generated Image Section */}
      {loading && (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[Colors.gradient.start, Colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color={Colors.white} />
            <Text style={styles.loadingText}>Creating your masterpiece...</Text>
          </LinearGradient>
        </View>
      )}

      {generatedImageUrl && !loading && (
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.imageCard, isDarkMode && styles.imageCardDark]}>
            <Image
              source={{ uri: generatedImageUrl }}
              style={styles.generatedImage}
              resizeMode="cover"
            />
            
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={downloadImage}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.success, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.downloadButtonGradient}
              >
                <Download size={20} color={Colors.white} strokeWidth={2.5} />
                <Text style={styles.downloadButtonText}>
                  {Platform.OS === 'android' ? 'Share/Download' : 'Download'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {Platform.OS === 'android' && (
              <View style={styles.infoBox}>
                <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                  💡 Tap to open in browser and long-press to save
                </Text>
              </View>
            )}
          </View>

          {prompt && (
            <View style={[styles.promptDisplay, isDarkMode && styles.promptDisplayDark]}>
              <Text style={[styles.promptLabel, isDarkMode && styles.promptLabelDark]}>
                Your Prompt:
              </Text>
              <Text style={[styles.promptText, isDarkMode && styles.promptTextDark]}>
                "{prompt}"
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Example prompts */}
      {!generatedImageUrl && !loading && (
        <View style={styles.examplesContainer}>
          <Text style={[styles.examplesTitle, isDarkMode && styles.examplesTitleDark]}>
            Try these examples:
          </Text>
          <View style={styles.exampleChips}>
            {[
              'A futuristic city at sunset',
              'Cute cartoon cat wearing glasses',
              'Magical forest with glowing mushrooms',
            ].map((example, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.exampleChip, isDarkMode && styles.exampleChipDark]}
                onPress={() => setPrompt(example)}
                activeOpacity={0.7}
              >
                <Text style={[styles.exampleChipText, isDarkMode && styles.exampleChipTextDark]}>
                  {example}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginLeft: 12,
  },
  titleDark: {
    color: Colors.white,
  },
  subtitle: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  subtitleDark: {
    color: Colors.textLight,
  },
  
  // Input Section
  inputSection: {
    marginBottom: 24,
  },
  inputContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  inputContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  input: {
    fontSize: FontSizes.body,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDark: {
    color: Colors.white,
  },
  
  // Generate Button
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
    marginLeft: 8,
  },
  
  // Loading Container
  loadingContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loadingGradient: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.white,
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    marginTop: 16,
  },
  
  // Generated Image Section
  imageContainer: {
    marginBottom: 24,
  },
  imageCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginBottom: 16,
  },
  imageCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  generatedImage: {
    width: '100%',
    height: 400,
    backgroundColor: Colors.border,
  },
  
  // Download Button
  downloadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    margin: 16,
  },
  downloadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
    marginLeft: 8,
  },
  
  // Info Box
  infoBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  infoText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    textAlign: 'center',
  },
  infoTextDark: {
    color: Colors.primary,
  },
  
  // Prompt Display
  promptDisplay: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  promptDisplayDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptLabel: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.semibold,
    color: Colors.primary,
    marginBottom: 4,
  },
  promptLabelDark: {
    color: Colors.primary,
  },
  promptText: {
    fontSize: FontSizes.body,
    color: Colors.text,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  promptTextDark: {
    color: Colors.white,
  },
  
  // Examples Section
  examplesContainer: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: 12,
  },
  examplesTitleDark: {
    color: Colors.white,
  },
  exampleChips: {
    flexDirection: 'column',
    gap: 8,
  },
  exampleChip: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exampleChipDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  exampleChipText: {
    fontSize: FontSizes.body,
    color: Colors.textSecondary,
  },
  exampleChipTextDark: {
    color: Colors.textLight,
  },
});
