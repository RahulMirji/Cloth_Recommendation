/**
 * useGeminiLiveSession Hook
 * 
 * React hook for managing Gemini Live API voice conversations.
 * Provides state management and lifecycle handling for real-time voice interaction.
 * 
 * Features:
 * - Automatic session management
 * - Real-time transcript updates
 * - Audio streaming with expo-av
 * - Error handling and recovery
 * - Auto-cleanup on unmount
 * 
 * Usage:
 * ```tsx
 * const {
 *   isConnected,
 *   isListening,
 *   isSpeaking,
 *   transcript,
 *   error,
 *   startSession,
 *   stopSession,
 *   sendImage,
 * } = useGeminiLiveSession();
 * 
 * <Button onPress={startSession}>Start Conversation</Button>
 * <Button onPress={stopSession}>End Conversation</Button>
 * <Text>{transcript.user}</Text>
 * <Text>{transcript.ai}</Text>
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GeminiLiveSession, FASHION_STYLIST_SYSTEM_INSTRUCTION } from '../utils/geminiLiveAPI';
import { AudioStreamManager } from '../utils/audioStreamManager';

export interface TranscriptMessage {
  text: string;
  timestamp: Date;
  speaker: 'user' | 'ai';
}

export interface UseGeminiLiveSessionOptions {
  /**
   * Gemini model to use
   * @default 'models/gemini-2.0-flash-exp'
   */
  model?: string;
  
  /**
   * Voice to use for AI responses
   * @default 'Kore'
   */
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
  
  /**
   * Custom system instruction (overrides default fashion stylist instruction)
   */
  systemInstruction?: string;
  
  /**
   * Whether to enable transcription
   * @default true
   */
  enableTranscription?: boolean;
  
  /**
   * Callback when connection status changes
   */
  onConnectionChange?: (connected: boolean) => void;
  
  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;
}

export interface UseGeminiLiveSessionReturn {
  /** Whether connected to Gemini Live API */
  isConnected: boolean;
  
  /** Whether actively recording user audio */
  isListening: boolean;
  
  /** Whether AI is currently speaking */
  isSpeaking: boolean;
  
  /** Current transcript with user and AI messages */
  transcript: {
    user: string;
    ai: string;
    history: TranscriptMessage[];
  };
  
  /** Current error, if any */
  error: Error | null;
  
  /** Start a new conversation session */
  startSession: () => Promise<void>;
  
  /** End the current conversation session */
  stopSession: () => Promise<void>;
  
  /** Send an image for visual context (outfit analysis) */
  sendImage: (imageUri: string) => Promise<void>;
  
  /** Clear transcript history */
  clearTranscript: () => void;
}

/**
 * Hook for managing Gemini Live API voice conversations
 */
