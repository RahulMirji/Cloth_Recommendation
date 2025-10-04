/**
 * Typography Configuration
 * 
 * Defines consistent font sizes and weights used across the app.
 * All text should reference these values for consistency.
 */

export const FontSizes = {
  // Hero text - Page titles, large headings
  hero: 32,
  
  // Main headings - Section titles
  heading: 24,
  
  // Subheadings - Card titles
  subheading: 20,
  
  // Body text - Regular content
  body: 16,
  
  // Small text - Helper text, descriptions
  small: 14,
  
  // Tiny text - Disclaimers, footnotes
  tiny: 13,
  
  // Caption - Smallest readable text
  caption: 12,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

/**
 * Typography preset combinations for common use cases
 */
export const TextStyles = {
  // Page titles
  hero: {
    fontSize: FontSizes.hero,
    fontWeight: FontWeights.bold,
  },
  
  // Section headers
  heading: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold,
  },
  
  // Card titles
  subheading: {
    fontSize: FontSizes.subheading,
    fontWeight: FontWeights.semibold,
  },
  
  // Regular content
  body: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.regular,
  },
  
  // Helper text
  caption: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.regular,
  },
} as const;
