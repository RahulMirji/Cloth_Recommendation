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

import Colors from '@/constants/colors';
import getThemedColors from '@/constants/themedColors';
import { convertImageToBase64, generateTextWithImage } from '@/utils/pollinationsAI';
import { saveChatHistory, getChatHistoryById } from '@/utils/chatHistory';
import { OutfitScoreConversationData, ProductRecommendationData } from '@/types/chatHistory.types';
import { useAuthStore } from '@/store/authStore';
import { useApp } from '@/contexts/AppContext';
import { ProductRecommendationsSection } from '@/components/ProductRecommendations';
import {
  generateProductRecommendations,
  extractMissingItems,
  ProductRecommendation,
  MissingItem,
} from '@/utils/productRecommendations';

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
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [scoreAnim] = useState(new Animated.Value(0));
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [context, setContext] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Map<string, ProductRecommendation[]>>(new Map());
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(false);
  
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const session = useAuthStore((state) => state.session);
  
  // Theme detection
  const colorScheme = useColorScheme();
  const { settings } = useApp();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const themedColors = getThemedColors(isDarkMode);

  // Load from history if historyId is provided
  useEffect(() => {
    if (params.historyId && session?.user) {
      loadFromHistory(params.historyId as string);
    }
  }, [params.historyId]);

  const loadFromHistory = async (historyId: string) => {
    try {
      const entry = await getChatHistoryById(historyId, session!.user.id);
      if (!entry || entry.conversation_data.type !== 'outfit_score') return;

      const data = entry.conversation_data as OutfitScoreConversationData;
      
      // Pre-populate the UI with the previous result
      setSelectedImage(data.outfitImage);
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
        const { loadProductRecommendations } = await import('@/utils/productRecommendationStorage');
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
      console.error('Error loading history:', error);
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
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
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
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setResult(null);
      setContext('');
    }
  };

  const analyzeOutfit = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      console.log('Converting image to base64...');
      const base64Image = await convertImageToBase64(selectedImage);
      
      console.log('Analyzing outfit with AI...');
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
• Be BRUTALLY honest about missing items - if shoes aren't visible, explicitly state "shoes missing"
• If the context is professional/interview, DEMAND complete formal attire (tie, blazer, dress shoes)
• For every missing item in "missingItems", mention it specifically in "improvements"
• Look for SUBTLE issues: wrong shoe type, missing belt, no watch, lack of jewelry, etc.
• Consider LAYERING: missing blazer, cardigan, jacket appropriate for weather/formality
• Check ACCESSORIES: bag, watch, jewelry, eyewear - note what's absent
• If anything is incomplete or inappropriate for the context, lower the score significantly

Be precise, professional, and constructive. Your analysis will directly drive product recommendations.`;

      const response = await generateTextWithImage(base64Image, prompt);
      console.log('AI Response:', response);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsedResult: ScoringResult = JSON.parse(jsonMatch[0]);
      
      setResult(parsedResult);
      setIsAnalyzing(false);

      // Generate product recommendations based on missing items
      let generatedRecommendations: Map<string, ProductRecommendation[]> = new Map();
      
      if (parsedResult.improvements && parsedResult.improvements.length > 0) {
        setIsLoadingRecommendations(true);
        try {
          const missingItems = extractMissingItems(parsedResult.improvements, context);
          console.log('Detected missing items:', missingItems);
          
          if (missingItems.length > 0) {
            generatedRecommendations = await generateProductRecommendations(missingItems, context);
            setRecommendations(generatedRecommendations);
            console.log('Generated recommendations for', generatedRecommendations.size, 'item types');
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
            outfitImage: selectedImage,
            overallScore: parsedResult.score,
            feedback: {
              strengths: parsedResult.strengths,
              improvements: parsedResult.improvements,
              summary: parsedResult.feedback,
            },
            productRecommendations: Object.keys(productRecsData).length > 0 ? productRecsData : undefined,
            images: [selectedImage],
          };

          const savedHistory = await saveChatHistory({
            userId: session.user.id,
            type: 'outfit_score',
            conversationData,
          });
          
          console.log('Outfit analysis saved to history', {
            historyId: savedHistory.data?.id,
            recommendationsCount: generatedRecommendations.size
          });

          // Save product recommendations to dedicated table (use the newly generated ones)
          console.log('Checking if we should save recommendations:', {
            hasHistoryId: !!savedHistory.data?.id,
            recommendationsSize: generatedRecommendations.size,
            shouldSave: savedHistory.data?.id && generatedRecommendations.size > 0
          });
          
          if (savedHistory.data?.id && generatedRecommendations.size > 0) {
            console.log('Starting to save product recommendations to database...');
            console.log('Recommendations data:', Array.from(generatedRecommendations.entries()).map(([type, products]) => ({
              itemType: type,
              productCount: products.length,
              products: products.map(p => ({ name: p.name, marketplace: p.marketplace }))
            })));
            
            const { saveProductRecommendations } = await import('@/utils/productRecommendationStorage');
            const saveResult = await saveProductRecommendations(
              savedHistory.data.id,
              session.user.id,
              generatedRecommendations
            );
            
            if (saveResult.success) {
              console.log('✅ Product recommendations saved to database successfully');
            } else {
              console.error('❌ Failed to save product recommendations:', saveResult.error);
            }
          } else {
            console.log('⚠️ Skipping recommendation save:', {
              noHistoryId: !savedHistory.data?.id,
              noRecommendations: generatedRecommendations.size === 0
            });
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to analyze outfit: ${errorMessage}. Please try again.`);
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
