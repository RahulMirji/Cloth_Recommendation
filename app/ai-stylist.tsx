import { Audio } from 'expo-av';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import { Mic, MicOff, X, RotateCw, Volume2, Square, Power, Eye, EyeOff } from 'lucide-react-native';
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
import { SpeechToTextService, generateSpeakBackAudio, convertAudioToText } from '@/utils/audioUtils';
import { ChatMessage, ChatSession, generateChatSummary, saveChatSession, generateSessionId, createChatMessage } from '@/utils/chatUtils';
import { supabase } from '@/lib/supabase';
import { visionAPI } from '@/utils/visionAPI';
import { storageService } from '@/utils/storageService';

export default function AIStylistScreen() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [microphoneDisabled, setMicrophoneDisabled] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isRecordingUnloaded, setIsRecordingUnloaded] = useState<boolean>(false);
  const [isConversationActive, setIsConversationActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [useEnhancedVision, setUseEnhancedVision] = useState<boolean>(true);
  const [conversationContext, setConversationContext] = useState<string>('');
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
    // Initialize storage service for enhanced vision
    if (useEnhancedVision) {
      console.log('🔧 Initializing Enhanced Vision mode...');
      
      // Debug bucket information first
      storageService.debugBuckets().then(() => {
        // Then try to initialize
        storageService.initializeBucket().catch(error => {
          console.error('Failed to initialize storage bucket:', error);
          Alert.alert(
            'Storage Setup', 
            'Enhanced vision features may not work properly. Check console for bucket debug info.',
            [{ text: 'OK' }]
          );
          // Don't disable enhanced vision automatically - let user see the debug info
        });
      });
    }
  }, [useEnhancedVision]);

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

  const uploadImageAndGetURL = useCallback(async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: Platform.OS === 'web', // Need base64 for web platform
        });
        
        if (photo.uri) {
          console.log('Uploading image to Supabase...');
          
          let uploadResult;
          
          if (Platform.OS === 'web' && photo.base64) {
            // Web platform: convert base64 to blob URL for storage service
            const base64Data = photo.base64;
            console.log('Processing base64 data for web platform...');
            
            try {
              // Clean base64 data - remove any data URL prefix and whitespace
              const cleanBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '').replace(/\s/g, '');
              
              const byteCharacters = atob(cleanBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: 'image/jpeg' });
              const blobUrl = URL.createObjectURL(blob);
              
              uploadResult = await storageService.uploadCameraImage(blobUrl);
            } catch (base64Error) {
              console.error('Base64 processing error:', base64Error);
              console.log('Falling back to direct URI upload...');
              // Fallback: try using the URI directly
              uploadResult = await storageService.uploadCameraImage(photo.uri);
            }
          } else {
            // Mobile platform: use URI directly
            uploadResult = await storageService.uploadCameraImage(photo.uri);
          }
          
          if (uploadResult.success && uploadResult.publicUrl) {
            console.log('Image uploaded successfully:', uploadResult.publicUrl);
            return uploadResult.publicUrl;
          } else {
            console.error('Upload failed:', uploadResult.error);
            return null;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
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
      console.log('🎙️ Starting speech recognition...');
      console.log('🎙️ Browser:', navigator.userAgent);
      console.log('🎙️ HTTPS:', window.location.protocol === 'https:');
      console.log('🎙️ Speech Recognition available:', 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
      
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
          console.log('🎙️ Speech result:', result);
          if (result.isFinal) {
            console.log('🎙️ Final speech result:', result.text);
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
              if (useEnhancedVision) {
                // Use enhanced vision API with Supabase storage
                const imageUrl = await uploadImageAndGetURL();
                if (imageUrl && currentSessionRef.current) {
                  currentSessionRef.current.imageBase64 = imageUrl; // Store URL instead of base64
                }
              } else {
                // Use original base64 approach
                const imgBase64 = await captureCurrentImage();
                if (imgBase64 && currentSessionRef.current) {
                  currentSessionRef.current.imageBase64 = `data:image/jpeg;base64,${imgBase64}`;
                }
              }
            } catch (err) {
              console.warn('Image capture failed before sending to model:', err);
            }

            // Get AI response with image and voice (this will request the TTS audio and play it)
            await getAIResponseWithImageAndVoice(result.text);
          } else {
            console.log('🎙️ Interim speech result:', result.text);
            // Update interim result
            setMessages(prev => [
              ...prev.slice(0, -1),
              createChatMessage('user', `${result.text}...`)
            ]);
          }
        },
        async (error) => {
          console.error('🎙️ Speech recognition error:', error);
          console.error('🎙️ Error type:', (error as any).type || 'unknown');
          console.error('🎙️ Error message:', error.message || 'unknown');
          console.error('🎙️ Browser support check:');
          console.error('  - webkitSpeechRecognition:', 'webkitSpeechRecognition' in window);
          console.error('  - SpeechRecognition:', 'SpeechRecognition' in window);
          console.error('  - navigator.onLine:', navigator.onLine);
          console.error('  - location.protocol:', window.location.protocol);
          
          setIsListening(false);
          stopPulse();
          
          // Check if it's a network error that might be temporary
          if (error.message && error.message.includes('network')) {
            console.error('🎙️ Network error detected - offering retry');
            Alert.alert(
              'Network Error', 
              'Speech recognition failed due to network issues. Try the hold-to-speak feature instead (press and hold the microphone).',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Retry', onPress: () => setTimeout(() => startSpeechRecognition(), 500) }
              ]
            );
          } else {
            console.error('🎙️ Non-network error - showing general error');
            Alert.alert(
              'Speech Recognition Error', 
              'Voice recognition is not working properly. Please use the hold-to-speak feature instead (press and hold the microphone).',
              [{ text: 'OK' }]
            );
          }
          
          // Remove the fallback text input to avoid mock data
          setMessages(prev => prev.slice(0, -1)); // Remove the "Speaking..." message
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
    // For web platform, prefer hold-to-speak over speech recognition
    if (Platform.OS === 'web') {
      console.log('🎙️ Web platform: Use hold-to-speak instead of click-to-speak');
      Alert.alert(
        'Hold to Speak', 
        'On web, please press and HOLD the microphone button to record your voice.',
        [{ text: 'Got it!' }]
      );
      return;
    }
    
    // For mobile platforms, use speech recognition
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  }, [isListening, startSpeechRecognition, stopSpeechRecognition]);

  // Hold-to-speak functionality
  const startHoldToSpeak = useCallback(async () => {
    try {
      console.log('🎵 === STARTING HOLD-TO-SPEAK RECORDING ===');
      console.log('🎵 Platform:', Platform.OS);
      console.log('🎵 Conversation active:', isConversationActive);
      
      if (!isConversationActive) {
        console.log('🎵 Starting new conversation first...');
        await startNewConversation();
      }
      
      console.log('🎵 Setting recording state to true...');
      setIsRecording(true);
      
      const userMessage = createChatMessage('user', 'Recording...');
      setMessages(prev => [...prev, userMessage]);
      console.log('🎵 Added "Recording..." message to UI');
      
      // Request microphone permissions
      console.log('🎵 Requesting microphone permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('🎵 Permission status:', status);
      
      if (status !== 'granted') {
        console.error('🎵 ❌ Microphone permission denied');
        Alert.alert('Permission Required', 'Microphone permission is needed for voice input.');
        setIsRecording(false);
        setMessages(prev => prev.slice(0, -1));
        return;
      }
      
      console.log('🎵 ✅ Microphone permission granted');
      console.log('🎵 Creating audio recording...');
      
      // Configure audio recording with simplified options
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      console.log('🎵 ✅ Audio recording created successfully');
      console.log('🎵 Recording object:', newRecording);
      setRecording(newRecording);
      
    } catch (error) {
      console.error('🎵 ❌ Error starting recording:', error);
      console.error('🎵 Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setIsRecording(false);
      setMessages(prev => prev.slice(0, -1));
      Alert.alert('Recording Error', 'Failed to start voice recording. Please try again.');
    }
  }, [isConversationActive, startNewConversation]);
  
  const stopHoldToSpeak = useCallback(async () => {
    try {
      console.log('🎵 === STOPPING HOLD-TO-SPEAK RECORDING ===');
      console.log('🎵 Recording exists:', !!recording);
      console.log('🎵 Is recording state:', isRecording);
      
      if (!recording || !isRecording) {
        console.log('🎵 ⚠️ No recording to stop or not in recording state');
        return;
      }
      
      console.log('🎵 Setting recording state to false...');
      setIsRecording(false);
      
      console.log('🎵 Stopping and unloading recording...');
      await recording.stopAndUnloadAsync();
      
      console.log('🎵 Getting recording URI...');
      const uri = recording.getURI();
      console.log('🎵 Recording URI:', uri);
      console.log('🎵 URI type:', typeof uri);
      console.log('🎵 URI length:', uri ? uri.length : 0);
      
      setRecordingUri(uri);
      
      if (uri) {
        console.log('🎵 ✅ Recording URI obtained successfully');
        
        // Update message to show processing
        setMessages(prev => [
          ...prev.slice(0, -1),
          createChatMessage('user', 'Processing voice...')
        ]);
        console.log('🎵 Updated UI to show "Processing voice..."');
        
        // Convert audio to text
        try {
          console.log('🎵 === STARTING AUDIO-TO-TEXT CONVERSION ===');
          console.log('🎵 Audio URI for conversion:', uri);
          
          const voiceText = await convertAudioToText(uri);
          
          console.log('🎵 === AUDIO-TO-TEXT CONVERSION COMPLETE ===');
          console.log('🎵 Converted text:', voiceText);
          console.log('🎵 Text length:', voiceText.length);
          console.log('🎵 Text preview (first 100 chars):', voiceText.substring(0, 100));
          
          // Update message with transcribed text
          const userTextMessage = createChatMessage('user', voiceText);
          setMessages(prev => [...prev.slice(0, -1), userTextMessage]);
          console.log('🎵 Updated UI with transcribed text');
          
          // Add to session
          if (currentSessionRef.current) {
            currentSessionRef.current.messages.push(userTextMessage);
            console.log('🎵 Added message to session');
          }
          
          // Capture image and get AI response
          console.log('🎵 === STARTING IMAGE CAPTURE ===');
          try {
            if (useEnhancedVision) {
              console.log('🎵 Using enhanced vision - uploading image...');
              const imageUrl = await uploadImageAndGetURL();
              console.log('🎵 Image upload result:', imageUrl);
              
              if (imageUrl && currentSessionRef.current) {
                currentSessionRef.current.imageBase64 = imageUrl;
                console.log('🎵 Stored image URL in session');
              }
            } else {
              console.log('🎵 Using basic vision - capturing base64 image...');
              const imgBase64 = await captureCurrentImage();
              console.log('🎵 Base64 image length:', imgBase64 ? imgBase64.length : 0);
              
              if (imgBase64 && currentSessionRef.current) {
                currentSessionRef.current.imageBase64 = `data:image/jpeg;base64,${imgBase64}`;
                console.log('🎵 Stored base64 image in session');
              }
            }
          } catch (err) {
            console.warn('🎵 ⚠️ Image capture failed:', err);
          }
          
          console.log('🎵 === STARTING AI RESPONSE GENERATION ===');
          console.log('🎵 Voice text for AI:', voiceText);
          await getAIResponseWithImageAndVoice(voiceText);
          console.log('🎵 AI response generation initiated');
          
        } catch (transcriptionError) {
          console.error('🎵 ❌ Voice transcription failed:', transcriptionError);
          console.error('🎵 Transcription error details:', {
            message: transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError),
            stack: transcriptionError instanceof Error ? transcriptionError.stack : 'No stack trace'
          });
          
          setMessages(prev => [
            ...prev.slice(0, -1),
            createChatMessage('user', 'Voice input (transcription failed)')
          ]);
          Alert.alert('Transcription Error', 'Could not convert voice to text. Please try again.');
        }
      } else {
        console.error('🎵 ❌ No recording URI obtained');
        Alert.alert('Recording Error', 'No audio was recorded. Please try again.');
      }
      
      console.log('🎵 Cleaning up recording...');
      setRecording(null);
      
    } catch (error) {
      console.error('🎵 ❌ Error stopping recording:', error);
      console.error('🎵 Stop recording error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      setIsRecording(false);
      setRecording(null);
      Alert.alert('Recording Error', 'Failed to process voice recording.');
    }
  }, [recording, isRecording, useEnhancedVision, uploadImageAndGetURL, captureCurrentImage, currentSessionRef]);
  


  const getAIResponseWithImageAndVoice = useCallback(async (voiceText: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Generating AI response with image and voice...');
      
      // Prepare conversation context
      const conversationHistory = messages.map(msg => 
        `${msg.role}: ${msg.text}`
      ).join('\n');
      
      // Update conversation context for continuous chat
      setConversationContext(conversationHistory);
      
      const imageReference = capturedImage || currentSessionRef.current?.imageBase64;
      
      let response: string;
      
      console.log('🔍 Image reference check:', {
        useEnhancedVision,
        hasImageReference: !!imageReference,
        imageReferenceType: imageReference ? (imageReference.startsWith('data:') ? 'base64' : 'url') : 'none',
        imageReferencePreview: imageReference ? imageReference.substring(0, 50) + '...' : 'none'
      });
      
      if (useEnhancedVision && imageReference && !imageReference.startsWith('data:')) {
        // Use enhanced vision API with uploaded image URL
        console.log('🚀 Using enhanced vision API with image URL:', imageReference.substring(0, 50) + '...');
        try {
          response = await visionAPI.continuousVisionChat(
            imageReference,
            voiceText,
            conversationHistory
          );
        } catch (visionError) {
          console.error('❌ Enhanced vision API failed:', visionError);
          throw visionError; // Don't fallback to broken API
        }
      } else if (useEnhancedVision && !imageReference) {
        // Enhanced vision mode but no image captured yet - force capture
        console.log('📸 Enhanced vision mode: capturing image now...');
        const imageUrl = await uploadImageAndGetURL();
        if (imageUrl) {
          console.log('🚀 Using enhanced vision API with newly captured image');
          response = await visionAPI.continuousVisionChat(
            imageUrl,
            voiceText,
            conversationHistory
          );
          // Store for future use
          if (currentSessionRef.current) {
            currentSessionRef.current.imageBase64 = imageUrl;
          }
        } else {
          throw new Error('Failed to capture image for enhanced vision mode');
        }
      } else if (imageReference && imageReference.startsWith('data:')) {
        // Use original vision model with base64 image (Basic Vision mode)
        console.log('👁️ Using basic vision API with base64 image');
        const systemPrompt = `You are a professional fashion stylist AI assistant. The user is having a conversation with you about their outfit. You can see them through the camera.

${imageReference ? 'You have access to an image of their current outfit.' : 'The user has not yet shared an image of their outfit.'}

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
        
        response = await generateTextWithImage(imageReference, systemPrompt);
      } else {
        // This should rarely happen now
        console.log('⚠️ No vision mode available - this shouldn\'t happen');
        throw new Error('No valid vision mode available. Please enable Enhanced Vision or capture an image.');
      }

      if (response) {
        console.log('📝 Vision API Response received:', response.substring(0, 100) + '...');
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
          console.log('🎵 Starting TTS process...');
          console.log('🎵 Response length:', response.length, 'characters');
          console.log('🎵 First 200 chars:', response.substring(0, 200));
          console.log('🎵 Calling generateSpeakBackAudio...');
          
          const audioResponse = await generateSpeakBackAudio(response);
          
          console.log('🎵 TTS Response received:', audioResponse);
          console.log('🎵 Audio URI:', audioResponse?.uri);
          console.log('🎵 Audio URI type:', typeof audioResponse?.uri);
          
          if (!audioResponse || !audioResponse.uri) {
            throw new Error('No audio URI received from TTS service');
          }
          
          // Update the message with audio info
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...assistantMessage,
              audioUri: audioResponse.uri
            };
            return newMessages;
          });
          
          console.log('🔊 About to play audio:', audioResponse.uri);
          
          // Disable microphone during audio playback
          setMicrophoneDisabled(true);
          
          await playAudio(audioResponse.uri);
          console.log('🔊 Audio playback initiated');
          
          // Audio playback completion will be handled in playAudio function

          // Optionally re-enable microphone after audio finishes
          if (AUTO_LISTEN_AFTER_AUDIO) {
            setTimeout(() => {
              if (isConversationActive && !isListening) {
                startSpeechRecognition();
              }
            }, 1000);
          }
        } catch (audioError) {
          console.error('❌ TTS Generation failed:', audioError);
          console.error('❌ Error type:', typeof audioError);
          console.error('❌ Error message:', audioError instanceof Error ? audioError.message : String(audioError));
          console.error('❌ Full error object:', audioError);
          
          // Still show text response even if audio fails
          setMessages(prev => prev.slice(0, -1).concat(assistantMessage));
          
          // ... existing code ...
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

      console.log('Creating audio object for platform:', Platform.OS);
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false }
      );
      
      setSound(newSound);
      
      newSound.setOnPlaybackStatusUpdate((status) => {
        console.log('Audio playback status:', status);
        if (status.isLoaded && status.didJustFinish) {
          console.log('Audio finished playing - re-enabling microphone');
          setIsPlayingAudio(false);
          setMicrophoneDisabled(false); // Re-enable microphone when audio finishes
        }
      });

      console.log('Starting audio playback...');
      await newSound.playAsync();
      console.log('Audio playback started successfully');
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
      setMicrophoneDisabled(false); // Re-enable microphone if audio fails
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
              <TouchableOpacity 
                style={styles.visionToggle}
                onPress={() => setUseEnhancedVision(!useEnhancedVision)}
              >
                {useEnhancedVision ? (
                  <Eye size={16} color={Colors.white} />
                ) : (
                  <EyeOff size={16} color={Colors.white} />
                )}
                <Text style={styles.visionToggleText}>
                  {useEnhancedVision ? 'Enhanced Vision' : 'Basic Vision'}
                </Text>
              </TouchableOpacity>
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

            <View style={styles.controls}>
              
              <View style={{ paddingBottom: insets.bottom + 20 }}>
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.micButton,
                      isListening && styles.micButtonActive,
                      isRecording && styles.micButtonActive,
                      !isConversationActive && styles.micButtonInactive,
                      (microphoneDisabled || isPlayingAudio) && isConversationActive && styles.micButtonDisabled,
                    ]}
                    onPress={handleVoicePress}
                    onPressIn={startHoldToSpeak}
                    onPressOut={stopHoldToSpeak}
                    disabled={microphoneDisabled || isPlayingAudio}
                    activeOpacity={0.8}
                  >
                    {isListening || isRecording ? (
                      <MicOff size={32} color={Colors.white} />
                    ) : isConversationActive ? (
                      <Mic size={32} color={Colors.white} />
                    ) : (
                      <Square size={32} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                </Animated.View>
                <Text style={styles.micLabel}>
                  {microphoneDisabled || isPlayingAudio
                    ? 'AI is speaking...'
                    : isRecording
                      ? 'Recording... (release to send)'
                    : isListening 
                      ? 'Speak now...' 
                      : isConversationActive 
                        ? 'Hold to record voice' 
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
  visionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  visionToggleText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '500' as const,
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
  micButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
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
