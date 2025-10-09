/**
 * Product Recommendations Component
 * 
 * Displays recommended products from online marketplaces
 * based on missing items in outfit analysis
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  useColorScheme,
} from 'react-native';
import { ExternalLink, ShoppingBag } from 'lucide-react-native';

import Colors from '@/constants/colors';
import getThemedColors from '@/constants/themedColors';
import { useApp } from '@/contexts/AppContext';
import { ProductRecommendation } from '@/utils/productRecommendations';

interface ProductRecommendationsProps {
  recommendations: Map<string, ProductRecommendation[]>;
  onProductPress?: (product: ProductRecommendation) => void;
}

export function ProductRecommendationsSection({
  recommendations,
  onProductPress,
}: ProductRecommendationsProps) {
  const colorScheme = useColorScheme();
  const { settings } = useApp();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const themedColors = getThemedColors(isDarkMode);

  const handleProductPress = async (product: ProductRecommendation) => {
    try {
      const supported = await Linking.canOpenURL(product.productUrl);
      if (supported) {
        await Linking.openURL(product.productUrl);
      }
      onProductPress?.(product);
    } catch (error) {
      console.error('Error opening product URL:', error);
    }
  };

  const getMarketplaceBadgeColor = (marketplace: string) => {
    switch (marketplace) {
      case 'flipkart':
        return '#2874F0';
      case 'amazon':
        return '#FF9900';
      case 'meesho':
        return '#9F2089';
      default:
        return Colors.primary;
    }
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  if (recommendations.size === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header - matches other card styles */}
      <View style={[styles.header, { backgroundColor: themedColors.card, borderColor: themedColors.border }]}>
        <Text style={[styles.headerTitle, { color: themedColors.text }]}>
          🛍️ My Recommendations
        </Text>
        <Text style={[styles.headerSubtitle, { color: themedColors.textSecondary }]}>
          Shop these items to complete your outfit
        </Text>
      </View>

      {/* Recommendations by Item Type */}
      {Array.from(recommendations.entries()).map(([itemType, products]) => (
        <View key={itemType} style={styles.itemSection}>
          {/* Item Type Label */}
          <View style={styles.itemHeader}>
            <Text style={[styles.itemTypeText, { color: themedColors.text }]}>
              {capitalizeFirst(itemType)}
            </Text>
            <View style={[styles.itemBadge, { backgroundColor: Colors.primary + '15' }]}>
              <ShoppingBag size={14} color={Colors.primary} />
              <Text style={[styles.itemCount, { color: Colors.primary }]}>
                {products.length}
              </Text>
            </View>
          </View>

          {/* Product Horizontal Scroll - 3 visible at once */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
            snapToInterval={140} // Snap to each card
            decelerationRate="fast"
          >
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: themedColors.card,
                    borderColor: themedColors.border,
                  },
                ]}
                onPress={() => handleProductPress(product)}
                activeOpacity={0.7}
              >
                {/* Product Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  {/* Marketplace Badge */}
                  <View
                    style={[
                      styles.marketplaceBadge,
                      { backgroundColor: getMarketplaceBadgeColor(product.marketplace) },
                    ]}
                  >
                    <Text style={styles.marketplaceBadgeText}>
                      {product.marketplace === 'flipkart' ? 'F' : 
                       product.marketplace === 'amazon' ? 'A' : 'M'}
                    </Text>
                  </View>
                </View>

                {/* Product Info */}
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productName, { color: themedColors.text }]}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>
                  
                  {/* Shop Now Button */}
                  <View style={[styles.shopButton, { backgroundColor: Colors.primary + '15' }]}>
                    <Text style={[styles.shopButtonText, { color: Colors.primary }]}>
                      Shop Now
                    </Text>
                    <ExternalLink size={12} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ))}

      {/* Disclaimer */}
      <View style={[styles.disclaimer, { backgroundColor: themedColors.backgroundSecondary }]}>
        <Text style={[styles.disclaimerText, { color: themedColors.textLight }]}>
          💡 These recommendations are curated based on your outfit analysis. 
          Prices and availability may vary.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Removed extra margins - will match parent spacing
  },
  header: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  itemSection: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemTypeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  productScroll: {
    paddingHorizontal: 0,
    gap: 12,
  },
  productCard: {
    width: 120, // Smaller width so 3 fit on screen
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 120, // Reduced height
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  marketplaceBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  marketplaceBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 8,
    minHeight: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 3,
  },
  shopButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  disclaimer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});
