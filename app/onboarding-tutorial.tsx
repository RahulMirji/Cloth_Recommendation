/**
 * Tutorial Slides Route
 * 
 * First step of onboarding - shows 3 informative slides.
 * Auto-detects platform and uses appropriate version:
 * - Mobile (iOS/Android): Uses react-native-onboarding-swiper for native feel
 * - Web: Uses custom web-compatible version
 */

import { Platform } from 'react-native';
import { TutorialSlidesScreen } from '@/screens/TutorialSlidesScreen';
import TutorialSlidesScreenWeb from '@/screens/TutorialSlidesScreenWeb';

// Use native swiper on mobile, custom version on web
export default Platform.OS === 'web' ? TutorialSlidesScreenWeb : TutorialSlidesScreen;
