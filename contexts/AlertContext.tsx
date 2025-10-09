/**
 * Alert Context
 * 
 * Global alert context that provides styled alerts throughout the app.
 * Replaces the default Alert.alert with beautiful custom alerts.
 * 
 * Usage:
 * ```tsx
 * const { showAlert } = useAlert();
 * 
 * showAlert('success', 'Profile updated!');
 * showAlert('error', 'Error', 'Something went wrong');
 * ```
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CustomAlert, AlertType } from '@/components/CustomAlert';
import { setGlobalShowAlert } from '@/utils/customAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertContextType {
  showAlert: (
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
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

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>(initialState);

  const showAlert = useCallback(
    (
      type: AlertType,
      title: string,
      message?: string,
      buttons?: AlertButton[]
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

  // Connect global alert utility with this provider
  useEffect(() => {
    setGlobalShowAlert(showAlert);
  }, [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={alertState.visible}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
        autoDismiss={alertState.autoDismiss}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
