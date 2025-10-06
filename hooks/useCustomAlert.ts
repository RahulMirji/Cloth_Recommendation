/**
 * Custom Alert Hook
 * 
 * Easy-to-use hook for displaying styled alerts throughout the app.
 * Replaces the default Alert.alert with beautiful custom alerts.
 * 
 * Usage:
 * ```tsx
 * const { showAlert } = useCustomAlert();
 * 
 * // Simple success alert (auto-dismiss)
 * showAlert('success', 'Profile photo updated successfully!');
 * 
 * // Error alert with message
 * showAlert('error', 'Upload Failed', 'Failed to upload image. Please try again.');
 * 
 * // Alert with custom buttons
 * showAlert('warning', 'Logout', 'Are you sure you want to logout?', [
 *   { text: 'Cancel', style: 'cancel' },
 *   { text: 'Logout', style: 'destructive', onPress: handleLogout }
 * ]);
 * ```
 */

import { useState, useCallback } from 'react';
import { AlertType } from '@/components/CustomAlert';

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  autoDismiss: boolean;
}

const initialState: AlertState = {
  visible: false,
  type: 'info',
  title: '',
  message: undefined,
  buttons: undefined,
  autoDismiss: false,
};

export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>(initialState);

  const showAlert = useCallback(
    (
      type: AlertType,
      title: string,
      message?: string,
      buttons?: Array<{
        text: string;
        onPress?: () => void;
        style?: 'default' | 'cancel' | 'destructive';
      }>
    ) => {
      setAlertState({
        visible: true,
        type,
        title,
        message,
        buttons,
        autoDismiss: !buttons, // Auto-dismiss only if no buttons
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertState(initialState);
  }, []);

  return {
    alertState,
    showAlert,
    hideAlert,
  };
};
