/**
 * Out of Credits Modal
 * Displays when user runs out of credits with upgrade CTA
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Shirt, 
  Sparkles, 
  Calendar, 
  Zap, 
  IndianRupee,
  X 
} from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import getThemedColors from '@/constants/themedColors';

const { width } = Dimensions.get('window');

interface OutOfCreditsModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const OutOfCreditsModal: React.FC<OutOfCreditsModalProps> = ({
  visible,
  onClose,
  onUpgrade,
}) => {
  // Theme detection
  const colorScheme = useColorScheme();
  const { settings } = useApp();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;
  const themedColors = getThemedColors(isDarkMode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView 
        intensity={80} 
        tint={isDarkMode ? 'dark' : 'light'} 
        style={styles.overlay}
      >
        <View style={[
          styles.container,
          { backgroundColor: isDarkMode ? '#1A1A1A' : '#fff' }
        ]}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <X size={24} color={themedColors.text} />
            </TouchableOpacity>

            {/* Icon with Badge */}
            <View style={styles.iconContainer}>
              <View style={[
                styles.iconCircle,
                { backgroundColor: isDarkMode ? '#2D1B69' : '#F3E8FF' }
              ]}>
                <Shirt size={64} color="#8B5CF6" strokeWidth={1.5} />
              </View>
              <View style={styles.badge}>
                <X size={24} color="#fff" />
              </View>
            </View>

            {/* Heading */}
            <Text style={[styles.heading, { color: themedColors.text }]}>
              Out of Credits!
            </Text>
            <Text style={[styles.description, { color: themedColors.textSecondary }]}>
              You've used all your free credits for Outfit Scorer. 
              Upgrade to continue analyzing your outfits with AI.
            </Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <FeatureItem 
                icon={<Sparkles size={24} color="#8B5CF6" />}
                title="100 Credits"
                description="Analyze 100 outfits"
                isDarkMode={isDarkMode}
                themedColors={themedColors}
              />
              <FeatureItem 
                icon={<Calendar size={24} color="#8B5CF6" />}
                title="30 Days Access"
                description="Valid for one month"
                isDarkMode={isDarkMode}
                themedColors={themedColors}
              />
              <FeatureItem 
                icon={<Zap size={24} color="#8B5CF6" />}
                title="Instant Activation"
                description="Credits added immediately"
                isDarkMode={isDarkMode}
                themedColors={themedColors}
              />
              <FeatureItem 
                icon={<IndianRupee size={24} color="#8B5CF6" />}
                title="₹29/month"
                description="Affordable pricing"
                isDarkMode={isDarkMode}
                themedColors={themedColors}
              />
            </View>

            {/* Upgrade Button */}
            <TouchableOpacity
              style={styles.upgradeButtonContainer}
              onPress={onUpgrade}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeGradient}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                <Sparkles size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Maybe Later Button */}
            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.laterButtonText,
                { color: themedColors.textSecondary }
              ]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDarkMode: boolean;
  themedColors: any;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ 
  icon, 
  title, 
  description,
  isDarkMode,
  themedColors
}) => (
  <View style={[
    styles.featureItem,
    { backgroundColor: isDarkMode ? '#1F1F1F' : '#F9FAFB' }
  ]}>
    <View style={styles.featureIcon}>{icon}</View>
    <View style={styles.featureText}>
      <Text style={[styles.featureTitle, { color: themedColors.text }]}>
        {title}
      </Text>
      <Text style={[styles.featureDescription, { color: themedColors.textSecondary }]}>
        {description}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 24,
    marginTop: 12,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  upgradeButtonContainer: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  upgradeGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  laterButton: {
    paddingVertical: 12,
  },
  laterButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
