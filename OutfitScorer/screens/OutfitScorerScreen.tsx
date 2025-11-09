import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Upload, X, Sparkles, TrendingUp } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Animated,
  TextInput,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Global imports (shared across app)
import Colors from '@/constants/colors';
import getThemedColors from '@/constants/themedColors';
import { useApp } from '@/contexts/AppContext';
import { useAlert } from '@/contexts/AlertContext';

// OutfitScorer feature imports
import { convertImageToBase64 } from '@/OutfitScorer/utils/pollinationsAI';
import { generateTextWithImageModel } from '@/OutfitScorer/utils/multiModelAI';
import { AIModel, getDefaultModel } from '@/OutfitScorer/utils/aiModels';
import { getGlobalModel } from '@/OutfitScorer/utils/globalModelManager';
import { saveChatHistory, getChatHistoryById } from '@/OutfitScorer/utils/chatHistory';
import { OutfitScoreConversationData, ProductRecommendationData } from '@/OutfitScorer/types/chatHistory.types';
import { ProductRecommendationsSection } from '@/OutfitScorer/components/ProductRecommendations';
import {
  generateProductRecommendations,
  extractMissingItems,
  ProductRecommendation,
  MissingItem,
} from '@/OutfitScorer/utils/productRecommendations';
import { Footer } from '@/components/Footer';
import { useImageUpload } from '@/OutfitScorer/hooks/useImageUpload';
import { CreditDisplay } from '@/OutfitScorer/components/CreditDisplay';
import { OutOfCreditsModal } from '@/OutfitScorer/components/OutOfCreditsModal';
import { PaymentUploadScreen } from '@/OutfitScorer/components/PaymentUploadScreen';
import { 
  getUserCredits, 
  deductCredit, 
  hasCreditsAvailable, 
  getMaxCredits,
  UserCredits 
} from '@/OutfitScorer/services/creditService';

interface ScoringResult {
  score: number;
  category: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missingItems?: string[]; // New field for missing items
  gender?: 'male' | 'female' | 'unisex'; // Vision model gender detection
}



