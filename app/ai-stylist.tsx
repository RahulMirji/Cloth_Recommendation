import { Audio } from 'expo-av';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { Mic, MicOff, X, RotateCw, Volume2, Square, Power } from 'lucide-react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { generateTextWithImage, convertImageToBase64 } from '@/utils/pollinationsAI';
import { SpeechToTextService, generateSpeakBackAudio, fallbackSpeechToText } from '@/utils/audioUtils';
import { ChatMessage, ChatSession, generateChatSummary, saveChatSession, generateSessionId, createChatMessage } from '@/utils/chatUtils';
import { supabase } from '@/lib/supabase';

export default function AIStylistScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isRecordingUnloaded, setIsRecordingUnloaded] = useState<boolean>(false);
  const [isConversationActive, setIsConversationActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [speechService] = useState(() => SpeechToTextService.getInstance());
  const cameraRef = useRef<CameraView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentSessionRef = useRef<ChatSession | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  // Toggle this to false if you don't want the microphone to auto-start after
  // the assistant audio finishes playing. For the requested behavior we keep
  // auto-listen OFF so the assistant won't start speaking or listening again
  // automatically.
  const AUTO_LISTEN_AFTER_AUDIO = false;

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(err => console.log('Error unloading sound:', err));
      }
      if (recording && !isRecordingUnloaded) {
        recording.stopAndUnloadAsync().catch(err => console.log('Error unloading recording:', err));
      }
      if (speechService.isCurrentlyListening()) {
        speechService.stopListening();
      }
    };
  }, [sound, recording, isRecordingUnloaded, speechService]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const startNewConversation = useCallback(async () => {
    // Create new chat session but do NOT speak. We'll wait for the user to
    // speak, transcribe, capture an image, then send both text+image to the
    // model.
    const sessionId = generateSessionId();
    currentSessionRef.current = {
      id: sessionId,
      messages: [],
      imageBase64: undefined,
      createdAt: new Date().toISOString(),
    };

    setMessages([]);
    setIsConversationActive(true);
  }, [capturedImage]);

  const captureCurrentImage = useCallback(async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        
        if (photo.base64) {
          setCapturedImage(`data:image/jpeg;base64,${photo.base64}`);
          return photo.base64;
        }
      }
      return null;
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image from camera');
      return null;
    }
  }, []);

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

  const startSpeechRecognition = useCallback(async () => {
    try {
      if (!isConversationActive) {
        // Start a session but don't generate any assistant speech yet.
        await startNewConversation();
        // continue to listening flow (do not return)
      }

      setIsListening(true);
      startPulse();
      
      const userMessage = createChatMessage('user', 'Speaking...');
      setMessages(prev => [...prev, userMessage]);

      await speechService.startListening(
        async (result) => {
          if (result.isFinal) {
            setIsListening(false);
            stopPulse();

            // Update the message with transcribed text
            const userTextMessage = createChatMessage('user', result.text);
            setMessages(prev => [...prev.slice(0, -1), userTextMessage]);

            // Add to session
            if (currentSessionRef.current) {
              currentSessionRef.current.messages.push(userTextMessage);
            }

            // Capture an image from the camera now that we have the user's
            // final utterance, then send text+image to the model.
            try {
              const imgBase64 = await captureCurrentImage();
              if (imgBase64 && currentSessionRef.current) {
                currentSessionRef.current.imageBase64 = `data:image/jpeg;base64,${imgBase64}`;
              }
            } catch (err) {
              console.warn('Image capture failed before sending to model:', err);
            }

            // Get AI response with image and voice (this will request the TTS audio and play it)
            await getAIResponseWithImageAndVoice(result.text);
          } else {
            // Update interim result
            setMessages(prev => [
              ...prev.slice(0, -1),
              createChatMessage('user', `${result.text}...`)
            ]);
          }
        },
        async (error) => {
          console.error('Speech recognition error:', error);
          setIsListening(false);
          stopPulse();
          Alert.alert('Speech Recognition Error', 'Please try speaking again or use fallback mode.');
          
          // Fallback to manual text input  
          const fallbackText = await fallbackSpeechToText();
          setMessages(prev => [
            ...prev.slice(0, -1),
            createChatMessage('user', fallbackText)
          ]);
          getAIResponseWithImageAndVoice(fallbackText);
        },
        { continuous: false }
      );
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      stopPulse();
      Alert.alert('Error', 'Failed to start speech recognition. Please try again.');
    }
  }, [isConversationActive, speechService, startNewConversation, capturedImage]);

  const stopSpeechRecognition = useCallback(() => {
    speechService.stopListening();
    setIsListening(false);
    stopPulse();
  }, [speechService]);

  const handleVoicePress = useCallback(() => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  }, [isListening, startSpeechRecognition, stopSpeechRecognition]);

  const getAIResponseWithImageAndVoice = useCallback(async (voiceText: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Generating AI response with image and voice...');
      
      // Prepare conversation context
      const conversationHistory = messages.map(msg => 
        `${msg.role}: ${msg.text}`
      ).join('\n');
      
      const imageBase64 = capturedImage || currentSessionRef.current?.imageBase64;
      
      const systemPrompt = `You are a professional fashion stylist AI assistant. The user is having a conversation with you about their outfit. You can see them through the camera.

${imageBase64 ? 'You have access to an image of their current outfit.' : 'The user has not yet shared an image of their outfit.'}

Conversation history:
${conversationHistory}

Latest user message: "${voiceText}"

Provide helpful, friendly, and specific fashion advice based on:
- Their current question or concern
- Any outfit image you can see
- The conversation context
- Color coordination and style suggestions
- Fit and proportions advice
- Accessory recommendations

Keep responses conversational and natural, as if you're talking to them in person. Be encouraging and constructive.`;

      let response: string;
      
      if (imageBase64) {
        // Use vision model with image
        response = await generateTextWithImage(imageBase64, systemPrompt);
      } else {
        // Use text-only model if not enough for structured call
        // For now, we'll proceed without the formal generateText call
        // and use generateTextWithImage with a dummy image
        response = await generateTextWithImage(
          'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // 1x1 transparent gif
          systemPrompt
        );
      }

      if (response) {
        const assistantMessage = createChatMessage('assistant', response);
        
        // Add to current session
        if (currentSessionRef.current) {
          currentSessionRef.current.messages.push(assistantMessage);
        }
        
        setMessages(prev => [
          ...prev.slice(0, -1),
          assistantMessage,
          createChatMessage('assistant', '') // Placeholder for audio message
        ]);

        // Generate audio using the new curl endpoint
        try {
          console.log('Generating speak-back audio...');
          console.log('Assistant will speak:', response);
          const audioResponse = await generateSpeakBackAudio(response);
          
          // Update the message with audio info
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...assistantMessage,
              audioUri: audioResponse.uri
            };
            return newMessages;
          });
          
          await playAudio(audioResponse.uri);

          // Optionally re-enable microphone after audio finishes
          if (AUTO_LISTEN_AFTER_AUDIO) {
            setTimeout(() => {
              if (isConversationActive && !isListening) {
                startSpeechRecognition();
              }
            }, 1000);
          }
          
        } catch (audioError) {
          console.error('Failed to generate audio:', audioError);
          // Still show text response even if audio fails
          setMessages(prev => prev.slice(0, -1).concat(assistantMessage));
          
          // Re-enable microphone only if configured
          if (AUTO_LISTEN_AFTER_AUDIO) {
            setTimeout(() => {
              if (isConversationActive && !isListening) {
                startSpeechRecognition();
              }
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = createChatMessage('assistant', 'Sorry, I had trouble understanding. Please try speaking again.');
      
      if (currentSessionRef.current) {
        currentSessionRef.current.messages.push(errorMessage);
      }
      
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      
      // Re-enable microphone only if configured
      if (AUTO_LISTEN_AFTER_AUDIO) {
        setTimeout(() => {
          if (isConversationActive && !isListening) {
            startSpeechRecognition();
          }
        }, 1000);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [messages, capturedImage, isConversationActive, isListening, startSpeechRecognition]);

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

  const quitConversation = useCallback(async () => {
    try {
      // Stop any ongoing speech recognition
      if (speechService.isCurrentlyListening()) {
        speechService.stopListening();
      }
      
      setIsConversationActive(false);
      setIsListening(false);
      stopPulse();

      // Generate and save chat summary
      if (currentSessionRef.current && currentSessionRef.current.messages.length > 0) {
        Alert.alert(
          'Saving Conversation',
          'Creating summary and saving to history...',
          [{ text: 'OK', style: 'default' }],
          { cancelable: false }
        );

        try {
          const summary = await generateChatSummary(currentSessionRef.current);
          console.log('Chat summary generated:', summary);

          // Get current user (you might need to adjust this based on your auth setup)
          const { data: { user } } = await supabase.auth.getUser();
          const userId = user?.id;

          // Save to Supabase
          await saveChatSession(
            {
              ...currentSessionRef.current,
              messages: currentSessionRef.current.messages,
              imageBase64: currentSessionRef.current.imageBase64,
              createdAt: currentSessionRef.current.createdAt
            },
            userId || undefined
          );

          Alert.alert(
            'Conversation Saved!',
            `Your chat session has been saved successfully.\n\nSummary:\n${summary.substring(0, 200)}...`,
            [
              {
                text: 'OK',
                onPress: () => {
                  // Reset everything
                  setMessages([]);
                  setCapturedImage(null);
                  currentSessionRef.current = null;
                  router.back();
                }
              }
            ]
          );
        } catch (error) {
          console.error('Error saving conversation:', error);
          Alert.alert(
            'Error Saving',
            'Failed to save conversation. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // No conversation to save
        setMessages([]);
        setCapturedImage(null);
        currentSessionRef.current = null;
        router.back();
      }
    } catch (error) {
      console.error('Error quitting conversation:', error);
      Alert.alert('Error', 'Failed to quit conversation properly.');
      router.back();
    }
  }, [speechService]);

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
      
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />

        {/* Overlay rendered as absolutely positioned sibling so CameraView has no children */}
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <X size={28} color={Colors.white} />
            </TouchableOpacity>
            
            <View style={styles.topCenter}>
              <Text style={styles.cameraLabel}>AI Stylist</Text>
              {isConversationActive && (
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                  <Text style={styles.statusText}>Live Chat</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <RotateCw size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          
          {isConversationActive && (
            <View style={styles.quitButtonContainer}>
              <TouchableOpacity
                style={styles.quitButton}
                onPress={quitConversation}
              >
                <Power size={20} color={Colors.white} />
                <Text style={styles.quitButtonText}>Quit Chat</Text>
              </TouchableOpacity>
            </View>
          )}

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
                    !isConversationActive && styles.micButtonInactive,
                  ]}
                  onPress={handleVoicePress}
                  activeOpacity={0.8}
                >
                  {isListening ? (
                    <MicOff size={32} color={Colors.white} />
                  ) : isConversationActive ? (
                    <Mic size={32} color={Colors.white} />
                  ) : (
                    <Square size={32} color={Colors.white} />
                  )}
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.micLabel}>
                {isListening 
                  ? 'Speak now...' 
                  : isConversationActive 
                    ? 'Tap to speak' 
                    : 'Tap to start chat'
                }
              </Text>
              {!isConversationActive && (
                <Text style={styles.startHint}>
                  Start a conversation with your AI stylist
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topCenter: {
    alignItems: 'center',
  },
  cameraLabel: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    opacity: 0.9,
  },
  quitButtonContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  quitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  quitButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600' as const,
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
    // web-friendly shadow
    ...(Platform.OS === 'web' ? { boxShadow: '0px 4px 8px rgba(0,0,0,0.3)' } : {}),
  },
  micButtonActive: {
    backgroundColor: Colors.error,
  },
  micButtonInactive: {
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },
  startHint: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  micLabel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
    textShadowColor: Colors.black,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    ...(Platform.OS === 'web' ? { textShadow: `0px 1px 4px ${Colors.black}` } : {}),
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
