/**
 * Gemini Live Mode Route
 * Real-time AI stylist with Gemini 2.5 Flash
 */

import { Stack } from 'expo-router';
import { GeminiLiveScreen } from '@/AIStylist/screens';

export default function GeminiLive() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          animation: 'slide_from_bottom',
          presentation: 'fullScreenModal',
        }} 
      />
      <GeminiLiveScreen />
    </>
  );
}
