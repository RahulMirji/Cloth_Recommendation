/**
 * Gender Detection & Context Analysis Utility
 * 
 * Intelligently detects gender and context from outfit images to provide
 * highly accurate, gender-appropriate, and occasion-relevant product recommendations.
 * 
 * Features:
 * - AI-powered gender detection from image analysis
 * - Context-aware filtering based on occasion
 * - Gender-specific item category mapping
 * - Confidence scoring for recommendations
 */

export type Gender = 'male' | 'female' | 'unisex' | 'unknown';
export type Occasion = 'formal' | 'business' | 'casual' | 'party' | 'ethnic' | 'sport' | 'unknown';

export interface GenderDetectionResult {
  gender: Gender;
  confidence: number; // 0-1
  indicators: string[]; // What led to this detection
}

export interface OccasionAnalysisResult {
  occasion: Occasion;
  confidence: number;
  keywords: string[];
}

/**
 * Gender-specific item categories
 * Defines which items are appropriate for each gender
 */
export const GENDER_ITEM_CATEGORIES = {
  male: {
    formal: [
      'tie',
      'blazer',
      'suit',
      'dress shoes',
      'formal shoes',
      'oxford shoes',
      'loafers',
      'belt',
      'watch',
      'cufflinks',
      'pocket square',
      'dress shirt',
      'formal shirt',
      'trousers',
      'dress pants',
      'briefcase',
      'laptop bag',
      'wallet',
      'tie clip',
      'suspenders',
    ],
    casual: [
      'casual shirt',
      't-shirt',
      'polo shirt',
      'jeans',
      'chinos',
      'sneakers',
      'casual shoes',
      'jacket',
      'hoodie',
      'sweater',
      'watch',
      'belt',
      'backpack',
      'messenger bag',
      'cap',
      'sunglasses',
      'bracelet',
      'wallet',
    ],
    ethnic: [
      'kurta',
      'sherwani',
      'pathani suit',
      'traditional footwear',
      'ethnic jacket',
      'ethnic accessories',
      'turban',
      'ethnic watch',
    ],
  },
  female: {
    formal: [
      'blazer',
      'formal shirt',
      'blouse',
      'dress',
      'formal dress',
      'pencil skirt',
      'trousers',
      'formal pants',
      'heels',
      'formal shoes',
      'pumps',
      'handbag',
      'tote bag',
      'clutch',
      'necklace',
      'earrings',
      'bracelet',
      'watch',
      'ring',
      'scarf',
      'formal jacket',
    ],
    casual: [
      'casual top',
      't-shirt',
      'blouse',
      'jeans',
      'leggings',
      'casual dress',
      'skirt',
      'sneakers',
      'flats',
      'sandals',
      'casual shoes',
      'jacket',
      'cardigan',
      'sweater',
      'crossbody bag',
      'backpack',
      'tote',
      'sunglasses',
      'necklace',
      'earrings',
      'bracelet',
      'watch',
      'ring',
      'cap',
      'scarf',
    ],
    party: [
      'party dress',
      'evening gown',
      'cocktail dress',
      'heels',
      'stilettos',
      'clutch',
      'evening bag',
      'statement necklace',
      'chandelier earrings',
      'bracelet',
      'ring',
      'watch',
      'shawl',
      'stole',
      'makeup',
    ],
    ethnic: [
      'saree',
      'lehenga',
      'salwar kameez',
      'kurti',
      'ethnic dress',
      'ethnic footwear',
      'juttis',
      'bangles',
      'ethnic necklace',
      'maang tikka',
      'earrings',
      'nose ring',
      'dupatta',
      'ethnic bag',
      'clutch',
    ],
  },
  unisex: {
    all: [
      'jacket',
      'coat',
      'sneakers',
      'casual shoes',
      'sunglasses',
      'watch',
      'backpack',
      // Note: 'bag' removed - now gender-specific (handbag/purse for women, briefcase/laptop bag for men)
      'cap',
      'hat',
      'scarf',
      'belt',
      'wallet',
      'umbrella',
      'gloves',
    ],
  },
};

/**
 * Detect gender from AI analysis text
 * Uses keyword analysis, clothing type detection, and contextual clues
 */