export default function OutfitScorerScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [scoreAnim] = useState(new Animated.Value(0));
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [context, setContext] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Map<string, ProductRecommendation[]>>(new Map());
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  const [glowAnim] = useState(new Animated.Value(0));
  
  // Credit system state
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [creditPulseAnim] = useState(new Animated.Value(1));
  const [creditGlowAnim] = useState(new Animated.Value(0));
  
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // Get session from AppContext (not authStore)
  const { session, settings } = useApp();
  const { uploadOutfitImage } = useImageUpload();
  const { showAlert } = useAlert();
  
  // Theme detection
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const themedColors = getThemedColors(isDarkMode);

  // Glow animation for gallery button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  // Credit pulse/glow animation when credit is deducted
  const animateCreditDeduction = () => {
    // Reset animations
    creditPulseAnim.setValue(1);
    creditGlowAnim.setValue(0);
    
    // Enhanced pulse animation (more dramatic heartbeat effect)
    Animated.sequence([
      // Quick expand
      Animated.timing(creditPulseAnim, {
        toValue: 1.4,
        duration: 200,
        useNativeDriver: true,
      }),
      // Bounce shrink
      Animated.timing(creditPulseAnim, {
        toValue: 0.85,
        duration: 200,
        useNativeDriver: true,
      }),
      // Second bounce expand
      Animated.timing(creditPulseAnim, {
        toValue: 1.25,
        duration: 200,
        useNativeDriver: true,
      }),
      // Settle back
      Animated.timing(creditPulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Enhanced glow animation (more visible flash)
    Animated.sequence([
      Animated.timing(creditGlowAnim, {
        toValue: 0.4,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(creditGlowAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Load user credits on mount and when screen is focused
  useEffect(() => {
    if (session?.user?.id) {
      loadUserCredits();
    }
  }, [session?.user?.id]);

  const loadUserCredits = async () => {
    if (!session?.user?.id) return;
    
    try {
      const credits = await getUserCredits(session.user.id);
      setUserCredits(credits);
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  const handleUpgradePress = () => {
    setShowOutOfCreditsModal(false);
    setShowPaymentScreen(true);
  };

  const handlePaymentClose = () => {
    setShowPaymentScreen(false);
    // Reload credits after payment submission
    loadUserCredits();
  };

  // Load from history if historyId is provided
  useEffect(() => {
    if (params.historyId && session?.user) {
      loadFromHistory(params.historyId as string);
    }
  }, [params.historyId, session]);

  const loadFromHistory = async (historyId: string) => {
    try {
      const entry = await getChatHistoryById(historyId, session!.user.id);
      
      if (!entry || !entry.conversation_data) {
        console.error('❌ No history entry found for ID:', historyId);
        return;
      }
      
      if (entry.conversation_data.type !== 'outfit_score') {
        console.error('❌ Wrong conversation type:', entry.conversation_data.type);
        return;
      }

      const data = entry.conversation_data as OutfitScoreConversationData;
      
      // Pre-populate the UI with the previous result
      setSelectedImage(data.outfitImage);
      setUploadedImageUrl(data.outfitImage); // This is already a Supabase URL from history
      setDisplayScore(data.overallScore);
      
      const loadedResult: ScoringResult = {
        score: data.overallScore,
        category: data.overallScore >= 85 ? 'Outstanding' : 
                  data.overallScore >= 70 ? 'Excellent' : 
                  data.overallScore >= 55 ? 'Good' : 
                  data.overallScore >= 40 ? 'Fair' : 'Needs Work',
        feedback: data.feedback?.summary || '',
        strengths: data.feedback?.strengths || [],
        improvements: data.feedback?.improvements || [],
      };
      
      setResult(loadedResult);
      
      // Load product recommendations from database
      try {
        const { loadProductRecommendations } = await import('@/OutfitScorer/utils/productRecommendationStorage');
        const loadedRecs = await loadProductRecommendations(historyId, session!.user.id);
        if (loadedRecs && loadedRecs.size > 0) {
          setRecommendations(loadedRecs);
          console.log('Loaded product recommendations from history');
        }
      } catch (recError) {
        console.error('Error loading product recommendations:', recError);
        // Continue even if recommendations fail to load
      }
      
      // Animate score
      scoreAnim.setValue(0);
      Animated.spring(scoreAnim, {
        toValue: data.overallScore,
        tension: 20,
        friction: 7,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error('❌ Error loading history:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert('error', 'Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Disable built-in crop editor
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Set local image immediately for preview
      setSelectedImage(result.assets[0].uri);
      setUploadedImageUrl(null); // Clear previous upload
      setResult(null);
      setContext('');
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      showAlert('error', 'Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, // Disable built-in crop editor
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Set local image immediately for preview
      setSelectedImage(result.assets[0].uri);
      setUploadedImageUrl(null); // Clear previous upload
      setResult(null);
      setContext('');
    }
  };

  const analyzeOutfit = async () => {
    if (!selectedImage) return;

    // Check if user has credits
    if (!session?.user?.id) {
      showAlert('error', 'Authentication Required', 'Please login to analyze outfits.');
      return;
    }

    // Check credits availability
    const hasCredits = await hasCreditsAvailable(session.user.id);
    if (!hasCredits) {
      setShowOutOfCreditsModal(true);
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Load globally selected model (admin-controlled)
      const globalModel = await getGlobalModel();
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║         📱 OUTFIT SCORER - ANALYSIS STARTING         ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');
      console.log('🎯 Selected Model:', globalModel.name);
      console.log('🔧 Model ID:', globalModel.id);
      console.log('🏭 Provider:', globalModel.provider);
      console.log('🤖 Model Name:', globalModel.modelName);
      console.log('⭐ Quality:', '⭐'.repeat(globalModel.quality));
      console.log('⚡ Speed:', globalModel.speed);
      console.log('');
      
      const base64Image = await convertImageToBase64(selectedImage);
      
      // Shortened prompt to fit OpenAI Vision 7000 char limit
      const contextInfo = context.trim() ? ` for "${context}"` : '';
      const prompt = `Fashion expert analyzing outfit${contextInfo}.

ANALYZE:
1. FIT: Size, sleeve/pant length, shoulder fit, proportions
2. STYLE: Fabric, pattern, cut, details (tucked/untucked, rolled sleeves)
3. MISSING: List ALL missing pieces/accessories for context
4. COLORS: Harmony, contrast, season, skin tone match
5. GENDER: Visual analysis of the person in the image

Return ONLY JSON (ALWAYS return JSON even if context mismatch):
{
  "score": <0-100>,
  "category": "<Outstanding/Excellent/Good/Fair/Needs Work>",
  "feedback": "<3-4 sentences: impression, strengths, issues, potential>",
  "strengths": ["<specific detail>", "<another>", "<third>"],
  "improvements": ["<specific item needed e.g. Add tie>", "<another>", "<third>", "<fourth>"],
  "missingItems": ["<tie/blazer/shoes/watch/belt/necklace/earrings/bag/scarf>", "<another>"],
  "gender": "<male/female/unisex>"
}

SCORING (avg 0-100):
• Colors 25% • Fit 25% • Complete 20% • Style 15% • Fabric 10% • Accessories 5%

RULES:
• Identify GENDER from VISUAL ANALYSIS of the person (male/female/unisex)
  - male: if person appears to be male
  - female: if person appears to be female
  - unisex: if ambiguous, unclear, or no person visible
• Honest about missing - if invisible, state missing
• Professional = formal required
• List missing in BOTH missingItems AND improvements
• GENDER-APPROPRIATE recommendations based on detected gender:
  MEN: tie/blazer/shoes/belt/watch/cufflinks
  WOMEN: necklace/earrings/heels/bag/bracelet
  UNISEX: watch/sunglasses/bag/jacket
• Low score for incomplete/inappropriate
• NEVER wrong-gender suggestions

If context mismatch, low score + explain in feedback. ALWAYS return valid JSON.`;

      const response = await generateTextWithImageModel(globalModel, base64Image, prompt);

      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║           � RESPONSE RECEIVED FROM AI              ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('�📝 Response preview:', response.substring(0, 200) + '...');
      console.log('📊 Total response length:', response.length, 'characters');
      console.log('');

      let jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('❌ Could not find JSON in response. AI may have refused. Creating fallback response...');
        
        // Fallback: AI refused or gave plain text - create a basic response
        const fallbackResult: ScoringResult = {
          score: 50,
          category: 'Fair',
          feedback: response.trim() || 'The outfit was analyzed but needs improvements. Please try without specifying a context or use a more appropriate outfit for the stated occasion.',
          strengths: [
            'Clean and neat appearance',
            'Appropriate casual wear for everyday activities'
          ],
          improvements: [
            'Consider the context/occasion when selecting your outfit',
            'Add appropriate accessories to complete the look',
            'Ensure all outfit elements are visible in the photo for a complete analysis'
          ],
          missingItems: []
        };
        
        setResult(fallbackResult);
        setIsAnalyzing(false);
        return;
      }

      console.log('✅ Found JSON:', jsonMatch[0].substring(0, 200) + '...');

      const parsedResult: ScoringResult = JSON.parse(jsonMatch[0]);
      
      setResult(parsedResult);
      setIsAnalyzing(false);

      // Deduct one credit after successful analysis
      if (session?.user?.id) {
        const creditDeducted = await deductCredit(session.user.id);
        if (creditDeducted) {
          console.log('🎬 Triggering credit deduction animation');
          // Trigger credit deduction animation
          animateCreditDeduction();
          // Reload credits to update UI
          await loadUserCredits();
        }
      }

      // Generate product recommendations based on missing items
      // Enhanced with gender detection and context-aware filtering
      let generatedRecommendations: Map<string, ProductRecommendation[]> = new Map();
      
      if (parsedResult.improvements && parsedResult.improvements.length > 0) {
        setIsLoadingRecommendations(true);
        try {
          // Extract missing items with gender awareness from vision model
          const analysisText = `${parsedResult.feedback || ''} ${parsedResult.improvements.join(' ')}`;
          const missingItems = extractMissingItems(
            parsedResult.improvements,
            context,
            analysisText,
            parsedResult.gender  // Pass vision-detected gender
          );
          
          if (missingItems.length > 0) {
            // Generate gender-appropriate recommendations
            generatedRecommendations = await generateProductRecommendations(
              missingItems,
              context,
              analysisText,
              parsedResult.improvements,
              parsedResult.gender  // Pass vision-detected gender
            );
            setRecommendations(generatedRecommendations);
          }
        } catch (recError) {
          console.error('Error generating recommendations:', recError);
          // Don't show error to user - recommendations are optional
        } finally {
          setIsLoadingRecommendations(false);
        }
      }

      // Save to chat history if user has enabled it
      if (session?.user && selectedImage) {
        try {
          // Upload image to Supabase Storage if not already uploaded
          let finalImageUrl = uploadedImageUrl;
          
          if (!uploadedImageUrl) {
            const uploadResult = await uploadOutfitImage(selectedImage, 'OUTFITS');
            
            if (uploadResult.success && uploadResult.url) {
              finalImageUrl = uploadResult.url;
              setUploadedImageUrl(uploadResult.url);
            } else {
              console.warn('⚠️ Image upload failed, using local URI:', uploadResult.error);
              finalImageUrl = selectedImage; // Fallback to local URI
            }
          } else {
            finalImageUrl = uploadedImageUrl;
          }

          // Prepare product recommendations data for storage (use the newly generated ones)
          const productRecsData: { [itemType: string]: ProductRecommendationData[] } = {};
          generatedRecommendations.forEach((products: ProductRecommendation[], itemType: string) => {
            productRecsData[itemType] = products.map((p: ProductRecommendation) => ({
              id: p.id,
              name: p.name,
              imageUrl: p.imageUrl,
              marketplace: p.marketplace,
              productUrl: p.productUrl,
              price: p.price,
              rating: p.rating,
              itemType: itemType,
            }));
          });

          const conversationData: OutfitScoreConversationData = {
            type: 'outfit_score',
            timestamp: new Date().toISOString(),
            outfitImage: finalImageUrl!, // Use Supabase URL
            overallScore: parsedResult.score,
            feedback: {
              strengths: parsedResult.strengths,
              improvements: parsedResult.improvements,
              summary: parsedResult.feedback,
            },
            productRecommendations: Object.keys(productRecsData).length > 0 ? productRecsData : undefined,
            images: [finalImageUrl!], // Use Supabase URL
          };

          const savedHistory = await saveChatHistory({
            userId: session.user.id,
            type: 'outfit_score',
            conversationData,
          });
          
          // Save product recommendations to dedicated table (use the newly generated ones)
          if (savedHistory.data?.id && generatedRecommendations.size > 0) {
            const { saveProductRecommendations } = await import('@/OutfitScorer/utils/productRecommendationStorage');
            const saveResult = await saveProductRecommendations(
              savedHistory.data.id,
              session.user.id,
              generatedRecommendations
            );
            
            if (!saveResult.success) {
              console.error('❌ Failed to save product recommendations:', saveResult.error);
            }
          }
        } catch (historyError) {
          console.error('Failed to save to history:', historyError);
          // Don't show error to user - history saving is optional
        }
      }

      scoreAnim.setValue(0);
      scoreAnim.addListener(({ value }) => {
        setDisplayScore(Math.round(value));
      });
      Animated.spring(scoreAnim, {
        toValue: parsedResult.score,
        tension: 20,
        friction: 7,
        useNativeDriver: false,
      }).start();
    } catch (error) {
      console.error('Error analyzing outfit:', error);
      setIsAnalyzing(false);
      
      // Get model name for error messages
      const globalModel = await getGlobalModel();
      
      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('taking too long')) {
          errorMessage = `Analysis timeout with ${globalModel.name}\n\n` +
                       'The AI service is taking too long. This might be due to:\n\n' +
                       '• Large image size - try taking a new photo\n' +
                       '• Slow internet connection\n' +
                       '• Server is busy\n\n' +
                       '💡 Contact admin if issue persists!';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network connection issue\n\nPlease check your internet and try again.';
        } else if (error.message.includes('Invalid response format')) {
          errorMessage = `${globalModel.name} returned an unexpected format\n\n` +
                       '💡 Contact admin to switch models!';
        } else if (error.message.includes('API error') || error.message.includes('failed')) {
          errorMessage = `${globalModel.name} is currently unavailable\n\n` +
                       '💡 Contact admin to switch to backup model!';
        } else {
          errorMessage = `Error with ${globalModel.name}\n\n${error.message}\n\n` +
                       '💡 Contact admin if issue persists!';
        }
      }
      
      showAlert('error', 'Failed to analyze outfit', errorMessage);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return Colors.success;
    if (score >= 70) return Colors.primary;
    return Colors.warning;
  };

  const screenBackgroundColor = isDarkMode ? '#0F172A' : themedColors.background;

  return (
    <View style={[styles.container, { backgroundColor: screenBackgroundColor }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Outfit Scorer',
          headerStyle: {
            backgroundColor: screenBackgroundColor,
          },
          headerTintColor: themedColors.text,
          headerTitleStyle: {
            color: themedColors.text,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={themedColors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            selectedImage && userCredits && session?.user ? (
              <View style={styles.headerRightContainer}>
                <Animated.View 
                  style={[
                    styles.headerCreditBadge,
                    isDarkMode ? {} : styles.headerCreditBadgeLight,
                    {
                      transform: [{ scale: creditPulseAnim }],
                      opacity: creditGlowAnim.interpolate({
                        inputRange: [0, 0.4],
                        outputRange: [1, 0.5],
                      }),
                    }
                  ]}
                >
                  <Sparkles size={14} color={isDarkMode ? "#8B5CF6" : "#7C3AED"} />
                  <Text style={[styles.headerCreditText, !isDarkMode && styles.headerCreditTextLight]}>
                    {userCredits.credits_remaining}/{userCredits.credits_cap}
                  </Text>
                  {userCredits.credits_cap === 100 ? (
                    <View style={styles.headerProBadge}>
                      <Text style={styles.headerProText}>PRO</Text>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      onPress={() => setShowPaymentScreen(true)}
                      style={styles.headerUpgradeButton}
                    >
                      <Text style={styles.headerUpgradeText}>Upgrade</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </View>
            ) : null
          ),
        }}
      />

      {isDarkMode && (
        <LinearGradient
          colors={['#0F172A', '#0F172A']}
          style={StyleSheet.absoluteFill}
        />
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: themedColors.iconBackground }]}>
              <Sparkles size={48} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.emptyTitle, { color: themedColors.text }]}>Upload Your Outfit</Text>
            <Text style={[styles.emptyText, { color: themedColors.textSecondary }]}>
              Take a photo or choose from your gallery to get your outfit scored by AI
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
                <Camera size={24} color={Colors.white} />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <Animated.View
                style={{
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 0.8],
                  }),
                  shadowRadius: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 20],
                  }),
                  elevation: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15],
                  }),
                }}
              >
                <TouchableOpacity 
                  style={[styles.secondaryButton, { 
                    backgroundColor: themedColors.buttonSecondary,
                    borderColor: themedColors.buttonSecondaryBorder 
                  }]} 
                  onPress={pickImage}
                >
                  <Upload size={24} color={Colors.primary} />
                  <Text style={[styles.secondaryButtonText, { color: themedColors.buttonSecondaryText }]}>
                    Choose from Gallery
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={[styles.imageContainer, { backgroundColor: themedColors.backgroundSecondary }]}>
              <Image source={{ uri: selectedImage }} style={styles.image} resizeMode="cover" />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setResult(null);
                  setContext('');
                }}
              >
                <X size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {!result && !isAnalyzing && (
              <>
                {/* Context Input */}
                <View style={styles.contextContainer}>
                  <Text style={[styles.contextLabel, { color: themedColors.text }]}>
                    Where are you going?
                  </Text>
                  <TextInput
                    style={[
                      styles.contextInput,
                      { 
                        backgroundColor: themedColors.input,
                        color: themedColors.text,
                        borderColor: themedColors.inputBorder 
                      }
                    ]}
                    placeholder="e.g., wedding, office, party, casual outing"
                    placeholderTextColor={themedColors.inputPlaceholder}
                    value={context}
                    onChangeText={setContext}
                    multiline={false}
                  />
                </View>
              </>
            )}

            {!result && !isAnalyzing && context.trim().length > 0 && (
              <TouchableOpacity style={styles.analyzeButton} onPress={analyzeOutfit}>
                <LinearGradient
                  colors={[Colors.gradient.start, Colors.gradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.analyzeGradient}
                >
                  <Sparkles size={24} color={Colors.white} />
                  <Text style={styles.analyzeButtonText}>Analyze Outfit</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {isAnalyzing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={[styles.loadingText, { color: themedColors.textSecondary }]}>
                  Analyzing your outfit...
                </Text>
              </View>
            )}

            {result && (
              <View style={styles.resultContainer}>
                <View style={[
                  styles.scoreCard,
                  { 
                    backgroundColor: themedColors.card,
                    borderColor: themedColors.border 
                  }
                ]}>
                  <View style={styles.scoreCircle}>
                    <Text
                      style={[
                        styles.scoreNumber,
                        { color: getScoreColor(result.score) },
                      ]}
                    >
                      {displayScore}
                    </Text>
                    <Text style={[styles.scoreLabel, { color: themedColors.textLight }]}>/ 100</Text>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: themedColors.backgroundSecondary }]}>
                    <TrendingUp size={20} color={getScoreColor(result.score)} />
                    <Text style={[styles.categoryText, { color: getScoreColor(result.score) }]}>
                      {result.category}
                    </Text>
                  </View>
                </View>

                <View style={[
                  styles.feedbackCard,
                  { 
                    backgroundColor: themedColors.card,
                    borderColor: themedColors.border 
                  }
                ]}>
                  <Text style={[styles.feedbackTitle, { color: themedColors.text }]}>
                    Overall Feedback
                  </Text>
                  <Text style={[styles.feedbackText, { color: themedColors.textSecondary }]}>
                    {result.feedback}
                  </Text>
                </View>

                <View style={[
                  styles.detailsCard,
                  { 
                    backgroundColor: themedColors.card,
                    borderColor: themedColors.border 
                  }
                ]}>
                  <Text style={[styles.detailsTitle, { color: themedColors.text }]}>
                    ✨ Strengths
                  </Text>
                  {result.strengths.map((strength, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.bulletSuccess} />
                      <Text style={[styles.listText, { color: themedColors.textSecondary }]}>
                        {strength}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[
                  styles.detailsCard,
                  { 
                    backgroundColor: themedColors.card,
                    borderColor: themedColors.border 
                  }
                ]}>
                  <Text style={[styles.detailsTitle, { color: themedColors.text }]}>
                    💡 Room for Improvement
                  </Text>
                  {result.improvements.map((improvement, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={styles.bulletWarning} />
                      <Text style={[styles.listText, { color: themedColors.textSecondary }]}>
                        {improvement}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Product Recommendations Section */}
                {isLoadingRecommendations && (
                  <View style={[styles.recommendationsLoading, { backgroundColor: themedColors.card }]}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={[styles.recommendationsLoadingText, { color: themedColors.textSecondary }]}>
                      Finding perfect products for you...
                    </Text>
                  </View>
                )}

                {!isLoadingRecommendations && recommendations.size > 0 && (
                  <ProductRecommendationsSection
                    recommendations={recommendations}
                    onProductPress={(product) => {
                      console.log('Product clicked:', product.name, 'from', product.marketplace);
                    }}
                  />
                )}

                <TouchableOpacity
                  style={[
                    styles.newAnalysisButton,
                    { backgroundColor: themedColors.backgroundSecondary }
                  ]}
                  onPress={() => {
                    setSelectedImage(null);
                    setResult(null);
                    setContext('');
                    setRecommendations(new Map());
                  }}
                >
                  <Text style={styles.newAnalysisText}>Analyze Another Outfit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        {result && <Footer />}
      </ScrollView>

      {/* Out of Credits Modal */}
      <OutOfCreditsModal
        visible={showOutOfCreditsModal}
        onClose={() => setShowOutOfCreditsModal(false)}
        onUpgrade={handleUpgradePress}
      />

      {/* Payment Upload Screen */}
      <PaymentUploadScreen
        visible={showPaymentScreen}
        onClose={handlePaymentClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  // Header credit display styles
  headerRightContainer: {
    marginRight: 8,
  },
  headerCreditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  headerCreditBadgeLight: {
    backgroundColor: '#E9D5FF',
    borderColor: '#A855F7',
    borderWidth: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  headerCreditText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  headerCreditTextLight: {
    color: '#6B21A8',
    fontWeight: '900',
  },
  headerProBadge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  headerProText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  headerUpgradeButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  headerUpgradeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 24,
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextContainer: {
    marginBottom: 20,
  },
  contextLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  contextInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  resultContainer: {
    gap: 16,
  },
  scoreCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
  },
  scoreCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '700' as const,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailsCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletSuccess: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginTop: 7,
    marginRight: 12,
  },
  bulletWarning: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.warning,
    marginTop: 7,
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  recommendationsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    gap: 12,
    marginVertical: 8,
  },
  recommendationsLoadingText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  newAnalysisButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  newAnalysisText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
