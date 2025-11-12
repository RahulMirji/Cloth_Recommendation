import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { Paths } from 'expo-file-system/next';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Download, Share2, RefreshCw } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function VirtualTryOnResultScreen() {
  const { imageUrl } = useLocalSearchParams<{ imageUrl: string }>();
  const router = useRouter();
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const [saving, setSaving] = useState(false);

  const saveToGallery = async () => {
    try {
      setSaving(true);

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to save images.');
        return;
      }

      // Download image
      const filename = `tryon_${Date.now()}.png`;
      const downloadPath = `${Paths.document?.uri || Paths.cache?.uri}/${filename}`;
      
      const downloadResult = await FileSystem.downloadAsync(imageUrl, downloadPath);

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Alert.alert('Success', 'Image saved to gallery!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save image: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const shareImage = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device.');
        return;
      }

      // Download image first
      const filename = `tryon_${Date.now()}.png`;
      const downloadPath = `${Paths.document?.uri || Paths.cache?.uri}/${filename}`;
      
      await FileSystem.downloadAsync(imageUrl, downloadPath);

      await Sharing.shareAsync(downloadPath, {
        mimeType: 'image/png',
        dialogTitle: 'Share your virtual try-on',
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share image: ' + error.message);
    }
  };

  const handleRetry = () => {
    router.back();
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.backButton, isDarkMode && styles.backButtonDark]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={isDarkMode ? Colors.white : Colors.text} strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Your Virtual Try-On</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>✨ AI Generated Result</Text>
      </View>

      {/* Image Container */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <View style={[styles.imageCard, isDarkMode && styles.imageCardDark]}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.resultImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>No image available</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, styles.saveButton]}
          onPress={saveToGallery}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Download size={20} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.buttonText}>Save to Gallery</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.secondaryButtonRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]}
            onPress={shareImage}
            activeOpacity={0.8}
          >
            <Share2 size={20} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.secondaryButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]}
            onPress={handleRetry}
            activeOpacity={0.8}
          >
            <RefreshCw size={20} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.secondaryButtonText}>Try Another</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonDark: {
    backgroundColor: '#1E293B',
  },
  titleContainer: {
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#94A3B8',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  imageCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  imageCardDark: {
    backgroundColor: '#1E293B',
    shadowOpacity: 0.3,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorTextDark: {
    color: '#94A3B8',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButton: {
    backgroundColor: '#22C55E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