export function detectGenderFromAnalysis(
  analysisText: string,
  improvements: string[] = [],
  context: string = ''
): GenderDetectionResult {
  const lowerText = analysisText.toLowerCase();
  const lowerImprovements = improvements.join(' ').toLowerCase();
  const lowerContext = context.toLowerCase();
  const allText = `${lowerText} ${lowerImprovements} ${lowerContext}`;

  const indicators: string[] = [];
  let maleScore = 0;
  let femaleScore = 0;

  // ===== EXPLICIT GENDER MENTIONS (Highest confidence) =====
  const explicitMaleKeywords = [
    'man',
    'men',
    'male',
    'gentleman',
    'guy',
    'him',
    'his',
    'he',
    'mr',
    'sir',
    "men's",
    'mens',
  ];
  
  const explicitFemaleKeywords = [
    'woman',
    'women',
    'female',
    'lady',
    'ladies',
    'girl',
    'her',
    'hers',
    'she',
    'ms',
    'mrs',
    'miss',
    "women's",
    'womens',
  ];

  // Check explicit mentions
  explicitMaleKeywords.forEach((keyword) => {
    if (allText.includes(keyword)) {
      maleScore += 20;
      indicators.push(`Explicit mention: "${keyword}"`);
    }
  });

  explicitFemaleKeywords.forEach((keyword) => {
    if (allText.includes(keyword)) {
      femaleScore += 20;
      indicators.push(`Explicit mention: "${keyword}"`);
    }
  });

  // ===== MALE-SPECIFIC CLOTHING & ACCESSORIES =====
  const maleClothingIndicators = [
    { keyword: 'tie', score: 15, name: 'Tie' },
    { keyword: 'necktie', score: 15, name: 'Necktie' },
    { keyword: 'bow tie', score: 15, name: 'Bow tie' },
    { keyword: 'suit jacket', score: 10, name: 'Suit jacket' },
    { keyword: 'blazer with shirt', score: 8, name: 'Blazer with shirt' },
    { keyword: 'dress shirt', score: 8, name: 'Dress shirt' },
    { keyword: 'formal shirt', score: 8, name: 'Formal shirt' },
    { keyword: 'oxford shoes', score: 10, name: 'Oxford shoes' },
    { keyword: 'derby shoes', score: 10, name: 'Derby shoes' },
    { keyword: 'brogues', score: 10, name: 'Brogues' },
    { keyword: 'cufflinks', score: 12, name: 'Cufflinks' },
    { keyword: 'pocket square', score: 8, name: 'Pocket square' },
    { keyword: 'suspenders', score: 10, name: 'Suspenders' },
    { keyword: 'briefcase', score: 8, name: 'Briefcase' },
    { keyword: 'beard', score: 18, name: 'Facial hair' },
    { keyword: 'mustache', score: 18, name: 'Mustache' },
    { keyword: 'sherwani', score: 15, name: 'Sherwani' },
    { keyword: 'pathani', score: 15, name: 'Pathani suit' },
    { keyword: 'kurta pajama', score: 10, name: 'Kurta pajama' },
  ];

  maleClothingIndicators.forEach((indicator) => {
    if (allText.includes(indicator.keyword)) {
      maleScore += indicator.score;
      indicators.push(`Male clothing: ${indicator.name}`);
    }
  });

  // ===== FEMALE-SPECIFIC CLOTHING & ACCESSORIES =====
  const femaleClothingIndicators = [
    { keyword: 'dress', score: 12, name: 'Dress' },
    { keyword: 'gown', score: 12, name: 'Gown' },
    { keyword: 'skirt', score: 12, name: 'Skirt' },
    { keyword: 'blouse', score: 10, name: 'Blouse' },
    { keyword: 'heels', score: 15, name: 'Heels' },
    { keyword: 'stiletto', score: 15, name: 'Stilettos' },
    { keyword: 'pumps', score: 12, name: 'Pumps' },
    { keyword: 'necklace', score: 12, name: 'Necklace' },
    { keyword: 'earrings', score: 12, name: 'Earrings' },
    { keyword: 'bracelet', score: 8, name: 'Bracelet' },
    { keyword: 'handbag', score: 10, name: 'Handbag' },
    { keyword: 'clutch', score: 10, name: 'Clutch' },
    { keyword: 'lipstick', score: 15, name: 'Lipstick' },
    { keyword: 'makeup', score: 12, name: 'Makeup' },
    { keyword: 'purse', score: 10, name: 'Purse' },
    { keyword: 'saree', score: 18, name: 'Saree' },
    { keyword: 'lehenga', score: 18, name: 'Lehenga' },
    { keyword: 'salwar', score: 15, name: 'Salwar kameez' },
    { keyword: 'kurti', score: 10, name: 'Kurti' },
    { keyword: 'dupatta', score: 12, name: 'Dupatta' },
    { keyword: 'bangles', score: 12, name: 'Bangles' },
    { keyword: 'bindi', score: 15, name: 'Bindi' },
    { keyword: 'maang tikka', score: 15, name: 'Maang tikka' },
  ];

  femaleClothingIndicators.forEach((indicator) => {
    if (allText.includes(indicator.keyword)) {
      femaleScore += indicator.score;
      indicators.push(`Female clothing: ${indicator.name}`);
    }
  });

  // ===== STYLING & DESCRIPTIVE CLUES =====
  const maleStyleClues = [
    'masculine',
    'manly',
    'sharp suit',
    'gentleman style',
    'business man',
    'professional man',
  ];
  
  const femaleStyleClues = [
    'feminine',
    'elegant dress',
    'graceful',
    'lady style',
    'business woman',
    'professional woman',
  ];

  maleStyleClues.forEach((clue) => {
    if (allText.includes(clue)) {
      maleScore += 8;
      indicators.push(`Style clue: "${clue}"`);
    }
  });

  femaleStyleClues.forEach((clue) => {
    if (allText.includes(clue)) {
      femaleScore += 8;
      indicators.push(`Style clue: "${clue}"`);
    }
  });

  // ===== DETERMINE FINAL GENDER =====
  const totalScore = maleScore + femaleScore;
  let gender: Gender = 'unknown';
  let confidence = 0;

  if (totalScore === 0) {
    // No clear indicators - default to unisex
    gender = 'unisex';
    confidence = 0.5;
    indicators.push('No clear gender indicators - defaulting to unisex');
  } else if (Math.abs(maleScore - femaleScore) < 5) {
    // Scores are very close - ambiguous
    gender = 'unisex';
    confidence = 0.6;
    indicators.push('Mixed indicators - treating as unisex');
  } else if (maleScore > femaleScore) {
    gender = 'male';
    confidence = Math.min(maleScore / (totalScore || 1), 1);
  } else {
    gender = 'female';
    confidence = Math.min(femaleScore / (totalScore || 1), 1);
  }

  console.log('🔍 Gender Detection:', {
    gender,
    confidence: `${(confidence * 100).toFixed(1)}%`,
    maleScore,
    femaleScore,
    indicators: indicators.slice(0, 5), // Top 5 indicators
  });

  return {
    gender,
    confidence,
    indicators,
  };
}

