/**
 * OutfitScorer Feature Module
 * 
 * A self-contained, modular implementation of the Outfit Scoring feature.
 * This module includes all necessary components, utilities, hooks, and types
 * required for the outfit analysis and recommendation functionality.
 * 
 * @module OutfitScorer
 * @version 2.0.0
 * @since October 9, 2025
 * 
 * Features:
 * - AI-powered outfit analysis using vision models
 * - Real-time scoring with detailed feedback
 * - Gender-aware product recommendations
 * - Image upload to Supabase Storage
 * - Chat history persistence
 * - Multi-marketplace product search (Amazon, Walmart, eBay)
 * - Dark mode support
 * 
 * Usage:
 * ```tsx
 * import OutfitScorerScreen from '@/OutfitScorer/screens/OutfitScorerScreen';
 * // or use the route wrapper
 * import OutfitScorerScreen from '@/app/outfit-scorer';
 * ```
 */

// Main Screen
export { default as OutfitScorerScreen } from './screens/OutfitScorerScreen';

// Components
export * from './components';

// Utilities
export * from './utils';

// Hooks
export * from './hooks';

// Types
export * from './types';
