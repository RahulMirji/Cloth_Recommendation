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
 * Extract missing items from AI feedback with improved accuracy
 * Uses more sophisticated pattern matching to avoid false positives
 */
export const extractMissingItems = (improvements: string[], context: string = ''): MissingItem[] => {
  const missingItems: MissingItem[] = [];
  const detectedTypes = new Set<string>(); // Prevent duplicates
  
  // Enhanced keyword mapping with negative patterns to exclude false matches
  const itemKeywords: Record<string, {
    positive: string[]; // Must contain these
    negative?: string[]; // Must NOT contain these (to avoid false positives)
    priority: number;
  }> = {
    tie: {
      positive: ['tie', 'necktie', 'bow tie', 'cravat'],
      negative: ['waistline', 'tied', 'untie', 'tiepin'], // Avoid false matches
      priority: 1,
    },
    shoes: {
      positive: ['shoe', 'shoes', 'footwear', 'oxford', 'loafer', 'sneaker', 'boot'],
      negative: ['shoelace only', 'shoe polish'], // Avoid accessories for shoes
      priority: 1,
    },
    blazer: {
      positive: ['blazer', 'sport coat', 'suit jacket'],
      negative: ['t-shirt', 'shirt collar'], // Don't confuse with shirts
      priority: 1,
    },
    jacket: {
      positive: ['jacket', 'coat'],
      negative: ['suit jacket', 'sport coat', 'blazer'], // Avoid blazer overlap
      priority: 2,
    },
    shirt: {
      positive: ['shirt', 'button-up', 'dress shirt', 'formal shirt'],
      negative: ['t-shirt', 'tshirt'], // T-shirts are separate
      priority: 2,
    },
    tshirt: {
      positive: ['t-shirt', 'tshirt', 'tee', 'casual shirt'],
      negative: ['dress shirt', 'formal shirt'],
      priority: 2,
    },
    kurta: {
      positive: ['kurta', 'ethnic wear', 'traditional wear'],
      negative: [],
      priority: 2,
    },
    necklace: {
      positive: ['necklace', 'chain', 'pendant'],
      negative: ['tie', 'shoelace'],
      priority: 3,
    },
    earrings: {
      positive: ['earring', 'earrings', 'studs'],
      negative: [],
      priority: 3,
    },
    bracelet: {
      positive: ['bracelet', 'bangle', 'wristband'],
      negative: ['watch'],
      priority: 3,
    },
    bag: {
      positive: ['bag', 'briefcase', 'purse', 'handbag', 'tote', 'satchel'],
      negative: ['shopping bag', 'plastic bag'],
      priority: 2,
    },
    watch: {
      positive: ['watch', 'wristwatch', 'timepiece'],
      negative: ['pocket watch'],
      priority: 2,
    },
    belt: {
      positive: ['belt', 'waist belt'],
      negative: ['seat belt'],
      priority: 2,
    },
    scarf: {
      positive: ['scarf', 'shawl', 'stole'],
      negative: [],
      priority: 3,
    },
    sunglasses: {
      positive: ['sunglass', 'sunglasses', 'shades'],
      negative: ['prescription glasses'],
      priority: 3,
    },
    trousers: {
      positive: ['trouser', 'trousers', 'pants', 'slacks'],
      negative: ['shorts'],
      priority: 1,
    },
  };

  improvements.forEach((improvement, index) => {
    const lowerImprovement = improvement.toLowerCase();
    
    for (const [itemType, config] of Object.entries(itemKeywords)) {
      // Skip if already detected this type
      if (detectedTypes.has(itemType)) continue;
      
      // Check if any positive keyword matches
      const hasPositiveMatch = config.positive.some(keyword => 
        lowerImprovement.includes(keyword)
      );
      
      // Check if any negative keyword matches (should exclude)
      const hasNegativeMatch = config.negative && config.negative.some(keyword =>
        lowerImprovement.includes(keyword)
      );
      
      // Only add if positive match and no negative match
      if (hasPositiveMatch && !hasNegativeMatch) {
        missingItems.push({
          itemType,
          reason: improvement,
          priority: config.priority,
        });
        detectedTypes.add(itemType);
        break; // Only match one item type per improvement
      }
    }
  });

  // Sort by priority (lower number = higher priority)
  missingItems.sort((a, b) => a.priority - b.priority);

  // If no specific items detected but context suggests formal wear
  if (missingItems.length === 0) {
    const lowerContext = context.toLowerCase();
    if (lowerContext.includes('interview') || lowerContext.includes('formal') || lowerContext.includes('business')) {
      missingItems.push({
        itemType: 'tie',
        reason: 'A tie would add a professional touch to your outfit',
        priority: 1,
      });
    }
  }

  return missingItems;
};
