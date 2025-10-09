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

// OutfitScorer feature imports
import { convertImageToBase64, generateTextWithImage } from '@/OutfitScorer/utils/pollinationsAI';
import { saveChatHistory, getChatHistoryById } from '@/OutfitScorer/utils/chatHistory';
import { OutfitScoreConversationData, ProductRecommendationData } from '@/OutfitScorer/types/chatHistory.types';
import { ProductRecommendationsSection } from '@/OutfitScorer/components/ProductRecommendations';
import {
  generateProductRecommendations,
  extractMissingItems,
  ProductRecommendation,
  MissingItem,
} from '@/OutfitScorer/utils/productRecommendations';
import { Footer } from '@/OutfitScorer/components/Footer';
import { useImageUpload } from '@/OutfitScorer/hooks/useImageUpload';

interface ScoringResult {
  score: number;
  category: string;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missingItems?: string[]; // New field for missing items
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
  
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  
  // Get session from AppContext (not authStore)
  const { session, settings } = useApp();
  const { uploadOutfitImage } = useImageUpload();
  
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
      alert('Permission to access gallery is required!');
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
      alert('Permission to access camera is required!');
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

    setIsAnalyzing(true);
    setResult(null);

    try {
      const base64Image = await convertImageToBase64(selectedImage);
      const contextInfo = context.trim() ? `\n\n🎯 CONTEXT: The user is going to ${context}. This is CRITICAL - evaluate outfit appropriateness specifically for this occasion.` : '';
      const prompt = `You are an ELITE fashion consultant with expertise in high-fashion, street style, and professional attire. Your job is to perform a METICULOUS, DETAILED analysis of this outfit image.${contextInfo}

🔍 CRITICAL ANALYSIS REQUIREMENTS:

1. **VISUAL SCANNING CHECKLIST** - Examine EVERY detail:
   ✓ HEAD: Hair styling, accessories (headband, hat, clips)
   ✓ FACE: Makeup coordination, eyewear (glasses/sunglasses)
   ✓ NECK: Necklace, scarf, tie, collar style
   ✓ UPPER BODY: Shirt/top (type, fit, pattern, fabric texture), blazer/jacket presence
   ✓ TORSO: Belt, waistline definition, layering
   ✓ ARMS: Watch, bracelets, sleeve style and length
   ✓ HANDS: Rings, nail polish, bag/clutch being held
   ✓ LOWER BODY: Pants/skirt/dress (fit, length, style, fabric), pockets
   ✓ FEET: Shoes (type, condition, color match), socks visibility
   ✓ OVERALL: Bag/purse (type, size, color), umbrella, any other accessories

2. **MICRO-DETAIL EXTRACTION**:
   • Fabric Analysis: Identify material type (cotton, silk, denim, wool, synthetic), texture (smooth, rough, knit), and quality indicators
   • Pattern Recognition: Stripes, checks, floral, solid, print details, pattern scale
   • Color Palette: Exact shades (navy vs royal blue), undertones (warm/cool), saturation levels, color blocking
   • Fit Assessment: Too tight/loose, proper length, shoulder alignment, waist definition, proportion balance
   • Condition Check: Wrinkles, stains, pilling, wear and tear, ironing needed
   • Styling Details: Tucked vs untucked, rolled sleeves, button count, pocket squares, cufflinks

3. **MISSING ITEMS IDENTIFICATION** - Be EXTREMELY thorough:
   • Essential Items: List EVERY missing clothing piece or accessory
   • Context Gaps: What's missing specifically for the stated occasion/context?
   • Completion Items: What would elevate this from incomplete to complete?
   • Professional Must-Haves: For formal contexts (tie, blazer, dress shoes, belt, watch, briefcase)
   • Casual Must-Haves: For casual contexts (appropriate footwear, bag, sunglasses, casual jacket)
   • Accessory Voids: Missing jewelry, belts, scarves, hats, bags that would enhance
   • Layering Needs: Missing under/over layers (camisole, blazer, cardigan, coat)

4. **COLOR HARMONY ANALYSIS**:
   • Primary Color: Dominant color and its appropriateness
   • Secondary Colors: Supporting colors and their harmony
   • Color Temperature: Warm vs cool tones consistency
   • Contrast Levels: High/low contrast and its effectiveness
   • Seasonal Appropriateness: Colors matching the season
   • Skin Tone Compatibility: How colors complement skin undertones

Respond in EXACTLY this JSON format (ONLY valid JSON, no markdown, no extra text):
{
  "score": <number 0-100>,
  "category": "<Outstanding/Excellent/Good/Fair/Needs Work>",
  "feedback": "<3-4 detailed sentences covering overall impression, key strengths, main issues, and potential>",
  "strengths": [
    "<specific strength with detail (e.g., 'Navy blue shirt perfectly matches your skin undertone and creates a professional appearance')>",
    "<another strength with context>",
    "<third strength with specifics>"
  ],
  "improvements": [
    "<detailed improvement mentioning SPECIFIC missing item or fix (e.g., 'Add a burgundy silk tie to elevate the professional look and add color contrast')>",
    "<another detailed improvement with specific item/change>",
    "<third improvement focusing on fit, color, or missing accessory>",
    "<fourth improvement if applicable>"
  ],
  "missingItems": [
    "<specific item type: 'tie', 'blazer', 'shoes', 'watch', 'belt', 'necklace', 'earrings', 'bag', 'scarf', 'sunglasses', etc.>",
    "<another missing item>",
    "<another missing item>"
  ]
}

📋 EVALUATION CRITERIA (rate each 0-100, then average):
• Color Coordination (25%): Harmony, contrast, seasonal appropriateness
• Fit & Proportions (25%): Proper sizing, length, silhouette balance
• Completeness (20%): All necessary items present for the occasion
• Style Appropriateness (15%): Matches context/occasion requirements
• Fabric & Quality (10%): Material choice, texture, condition
• Accessories & Details (5%): Finishing touches, jewelry, bags

⚠️ CRITICAL RULES:
• FIRST: Identify the person's GENDER (male/female) from clothing style, jewelry, body shape, hairstyle
• Be BRUTALLY honest about missing items - if shoes aren't visible, explicitly state "shoes missing"
• If the context is professional/interview, DEMAND complete formal attire (tie/blazer for men, blazer/necklace for women)
• For every missing item in "missingItems", mention it specifically in "improvements"
• GENDER-APPROPRIATE suggestions ONLY:
  - For MEN: tie, blazer, formal shoes, belt, watch, briefcase, cufflinks, pocket square
  - For WOMEN: necklace, earrings, heels, handbag, bracelet, blazer, dress, scarf, clutch
  - UNISEX: watch, sunglasses, bag, jacket, sneakers
• Look for SUBTLE issues: wrong shoe type, missing belt, no watch, lack of jewelry, etc.
• Consider LAYERING: missing blazer, cardigan, jacket appropriate for weather/formality
• Check ACCESSORIES: bag, watch, jewelry, eyewear - note what's absent
• If anything is incomplete or inappropriate for the context, lower the score significantly
• NEVER suggest gender-inappropriate items (e.g., no necklace for men, no tie for women)

Be precise, professional, and constructive. Your analysis will directly drive GENDER-APPROPRIATE product recommendations.`;

      const response = await generateTextWithImage(base64Image, prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsedResult: ScoringResult = JSON.parse(jsonMatch[0]);
      
      setResult(parsedResult);
      setIsAnalyzing(false);

      // Generate product recommendations based on missing items
      // Enhanced with gender detection and context-aware filtering
      let generatedRecommendations: Map<string, ProductRecommendation[]> = new Map();
      
      if (parsedResult.improvements && parsedResult.improvements.length > 0) {
        setIsLoadingRecommendations(true);
        try {
          // Extract missing items with gender awareness
          const analysisText = `${parsedResult.feedback || ''} ${parsedResult.improvements.join(' ')}`;
          const missingItems = extractMissingItems(
            parsedResult.improvements,
            context,
            analysisText
          );
          
          if (missingItems.length > 0) {
            // Generate gender-appropriate recommendations
            generatedRecommendations = await generateProductRecommendations(
              missingItems,
              context,
              analysisText,
              parsedResult.improvements
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
      
      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('taking too long')) {
          errorMessage = 'The analysis is taking longer than expected. This might be due to:\n\n' +
                       '• Large image size - try taking a new photo\n' +
                       '• Slow internet connection\n' +
                       '• Server is busy\n\n' +
                       'Please try again!';
        } else if (error.message.includes('network') || error.message.includes('connection')) {
          errorMessage = 'Network connection issue. Please check your internet and try again.';
        } else if (error.message.includes('Invalid response format')) {
          errorMessage = 'The AI service returned an unexpected response. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Failed to analyze outfit:\n\n${errorMessage}`);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return Colors.success;
    if (score >= 70) return Colors.primary;
    return Colors.warning;
  };

  return (
    <View style={[styles.container, { backgroundColor: themedColors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Outfit Scorer',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X size={24} color={themedColors.text} />
            </TouchableOpacity>
          ),
        }}
      />

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
              <View style={styles.contextContainer}>
                <Text style={[styles.contextLabel, { color: themedColors.text }]}>
                  Where are you going? (Optional)
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
            )}

            {!result && !isAnalyzing && (
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
