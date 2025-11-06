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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

export default function VirtualTryOnResultScreen() {
  const { imageUrl } = useLocalSearchParams<{ imageUrl: string }>();
  const router = useRouter();
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
      const downloadPath = `${FileSystem.documentDirectory}${filename}`;
      
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
      const downloadPath = `${FileSystem.documentDirectory}${filename}`;
      
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Virtual Try-On</Text>
      </View>

      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.resultImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No image available</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={saveToGallery}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>💾 Save to Gallery</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={shareImage}
        >
          <Text style={styles.buttonText}>📤 Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={handleRetry}
        >
          <Text style={styles.buttonText}>🔄 Try Another</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  shareButton: {
    backgroundColor: '#007AFF',
  },
  retryButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
