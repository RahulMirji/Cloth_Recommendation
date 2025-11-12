import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wand2 } from 'lucide-react-native';

export function ImageGenModelCard() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Active Model Showcase - Info Only */}
      <TouchableOpacity activeOpacity={1}>
        <LinearGradient
          colors={isDarkMode ? 
            ['rgba(236, 72, 153, 0.15)', 'rgba(219, 39, 119, 0.05)'] : 
            ['rgba(236, 72, 153, 0.08)', 'rgba(219, 39, 119, 0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeCard}
        >
          <View style={styles.activeCardHeader}>
            <Wand2 size={18} color="#EC4899" strokeWidth={2.5} />
            <Text style={[styles.activeLabel, isDarkMode && styles.textLight]}>ACTIVE</Text>
          </View>
          <Text style={[styles.activeName, isDarkMode && styles.textWhite]}>
            Pollinations Image
          </Text>
          <View style={styles.activeBadges}>
            <View style={[styles.badge, styles.badgePink]}>
              <Text style={styles.badgeText}>Quality 4/5</Text>
            </View>
            <View style={[styles.badge, styles.badgeYellow]}>
              <Text style={styles.badgeText}>Free</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Info Message */}
      <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
        <Text style={[styles.infoText, isDarkMode && styles.textMuted]}>
          Powered by Stable Diffusion & Flux. No API key needed.
        </Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  containerDark: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
  },

  // Active Model Card
  activeCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(236, 72, 153, 0.2)',
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  activeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EC4899',
    letterSpacing: 1.5,
  },
  activeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  activeBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgePink: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  badgeYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  infoCardDark: {
    backgroundColor: '#374151',
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Text Colors
  textWhite: {
    color: '#F9FAFB',
  },
  textLight: {
    color: '#E5E7EB',
  },
  textMuted: {
    color: '#9CA3AF',
  },
});