export function useGeminiLiveSession(
  options: UseGeminiLiveSessionOptions = {}
): UseGeminiLiveSessionReturn {
  const {
    model = 'models/gemini-2.0-flash-exp', // Correct model format with models/ prefix
    voiceName = 'Kore',
    systemInstruction = FASHION_STYLIST_SYSTEM_INSTRUCTION,
    enableTranscription = true,
    onConnectionChange,
    onError,
  } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [currentAiTranscript, setCurrentAiTranscript] = useState('');
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Refs for session and audio manager
  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const audioManagerRef = useRef<AudioStreamManager | null>(null);
  const isStartingRef = useRef(false);

  /**
   * Initialize session and audio manager
   */
  const initializeSession = useCallback(async () => {
    try {
      console.log('🎤 Initializing Gemini Live Session...');
      
      // Create session
      const session = new GeminiLiveSession();
      sessionRef.current = session;

      // Create audio manager
      const audioManager = new AudioStreamManager();
      audioManagerRef.current = audioManager;

      // Set up session event handlers
      session.onConnected(() => {
        console.log('✅ Connected to Gemini Live API');
        setIsConnected(true);
        setError(null);
        onConnectionChange?.(true);
      });

      session.onDisconnected(() => {
        console.log('🔌 Disconnected from Gemini Live API');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        onConnectionChange?.(false);
      });

      session.onError((err) => {
        console.error('❌ Session error:', err.message);
        setError(err);
        onError?.(err);
      });

      // Handle user speech transcription
      session.onInputTranscript((event) => {
        console.log('📝 User:', event.text);
        setCurrentUserTranscript(event.text);
        
        // Add to history when complete
        if (event.text.trim()) {
          setTranscriptHistory(prev => [
            ...prev,
            {
              text: event.text,
              timestamp: new Date(),
              speaker: 'user',
            },
          ]);
        }
      });

      // Handle AI response transcription
      session.onOutputTranscript((event) => {
        console.log('🤖 AI:', event.text);
        setCurrentAiTranscript(event.text);
        
        // Add to history when complete
        if (event.text.trim()) {
          setTranscriptHistory(prev => [
            ...prev,
            {
              text: event.text,
              timestamp: new Date(),
              speaker: 'ai',
            },
          ]);
        }
      });

      // Handle audio playback
      session.onAudioReceived(async (audioChunk) => {
        setIsSpeaking(true);
        try {
          await audioManager.playAudioChunk(audioChunk.data);
        } catch (err) {
          console.error('❌ Audio playback error:', err);
        }
      });

      // Handle interrupts (user speaks while AI is talking)
      session.onInterrupt(() => {
        console.log('⚠️ Interrupt detected - stopping AI speech');
        setIsSpeaking(false);
        audioManager.stopPlayback();
        setCurrentAiTranscript(''); // Clear current AI transcript
      });

      // Connect to Gemini Live API
      await session.connect({
        model,
        voiceConfig: {
          voiceName,
        },
        systemInstruction,
        responseModalities: ['AUDIO'], // Use audio responses
        automaticVAD: true, // Enable automatic voice activity detection
        inputAudioTranscription: enableTranscription,
        outputAudioTranscription: enableTranscription,
      });

      // Start continuous audio recording
      await audioManager.startContinuousRecording(
        async (audioChunk) => {
          // Send audio chunk to Gemini
          if (session && sessionRef.current) {
            await session.sendAudioChunk(audioChunk, 16000);
            setIsListening(true);
          }
        }
      );

      console.log('✅ Session initialized successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Failed to initialize session:', error.message);
      setError(error);
      onError?.(error);
      throw error;
    }
  }, [model, voiceName, systemInstruction, enableTranscription, onConnectionChange, onError]);

  /**
   * Cleanup session and audio manager
   */
  const cleanupSession = useCallback(async () => {
    console.log('🧹 Cleaning up session...');
    
    try {
      // Stop audio recording
      if (audioManagerRef.current) {
        await audioManagerRef.current.stopContinuousRecording();
        await audioManagerRef.current.stopPlayback();
      }

      // Disconnect session
      if (sessionRef.current) {
        await sessionRef.current.disconnect();
      }
    } catch (err) {
      console.error('⚠️ Error during cleanup:', err);
    } finally {
      sessionRef.current = null;
      audioManagerRef.current = null;
      setIsConnected(false);
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Start a new conversation session
   */
  const startSession = useCallback(async () => {
    if (isStartingRef.current || isConnected) {
      console.log('⚠️ Session already starting or connected');
      return;
    }

    try {
      isStartingRef.current = true;
      setError(null);
      await initializeSession();
    } catch (err) {
      console.error('❌ Failed to start session:', err);
    } finally {
      isStartingRef.current = false;
    }
  }, [isConnected, initializeSession]);

  /**
   * Stop the current conversation session
   */
  const stopSession = useCallback(async () => {
    await cleanupSession();
  }, [cleanupSession]);

  /**
   * Send an image for visual context (outfit analysis)
   */
  const sendImage = useCallback(async (imageUri: string) => {
    if (!sessionRef.current || !isConnected) {
      throw new Error('Not connected. Start a session first.');
    }

    try {
      console.log('📸 Sending image for analysis...');
      await sessionRef.current.sendImage(imageUri);
      console.log('✅ Image sent successfully');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('❌ Failed to send image:', error.message);
      setError(error);
      throw error;
    }
  }, [isConnected]);

  /**
   * Clear transcript history
   */
  const clearTranscript = useCallback(() => {
    setCurrentUserTranscript('');
    setCurrentAiTranscript('');
    setTranscriptHistory([]);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log('🔄 Component unmounting - cleaning up session');
      cleanupSession();
    };
  }, [cleanupSession]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    transcript: {
      user: currentUserTranscript,
      ai: currentAiTranscript,
      history: transcriptHistory,
    },
    error,
    startSession,
    stopSession,
    sendImage,
    clearTranscript,
  };
}
