/**
 * Custom Alert Utility
 * 
 * Drop-in replacement for React Native's Alert.alert
 * Uses the beautiful custom alert instead.
 * 
 * Usage (after importing):
 * ```tsx
 * import { showCustomAlert } from '@/utils/customAlert';
 * 
 * showCustomAlert('success', 'Success!', 'Operation completed successfully');
 * showCustomAlert('error', 'Error', 'Something went wrong', [
 *   { text: 'OK', onPress: () => console.log('OK Pressed') }
 * ]);
 * ```
 */

import { AlertType } from '@/components/CustomAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

// This will be set by the AlertProvider
let globalShowAlert: ((
  type: AlertType,
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => void) | null = null;

export const setGlobalShowAlert = (
  showAlertFn: (
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => void
) => {
  globalShowAlert = showAlertFn;
};

/**
 * Show a custom styled alert
 * @param type - Type of alert: 'success', 'error', 'warning', or 'info'
 * @param title - Alert title
 * @param message - Optional alert message
 * @param buttons - Optional array of button configs
 */
export const showCustomAlert = (
  type: AlertType,
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (globalShowAlert) {
    globalShowAlert(type, title, message, buttons);
  } else {
    console.warn('Alert system not initialized. Wrap your app with AlertProvider.');
  }
};

/**
 * Legacy Alert.alert compatible wrapper
 * Automatically determines alert type based on title
 */
export const legacyAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  // Determine type from title
  let type: AlertType = 'info';
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('success')) {
    type = 'success';
  } else if (lowerTitle.includes('error') || lowerTitle.includes('failed')) {
    type = 'error';
  } else if (lowerTitle.includes('warning') || lowerTitle.includes('confirm')) {
    type = 'warning';
  }
  
  showCustomAlert(type, title, message, buttons);
};
