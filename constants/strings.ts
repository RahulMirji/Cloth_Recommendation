/**
 * Application Text Strings
 * 
 * Centralized location for all app text content.
 * Makes it easy to update copy and prepare for internationalization.
 */

export const Strings = {
  // Onboarding Screen
  onboarding: {
    // Tutorial Slides
    tutorial: {
      slide1: {
        title: 'Your AI Stylist',
        subtitle: 'Get real-time outfit advice powered by AI technology',
      },
      slide2: {
        title: 'Score Your Style',
        subtitle: 'Snap a photo and get instant feedback on your outfit',
      },
      slide3: {
        title: 'Shop & Dress Smarter',
        subtitle: 'Make smarter wardrobe decisions with AI recommendations',
      },
      skip: 'Skip',
      next: 'Next',
      done: 'Done',
    },
    // User Info Form
    title: 'Welcome to AI Cloth Recommendation',
    subtitle: 'Your personal AI fashion assistant is ready to help you look your best!',
    formTitle: "Let's get to know you",
    namePlaceholder: 'Your Name',
    emailPlaceholder: 'Email Address',
    continueButton: 'Get Started',
    loadingButton: 'Setting up...',
    disclaimer: 'By continuing, you agree to our Terms of Service and Privacy Policy',
    nameRequired: 'Please enter your name',
    emailRequired: 'Please enter your email',
    emailInvalid: 'Please enter a valid email address',
    errorTitle: 'Error',
    errorMessage: 'Failed to save your information. Please try again.',
  },

  // Home Screen
  home: {
    title: 'AI Cloth Recommendation',
    greeting: (name: string) => `Hey ${name} 👋`,
    subtitle: 'Ready to get some style tips?',
    aiStylist: {
      title: 'AI Stylist',
      description: 'Get real-time outfit recommendations with voice interaction',
    },
    outfitScorer: {
      title: 'Outfit Scorer',
      description: 'Upload a photo and get your outfit scored with feedback',
    },
    howItWorks: {
      title: 'How it works',
      step1Title: '1. Choose your mode',
      step1Text: 'Live AI Stylist for real-time feedback or Outfit Scorer for photo analysis',
      step2Title: '2. Get AI-powered insights',
      step2Text: 'Our AI analyzes your outfit and provides personalized recommendations',
      step3Title: '3. Level up your style',
      step3Text: 'Apply the suggestions and become more confident in your fashion choices',
    },
  },

  // Profile Screen
  profile: {
    title: 'Profile',
    editButton: 'Edit',
    saveButton: 'Save',
    cancelButton: 'Cancel',
    nameLabel: 'Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    ageLabel: 'Age',
    genderLabel: 'Gender',
    bioLabel: 'About Me',
    notProvided: 'Not provided',
    settingsButton: 'Settings',
    logoutButton: 'Logout',
    genderOptions: {
      male: 'Male',
      female: 'Female',
      other: 'Other',
    },
    placeholders: {
      phone: 'Optional',
      age: 'Optional',
      bio: 'Tell us about your style...',
    },
    alerts: {
      nameRequired: 'Name cannot be empty',
      emailRequired: 'Email cannot be empty',
      logoutTitle: 'Logout',
      logoutMessage: 'Are you sure you want to logout?',
      logoutCancel: 'Cancel',
      logoutConfirm: 'Logout',
    },
    permissions: {
      title: 'Permission Required',
      message: 'Please grant access to your photo library',
    },
  },

  // History Screen
  history: {
    title: 'History',
    tabs: {
      outfitScores: 'Outfit Scores',
      aiStylist: 'AI Stylist',
    },
    loading: 'Loading history...',
    empty: {
      outfitScores: {
        title: 'No Outfit Scores Yet',
        description: 'Score your first outfit to see your history here',
      },
      aiStylist: {
        title: 'No AI Stylist Conversations',
        description: 'Chat with the AI Stylist to see your conversation history here',
      },
    },
    card: {
      tapToView: 'Tap to view details',
      viewConversation: 'View conversation',
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: (days: number) => `${days} days ago`,
    },
  },

  // Settings Screen
  settings: {
    title: 'Settings',
    appearance: {
      title: 'Appearance',
      darkMode: 'Dark Mode',
      darkModeEnabled: 'Dark mode enabled',
      lightModeEnabled: 'Light mode enabled',
    },
    aiModel: {
      title: 'AI Model',
      useCloudAI: 'Use Cloud AI',
      cloudEnabled: 'Using cloud-based AI model',
      cloudDisabled: 'Using local AI model',
      note: 'Cloud AI provides more accurate results but requires internet connection',
    },
    privacy: {
      title: 'Privacy',
      saveHistory: 'Save History',
      historyEnabled: 'Recommendations are saved',
      historyDisabled: 'History is not saved',
    },
    voice: {
      title: 'Voice Interaction',
      enableVoice: 'Enable Voice',
      voiceEnabled: 'Voice interaction enabled',
      voiceDisabled: 'Voice interaction disabled',
    },
    data: {
      title: 'Data Management',
      clearButton: 'Clear All Data',
      clearAlertTitle: 'Clear All Data',
      clearAlertMessage: 'Are you sure you want to clear all saved data? This action cannot be undone.',
      clearCancel: 'Cancel',
      clearConfirm: 'Clear',
      clearSuccess: 'Success',
      clearSuccessMessage: 'All data has been cleared',
      clearError: 'Error',
      clearErrorMessage: 'Failed to clear data',
    },
    version: 'Version 1.4.0 • AI Fashion Assistant',
  },

  // Common
  common: {
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    guest: 'Guest',
  },
} as const;
