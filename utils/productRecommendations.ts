/**
 * Product Recommendation Utility
 * 
 * Fetches product recommendations from various marketplaces
 * based on missing items detected in outfit analysis
 */

export interface ProductRecommendation {
  id: string;
  name: string;
  imageUrl: string;
  marketplace: 'flipkart' | 'amazon' | 'meesho';
  productUrl: string;
  price?: string;
  rating?: number;
}

export interface MissingItem {
  itemType: string; // e.g., 'tie', 'shoes', 'blazer', 'necklace'
  reason: string; // Why it's missing/needed
  priority: number; // 1-3, higher is more important
}

/**
 * Generate search URLs for different marketplaces
 */
const generateSearchUrls = (itemType: string, context: string = '') => {
  const searchQuery = context 
    ? `${itemType} for ${context}` 
    : itemType;
  
  const encodedQuery = encodeURIComponent(searchQuery);
  
  return {
    flipkart: `https://www.flipkart.com/search?q=${encodedQuery}`,
    amazon: `https://www.amazon.in/s?k=${encodedQuery}`,
    meesho: `https://www.meesho.com/search?q=${encodedQuery}`,
  };
};

/**
 * Generate mock product recommendations
 * In production, this would call real marketplace APIs
 */
export const generateProductRecommendations = async (
  missingItems: MissingItem[],
  context: string = ''
): Promise<Map<string, ProductRecommendation[]>> => {
  const recommendations = new Map<string, ProductRecommendation[]>();

  // Product data templates for different item types
  // Using more specific and accurate product images and names
  const productTemplates: Record<string, any> = {
    tie: {
      professional: [
        { name: 'Classic Silk Tie - Navy Blue', image: 'https://images.unsplash.com/photo-1589756823695-278bc8356084?w=400&h=400&fit=crop' },
        { name: 'Striped Formal Tie - Black Grey', image: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=400&fit=crop' },
        { name: 'Premium Silk Tie - Burgundy', image: 'https://images.unsplash.com/photo-1564859118140-e5bc68bdc84c?w=400&h=400&fit=crop' },
        { name: 'Executive Tie - Charcoal', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&h=400&fit=crop' },
      ],
      casual: [
        { name: 'Knitted Tie - Charcoal', image: 'https://images.unsplash.com/photo-1542676607-ce10d02b72ce?w=400&h=400&fit=crop' },
        { name: 'Slim Casual Tie - Navy', image: 'https://images.unsplash.com/photo-1542676607-5a6b8e84a0d9?w=400&h=400&fit=crop' },
        { name: 'Patterned Tie - Blue Dots', image: 'https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=400&fit=crop' },
        { name: 'Linen Blend Tie - Grey', image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&h=400&fit=crop' },
      ],
    },
    shoes: {
      professional: [
        { name: 'Oxford Leather Shoes - Black', image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400' },
        { name: 'Derby Formal Shoes - Brown', image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400' },
        { name: 'Brogue Leather Shoes - Tan', image: 'https://images.unsplash.com/photo-1582897085656-c61a42d241e9?w=400' },
        { name: 'Classic Oxford - Dark Brown', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
      ],
      casual: [
        { name: 'Casual Sneakers - White', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
        { name: 'Canvas Shoes - Navy Blue', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400' },
        { name: 'Loafers - Brown Suede', image: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400' },
        { name: 'Slip-On Sneakers - Grey', image: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400' },
      ],
    },
    blazer: {
      professional: [
        { name: 'Slim Fit Blazer - Navy', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400' },
        { name: 'Formal Blazer - Charcoal Grey', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400' },
        { name: 'Business Blazer - Black', image: 'https://images.unsplash.com/photo-1593030668469-d6cf1c5c825f?w=400' },
        { name: 'Tailored Blazer - Dark Blue', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400' },
      ],
      casual: [
        { name: 'Casual Blazer - Light Grey', image: 'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=400' },
        { name: 'Linen Blazer - Beige', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400' },
        { name: 'Cotton Blazer - Navy Blue', image: 'https://images.unsplash.com/photo-1593030668469-d6cf1c5c825f?w=400' },
        { name: 'Sport Coat - Brown', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400' },
      ],
    },
    shirt: {
      professional: [
        { name: 'Formal White Shirt - Cotton', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' },
        { name: 'Blue Oxford Shirt', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' },
        { name: 'Striped Formal Shirt - Blue', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400' },
        { name: 'Classic White Shirt - Slim Fit', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' },
      ],
      casual: [
        { name: 'Linen Casual Shirt - White', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' },
        { name: 'Denim Shirt - Light Blue', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400' },
        { name: 'Checkered Shirt - Blue', image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400' },
        { name: 'Casual Cotton Shirt - Grey', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' },
      ],
    },
    kurta: {
      professional: [
        { name: 'Silk Kurta - Navy Blue', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
        { name: 'Cotton Kurta - White', image: 'https://images.unsplash.com/photo-1599629445486-97f6e3c22ee7?w=400' },
        { name: 'Ethnic Kurta - Maroon', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' },
        { name: 'Designer Kurta - Black', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
      ],
      casual: [
        { name: 'Casual Kurta - Light Blue', image: 'https://images.unsplash.com/photo-1599629445486-97f6e3c22ee7?w=400' },
        { name: 'Cotton Kurta - Beige', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400' },
        { name: 'Short Kurta - White', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400' },
        { name: 'Linen Kurta - Grey', image: 'https://images.unsplash.com/photo-1599629445486-97f6e3c22ee7?w=400' },
      ],
    },
    necklace: {
      professional: [
        { name: 'Pearl Necklace - Classic', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
        { name: 'Silver Chain Necklace', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400' },
        { name: 'Gold Pendant Necklace', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400' },
        { name: 'Minimalist Necklace - Silver', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
      ],
      casual: [
        { name: 'Layered Chain Necklace', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400' },
        { name: 'Choker Necklace - Gold', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400' },
        { name: 'Statement Necklace - Silver', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400' },
        { name: 'Beaded Necklace - Colorful', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400' },
      ],
    },
    bag: {
      professional: [
        { name: 'Leather Briefcase - Black', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
        { name: 'Laptop Bag - Brown Leather', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
        { name: 'Professional Tote - Navy', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
        { name: 'Business Bag - Dark Grey', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
      ],
      casual: [
        { name: 'Canvas Backpack - Grey', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
        { name: 'Crossbody Bag - Brown', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
        { name: 'Tote Bag - Beige Canvas', image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400' },
        { name: 'Messenger Bag - Black', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
      ],
    },
    watch: {
      professional: [
        { name: 'Formal Watch - Silver', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400' },
        { name: 'Classic Watch - Black Leather', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400' },
        { name: 'Business Watch - Gold', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400' },
        { name: 'Minimalist Watch - Silver', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400' },
      ],
      casual: [
        { name: 'Sport Watch - Black', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400' },
        { name: 'Casual Watch - Brown Strap', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=400' },
        { name: 'Digital Watch - Silver', image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400' },
        { name: 'Canvas Strap Watch - Blue', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400' },
      ],
    },
  };

  // Determine style based on context
  const isProfessional = context.toLowerCase().includes('interview') ||
                        context.toLowerCase().includes('office') ||
                        context.toLowerCase().includes('meeting') ||
                        context.toLowerCase().includes('formal') ||
                        context.toLowerCase().includes('business');

  const style = isProfessional ? 'professional' : 'casual';

  // Generate recommendations for each missing item
  for (const missingItem of missingItems) {
    const itemType = missingItem.itemType.toLowerCase();
    const products: ProductRecommendation[] = [];

    if (productTemplates[itemType]) {
      const templates = productTemplates[itemType][style] || productTemplates[itemType].casual;
      const searchUrls = generateSearchUrls(itemType, context);
      const marketplaces: Array<'flipkart' | 'amazon' | 'meesho'> = ['flipkart', 'amazon', 'meesho', 'flipkart'];

      templates.forEach((template: any, index: number) => {
        const marketplace = marketplaces[index % marketplaces.length];
        products.push({
          id: `${itemType}-${index}`,
          name: template.name,
          imageUrl: template.image,
          marketplace,
          productUrl: searchUrls[marketplace],
          price: undefined, // Would be fetched from real API
          rating: undefined, // Would be fetched from real API
        });
      });

      recommendations.set(itemType, products);
    }
  }

  return recommendations;
};

/**
 * Extract missing items from AI feedback with ADVANCED accuracy
 * Uses sophisticated pattern matching, context awareness, and NLP-like techniques
 * Perfectly aligned with the enhanced Pollinations AI prompt
 */
export const extractMissingItems = (improvements: string[], context: string = ''): MissingItem[] => {
  const missingItems: MissingItem[] = [];
  const detectedTypes = new Set<string>(); // Prevent duplicates
  
  // COMPREHENSIVE keyword mapping with contextual intelligence
  const itemKeywords: Record<string, {
    positive: string[]; // Primary keywords
    synonyms: string[]; // Alternative terms
    negative?: string[]; // Exclusion patterns
    priority: number; // 1=critical, 2=important, 3=accessory
    contextBoost?: string[]; // Contexts that increase priority
  }> = {
    // FORMAL WEAR ESSENTIALS
    tie: {
      positive: ['tie', 'necktie', 'bow tie', 'cravat', 'neck tie'],
      synonyms: ['add a tie', 'missing tie', 'needs tie', 'consider tie', 'wear a tie', 'add tie'],
      negative: ['waistline', 'tied up', 'untie', 'tie dye', 'tie together'],
      priority: 1,
      contextBoost: ['interview', 'formal', 'business', 'professional', 'office', 'corporate', 'meeting'],
    },
    blazer: {
      positive: ['blazer', 'sport coat', 'suit jacket', 'jacket formal'],
      synonyms: ['add blazer', 'missing blazer', 'needs blazer', 'wear blazer', 'add a blazer', 'jacket would'],
      negative: ['casual jacket', 'denim jacket', 'bomber jacket'],
      priority: 1,
      contextBoost: ['interview', 'formal', 'business', 'professional', 'office', 'corporate'],
    },
    shoes: {
      positive: ['shoe', 'shoes', 'footwear', 'oxford', 'loafer', 'derby', 'brogue', 'dress shoes', 'formal shoes'],
      synonyms: ['missing shoes', 'need shoes', 'add shoes', 'footwear missing', 'shoe choice', 'proper shoes'],
      negative: ['shoelace only', 'shoe polish', 'shoe rack'],
      priority: 1,
      contextBoost: ['interview', 'formal', 'business', 'professional', 'wedding', 'party'],
    },
    belt: {
      positive: ['belt', 'waist belt', 'leather belt'],
      synonyms: ['add belt', 'missing belt', 'needs belt', 'belt would', 'belt missing'],
      negative: ['seat belt', 'belt bag'],
      priority: 2,
      contextBoost: ['interview', 'formal', 'business', 'professional'],
    },
    watch: {
      positive: ['watch', 'wristwatch', 'timepiece', 'wrist watch'],
      synonyms: ['add watch', 'missing watch', 'needs watch', 'wear watch', 'watch would'],
      negative: ['watch out', 'watch for'],
      priority: 2,
      contextBoost: ['interview', 'formal', 'business', 'professional', 'office'],
    },
    
    // FORMAL SHIRTS & TOPS
    shirt: {
      positive: ['shirt', 'button-up', 'dress shirt', 'formal shirt', 'button down', 'collared shirt'],
      synonyms: ['add shirt', 'missing shirt', 'needs shirt', 'proper shirt', 'formal top'],
      negative: ['t-shirt', 'tshirt', 'polo shirt'],
      priority: 1,
      contextBoost: ['interview', 'formal', 'business', 'professional'],
    },
    
    // CASUAL WEAR
    tshirt: {
      positive: ['t-shirt', 'tshirt', 'tee', 'casual shirt', 'casual top'],
      synonyms: ['add tshirt', 'missing tshirt', 'casual tee'],
      negative: ['dress shirt', 'formal shirt', 'button-up'],
      priority: 2,
      contextBoost: ['casual', 'weekend', 'relax', 'hangout'],
    },
    jacket: {
      positive: ['jacket', 'coat', 'outerwear', 'windbreaker', 'bomber'],
      synonyms: ['add jacket', 'missing jacket', 'needs jacket', 'jacket would', 'outer layer'],
      negative: ['suit jacket', 'blazer', 'sport coat'],
      priority: 2,
      contextBoost: ['outdoor', 'cold', 'winter', 'autumn', 'casual'],
    },
    sneakers: {
      positive: ['sneaker', 'sneakers', 'trainers', 'casual shoes', 'athletic shoes'],
      synonyms: ['add sneakers', 'missing sneakers', 'casual footwear', 'comfortable shoes'],
      negative: ['formal shoes', 'dress shoes'],
      priority: 2,
      contextBoost: ['casual', 'sport', 'gym', 'weekend', 'street'],
    },
    
    // ETHNIC & TRADITIONAL
    kurta: {
      positive: ['kurta', 'ethnic wear', 'traditional wear', 'indian wear', 'ethnic top'],
      synonyms: ['add kurta', 'missing kurta', 'needs kurta', 'traditional outfit'],
      negative: [],
      priority: 2,
      contextBoost: ['ethnic', 'traditional', 'cultural', 'festival', 'wedding'],
    },
    
    // ACCESSORIES - BAGS
    bag: {
      positive: ['bag', 'briefcase', 'purse', 'handbag', 'tote', 'satchel', 'messenger bag', 'laptop bag'],
      synonyms: ['add bag', 'missing bag', 'needs bag', 'carry bag', 'bag would', 'briefcase missing'],
      negative: ['shopping bag', 'plastic bag', 'garbage bag'],
      priority: 2,
      contextBoost: ['interview', 'business', 'professional', 'office', 'work', 'travel'],
    },
    
    // ACCESSORIES - JEWELRY & DETAILS
    necklace: {
      positive: ['necklace', 'chain', 'pendant', 'neck piece', 'choker'],
      synonyms: ['add necklace', 'missing necklace', 'needs necklace', 'jewelry missing', 'neck jewelry'],
      negative: ['tie', 'shoelace', 'necklace tie'],
      priority: 3,
      contextBoost: ['formal', 'party', 'evening', 'date', 'wedding', 'festive'],
    },
    earrings: {
      positive: ['earring', 'earrings', 'studs', 'ear jewelry', 'ear piece'],
      synonyms: ['add earrings', 'missing earrings', 'needs earrings', 'ear accessories'],
      negative: [],
      priority: 3,
      contextBoost: ['formal', 'party', 'evening', 'date', 'wedding', 'festive'],
    },
    bracelet: {
      positive: ['bracelet', 'bangle', 'wristband', 'wrist jewelry', 'arm jewelry'],
      synonyms: ['add bracelet', 'missing bracelet', 'needs bracelet', 'wrist accessory'],
      negative: ['watch'],
      priority: 3,
      contextBoost: ['formal', 'party', 'evening', 'festive', 'ethnic'],
    },
    ring: {
      positive: ['ring', 'rings', 'finger ring', 'band'],
      synonyms: ['add ring', 'missing ring', 'needs ring', 'finger jewelry'],
      negative: ['earring', 'rings under eyes'],
      priority: 3,
      contextBoost: ['formal', 'party', 'evening', 'wedding', 'festive'],
    },
    
    // ACCESSORIES - OTHERS
    scarf: {
      positive: ['scarf', 'shawl', 'stole', 'muffler', 'neck scarf'],
      synonyms: ['add scarf', 'missing scarf', 'needs scarf', 'scarf would'],
      negative: [],
      priority: 3,
      contextBoost: ['winter', 'cold', 'autumn', 'formal', 'ethnic'],
    },
    sunglasses: {
      positive: ['sunglass', 'sunglasses', 'shades', 'eyewear', 'sun glasses'],
      synonyms: ['add sunglasses', 'missing sunglasses', 'needs sunglasses', 'shades missing'],
      negative: ['prescription glasses', 'reading glasses'],
      priority: 3,
      contextBoost: ['outdoor', 'summer', 'beach', 'casual', 'street'],
    },
    hat: {
      positive: ['hat', 'cap', 'beanie', 'fedora', 'headwear'],
      synonyms: ['add hat', 'missing hat', 'needs hat', 'cap missing', 'head accessory'],
      negative: ['hate'],
      priority: 3,
      contextBoost: ['outdoor', 'summer', 'winter', 'casual', 'street'],
    },
    
    // LOWER BODY
    trousers: {
      positive: ['trouser', 'trousers', 'pants', 'slacks', 'dress pants', 'formal pants'],
      synonyms: ['add trousers', 'missing trousers', 'needs pants', 'proper pants'],
      negative: ['shorts', 'cargo pants'],
      priority: 1,
      contextBoost: ['interview', 'formal', 'business', 'professional', 'office'],
    },
    jeans: {
      positive: ['jeans', 'denim pants', 'denim'],
      synonyms: ['add jeans', 'missing jeans', 'denim missing'],
      negative: ['denim jacket'],
      priority: 2,
      contextBoost: ['casual', 'weekend', 'street', 'hangout'],
    },
  };

  // Context analysis for priority boosting
  const lowerContext = context.toLowerCase();
  const contextKeywords = Object.values(itemKeywords)
    .flatMap(config => config.contextBoost || [])
    .filter(keyword => lowerContext.includes(keyword));

  // ADVANCED PATTERN MATCHING
  improvements.forEach((improvement) => {
    const lowerImprovement = improvement.toLowerCase();
    
    // Remove common filler words for better matching
    const cleanedImprovement = lowerImprovement
      .replace(/\b(consider|adding|add|wear|wearing|needs|need|would|could|should|try|might)\b/g, '')
      .trim();
    
    for (const [itemType, config] of Object.entries(itemKeywords)) {
      // Skip if already detected this type
      if (detectedTypes.has(itemType)) continue;
      
      // Score-based matching system
      let matchScore = 0;
      
      // Check positive keywords (weight: 10)
      if (config.positive.some(keyword => lowerImprovement.includes(keyword))) {
        matchScore += 10;
      }
      
      // Check synonyms (weight: 15 - stronger signal)
      if (config.synonyms.some(synonym => lowerImprovement.includes(synonym))) {
        matchScore += 15;
      }
      
      // Check cleaned version for exact item type match (weight: 8)
      if (cleanedImprovement.includes(itemType)) {
        matchScore += 8;
      }
      
      // Negative keyword check (disqualify)
      const hasNegativeMatch = config.negative && config.negative.some(keyword =>
        lowerImprovement.includes(keyword)
      );
      
      if (hasNegativeMatch) {
        matchScore = 0; // Disqualify
      }
      
      // Context boost (increases priority)
      let adjustedPriority = config.priority;
      if (config.contextBoost) {
        const hasContextMatch = config.contextBoost.some(keyword =>
          lowerContext.includes(keyword)
        );
        if (hasContextMatch) {
          matchScore += 5; // Boost score
          adjustedPriority = Math.max(1, config.priority - 1); // Increase priority
        }
      }
      
      // If match score is high enough, add the item
      if (matchScore >= 8) {
        missingItems.push({
          itemType,
          reason: improvement,
          priority: adjustedPriority,
        });
        detectedTypes.add(itemType);
        break; // Only match one item type per improvement
      }
    }
  });

  // INTELLIGENT CONTEXT-BASED DEFAULTS
  // If no items detected but context strongly suggests certain items
  if (missingItems.length === 0 && context.trim()) {
    if (lowerContext.includes('interview') || lowerContext.includes('formal') || 
        lowerContext.includes('business') || lowerContext.includes('professional')) {
      // Formal context - suggest professional essentials
      missingItems.push({
        itemType: 'tie',
        reason: 'A tie would add a professional touch for this formal occasion',
        priority: 1,
      });
      missingItems.push({
        itemType: 'blazer',
        reason: 'A blazer would complete the professional look',
        priority: 1,
      });
    } else if (lowerContext.includes('wedding') || lowerContext.includes('party') || 
               lowerContext.includes('festive')) {
      // Festive context - suggest accessories
      missingItems.push({
        itemType: 'watch',
        reason: 'A watch would add a sophisticated touch',
        priority: 2,
      });
      missingItems.push({
        itemType: 'necklace',
        reason: 'Jewelry would enhance the festive look',
        priority: 3,
      });
    }
  }

  // Sort by priority (lower number = higher priority)
  missingItems.sort((a, b) => a.priority - b.priority);

  // Log for debugging
  console.log('🔍 Missing Items Extraction:', {
    totalImprovements: improvements.length,
    detectedItems: missingItems.length,
    items: missingItems.map(item => item.itemType),
    context: context,
  });

  return missingItems;
};