/**
 * Analyze occasion/context from input text
 */
export function analyzeOccasion(context: string): OccasionAnalysisResult {
  const lowerContext = context.toLowerCase();
  const keywords: string[] = [];
  
  const occasionKeywords = {
    formal: ['interview', 'formal', 'business', 'professional', 'office', 'corporate', 'meeting', 'conference'],
    business: ['business', 'office', 'work', 'corporate', 'professional', 'meeting'],
    casual: ['casual', 'weekend', 'hangout', 'relax', 'everyday', 'street', 'informal'],
    party: ['party', 'celebration', 'event', 'festive', 'evening', 'cocktail', 'date', 'night out'],
    ethnic: ['wedding', 'traditional', 'ethnic', 'cultural', 'festival', 'diwali', 'eid', 'sangeet'],
    sport: ['sport', 'gym', 'workout', 'exercise', 'athletic', 'running', 'training'],
  };

  let bestMatch: Occasion = 'unknown';
  let bestScore = 0;

  for (const [occasion, keywordList] of Object.entries(occasionKeywords)) {
    let score = 0;
    keywordList.forEach((keyword) => {
      if (lowerContext.includes(keyword)) {
        score++;
        keywords.push(keyword);
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestMatch = occasion as Occasion;
    }
  }

  const confidence = bestScore > 0 ? Math.min(bestScore / 3, 1) : 0;

  return {
    occasion: bestMatch,
    confidence,
    keywords,
  };
}

/**
 * Filter item categories based on gender and occasion
 * Returns only relevant categories for the detected gender and context
 */
export function filterItemCategoriesByGender(
  itemType: string,
  gender: Gender,
  occasion: Occasion
): boolean {
  const lowerItemType = itemType.toLowerCase();

  // Always allow unisex items
  if (GENDER_ITEM_CATEGORIES.unisex.all.some((item) =>
    lowerItemType.includes(item.toLowerCase())
  )) {
    return true;
  }

  // If gender is unknown or unisex, be more permissive
  if (gender === 'unknown' || gender === 'unisex') {
    return true;
  }

  // Check gender-specific categories
  const genderCategories = GENDER_ITEM_CATEGORIES[gender];
  if (!genderCategories) return true;

  // Check formal/casual/ethnic categories
  const occasionCategory = occasion === 'business' ? 'formal' : occasion;
  
  const relevantCategories = [
    ...(genderCategories.formal || []),
    ...(genderCategories.casual || []),
    ...(genderCategories[occasionCategory as keyof typeof genderCategories] || []),
  ];

  return relevantCategories.some((item) =>
    lowerItemType.includes(item.toLowerCase()) || item.toLowerCase().includes(lowerItemType)
  );
}

/**
 * Get gender-appropriate search context
 * Enhances search queries with gender-specific terms
 */
export function getGenderSearchContext(itemType: string, gender: Gender, occasion: Occasion): string {
  const genderPrefix = gender === 'male' ? "men's" : gender === 'female' ? "women's" : '';
  const occasionSuffix = occasion !== 'unknown' ? ` ${occasion}` : '';
  
  return `${genderPrefix} ${itemType}${occasionSuffix}`.trim();
}
