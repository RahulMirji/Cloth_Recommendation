/**
 * Type declarations for react-native-onboarding-swiper
 */

declare module 'react-native-onboarding-swiper' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

  export interface Page {
    backgroundColor: string;
    image: ReactNode;
    title: string;
    subtitle: string;
  }

  export interface OnboardingProps {
    pages: Page[];
    onSkip?: () => void;
    onDone?: () => void;
    skipLabel?: string;
    nextLabel?: string;
    skipToLabel?: string;
    bottomBarHighlight?: boolean;
    controlStatusBar?: boolean;
    containerStyles?: ViewStyle;
    imageContainerStyles?: ViewStyle;
    titleStyles?: TextStyle;
    subTitleStyles?: TextStyle;
    showSkip?: boolean;
    showNext?: boolean;
    showDone?: boolean;
    DoneButtonComponent?: ComponentType<any>;
    SkipButtonComponent?: ComponentType<any>;
    NextButtonComponent?: ComponentType<any>;
    DotComponent?: ComponentType<any>;
  }

  const Onboarding: ComponentType<OnboardingProps>;
  export default Onboarding;
}
