import { Audio } from 'expo-av';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { Mic, MicOff, X, RotateCw, Volume2 } from 'lucide-react-native';
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/colors';
import { generateText, generateAudioResponse } from '@/utils/pollinationsAI';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  audioUri?: string;
}

export default function AIStylistScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isRecordingUnloaded, setIsRecordingUnloaded] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(err => console.log('Error unloading sound:', err));
      }
      if (recording && !isRecordingUnloaded) {
        recording.stopAndUnloadAsync().catch(err => console.log('Error unloading recording:', err));
      }
    };
  }, [sound, recording, isRecordingUnloaded]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const startRecording = async () => {
    try {
      console.log('Requesting audio permissions...');
      const permission = await Audio.requestPermissionsAsync();
      
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please grant microphone permission to use voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecordingUnloaded(false);
      setIsListening(true);
      startPulse();
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording || isRecordingUnloaded) return;

    try {
      console.log('Stopping recording...');
      setIsListening(false);
      stopPulse();
      
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      await recording.stopAndUnloadAsync();
      setIsRecordingUnloaded(true);
      setRecording(null);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      console.log('Recording stopped');

      if (uri) {
        setMessages((prev) => [...prev, { role: 'user', text: 'Analyzing your outfit...' }]);
        await getAIResponse();
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setIsRecordingUnloaded(true);
      setRecording(null);
      Alert.alert('Error', 'Failed to process recording.');
    }
  };

  const handleVoicePress = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getAIResponse = async () => {
    setIsProcessing(true);
    
    try {
      console.log('Generating AI response...');
      const response = await generateText({
        messages: [
          {
            role: 'user',
            content: `You are a professional fashion stylist AI assistant. The user is showing you their outfit through the camera. Provide helpful, friendly, and specific fashion advice. Keep your response concise (2-3 sentences). Focus on:
- Color coordination
- Fit and proportions
- Style suggestions
- Accessory recommendations

Provide a natural, conversational response as if you're looking at their outfit right now.`,
          },
        ],
        stream: true,
      });

      console.log('AI Response:', response);

      if (response) {
        let audioUri: string | undefined;
        
        try {
          console.log('Generating audio response...');
          audioUri = await generateAudioResponse({ text: response });
          console.log('Audio generated:', audioUri);
        } catch (audioError) {
          console.error('Failed to generate audio:', audioError);
        }

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'assistant', text: response, audioUri },
        ]);

        if (audioUri) {
          await playAudio(audioUri);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { 
          role: 'assistant', 
          text: 'Sorry, I had trouble analyzing your outfit. Please try again.' 
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = async (uri: string) => {
    try {
      console.log('Playing audio:', uri);
      setIsPlayingAudio(true);
      
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (err) {
          console.log('Sound already unloaded:', err);
        }
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        Platform.OS === 'web' ? { uri } : { uri },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });

      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          We need your permission to access the camera for real-time outfit analysis
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={28} color={Colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <RotateCw size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSection}>
            {messages.length > 0 && (
              <View style={styles.messagesContainer}>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                >
                  {messages.slice(-3).map((msg, index) => (
                    <View
                      key={index}
                      style={[
                        styles.messageBubble,
                        msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      <View style={styles.messageContent}>
                        <Text
                          style={[
                            styles.messageText,
                            msg.role === 'user' ? styles.userText : styles.assistantText,
                          ]}
                        >
                          {msg.text}
                        </Text>
                      </View>
                      {msg.audioUri && msg.role === 'assistant' && (
                        <TouchableOpacity
                          style={styles.audioButton}
                          onPress={() => playAudio(msg.audioUri!)}
                          disabled={isPlayingAudio}
                        >
                          <Volume2 size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {isProcessing && (
                    <View style={[styles.messageBubble, styles.assistantBubble]}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                  )}
                </ScrollView>
              </View>
            )}

            <View style={[styles.controls, { paddingBottom: insets.bottom + 20 }]}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isListening && styles.micButtonActive,
                  ]}
                  onPress={handleVoicePress}
                  activeOpacity={0.8}
                >
                  {isListening ? (
                    <MicOff size={32} color={Colors.white} />
                  ) : (
                    <Mic size={32} color={Colors.white} />
                  )}
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.micLabel}>
                {isListening ? 'Tap to stop' : 'Tap to speak'}
              </Text>
            </View>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  messagesContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  messagesList: {
    paddingHorizontal: 20,
  },
  messagesContent: {
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'column',
  },
  messageContent: {
    flex: 1,
  },
  audioButton: {
    padding: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: Colors.white,
  },
  assistantText: {
    color: Colors.text,
  },
  controls: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micButtonActive: {
    backgroundColor: Colors.error,
  },
  micLabel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
    textShadowColor: Colors.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
