/**
 * Footer Component
 * 
 * Professional footer displayed consistently across all screens in the app.
 * 
 * Features:
 * - Social media links
 * - App version and copyright info
 * - Quick links (Privacy Policy, Terms, Contact)
 * - Dark mode support
 * - Consistent styling across all screens
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Linking,
  useColorScheme,
} from 'react-native';
import { 
  Mail, 
  Github, 
  Linkedin, 
  Instagram, 
  Twitter,
  Heart,
  ExternalLink,
} from 'lucide-react-native';

import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { useApp } from '@/contexts/AppContext';

interface FooterProps {
  showSocialLinks?: boolean;
  showQuickLinks?: boolean;
}

export function Footer({ 
  showSocialLinks = true, 
  showQuickLinks = true 
}: FooterProps) {
  const { settings } = useApp();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark' || settings.isDarkMode;

  const currentYear = new Date().getFullYear();
  const appVersion = '1.1.8';

  const socialLinks = [
    {
      id: 'email',
      icon: Mail,
      url: 'mailto:devprahulmirji@gmail.com',
      label: 'Email',
    },
    {
      id: 'github',
      icon: Github,
      url: 'https://github.com/RahulMirji',
      label: 'GitHub',
    },
    {
      id: 'linkedin',
      icon: Linkedin,
      url: 'https://www.linkedin.com/in/rahul-mirji',
      label: 'LinkedIn',
    },
    {
      id: 'instagram',
      icon: Instagram,
      url: 'https://instagram.com',
      label: 'Instagram',
    },
    {
      id: 'twitter',
      icon: Twitter,
      url: 'https://twitter.com',
      label: 'Twitter',
    },
  ];

  const quickLinks = [
    {
      id: 'privacy',
      label: 'Privacy Policy',
      url: 'https://aidresser.com/privacy',
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      url: 'https://aidresser.com/terms',
    },
    {
      id: 'contact',
      label: 'Contact Us',
      url: 'mailto:devprahulmirji@gmail.com',
    },
    {
      id: 'about',
      label: 'About Us',
      url: 'https://aidresser.com/about',
    },
  ];

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Divider Line */}
      <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

      {/* Social Links */}
      {showSocialLinks && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Connect With Us
          </Text>
          <View style={styles.socialContainer}>
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <TouchableOpacity
                  key={social.id}
                  style={[styles.socialButton, isDarkMode && styles.socialButtonDark]}
                  onPress={() => handleLinkPress(social.url)}
                  activeOpacity={0.7}
                >
                  <IconComponent 
                    size={20} 
                    color={isDarkMode ? Colors.white : Colors.text}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Quick Links */}
      {showQuickLinks && (
        <View style={styles.section}>
          <View style={styles.quickLinksContainer}>
            {quickLinks.map((link, index) => (
              <React.Fragment key={link.id}>
                <TouchableOpacity
                  onPress={() => handleLinkPress(link.url)}
                  activeOpacity={0.7}
                  style={styles.quickLinkButton}
                >
                  <Text style={[styles.quickLinkText, isDarkMode && styles.quickLinkTextDark]}>
                    {link.label}
                  </Text>
                  <ExternalLink 
                    size={12} 
                    color={isDarkMode ? Colors.textLight : Colors.textSecondary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
                {index < quickLinks.length - 1 && (
                  <Text style={[styles.separator, isDarkMode && styles.separatorDark]}>
                    •
                  </Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* App Info */}
      <View style={styles.section}>
        <Text style={[styles.appName, isDarkMode && styles.appNameDark]}>
          Cloth Recommendation
        </Text>
        <Text style={[styles.tagline, isDarkMode && styles.taglineDark]}>
          Your AI-Powered Fashion Assistant
        </Text>
      </View>

      {/* Made with Love */}
      <View style={styles.madeWithLove}>
        <Text style={[styles.madeWithText, isDarkMode && styles.madeWithTextDark]}>
          Developed by Rahul Mirji and team
        </Text>
      </View>
      
      {/* Guidance */}
      <View style={styles.guidanceContainer}>
        <Text style={[styles.guidanceText, isDarkMode && styles.guidanceTextDark]}>
          Under the guidance of Dr. Tabassum Ar
        </Text>
        <Text style={[styles.collegeText, isDarkMode && styles.collegeTextDark]}>
          HKBK College of Engineering
        </Text>
      </View>

      {/* Copyright & Version */}
      <View style={styles.copyrightContainer}>
        <Text style={[styles.copyright, isDarkMode && styles.copyrightDark]}>
          © {currentYear} Cloth Recommendation. All rights reserved.
        </Text>
        <Text style={[styles.version, isDarkMode && styles.versionDark]}>
          Version {appVersion}
        </Text>
      </View>

      {/* Tech Stack Badge */}
      <View style={styles.techBadgeContainer}>
        <View style={[styles.techBadge, isDarkMode && styles.techBadgeDark]}>
          <Text style={[styles.techBadgeText, isDarkMode && styles.techBadgeTextDark]}>
            Built with React Native + Expo + Supabase
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginTop: 40,
  },
  containerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 24,
  },
  dividerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  section: {
    marginBottom: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: Colors.white,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  socialButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  quickLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  quickLinkText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  quickLinkTextDark: {
    color: Colors.textLight,
  },
  separator: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginHorizontal: 8,
  },
  separatorDark: {
    color: Colors.textLight,
  },
  appName: {
    fontSize: 22,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  appNameDark: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  taglineDark: {
    color: Colors.textLight,
  },
  madeWithLove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },
  madeWithText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  madeWithTextDark: {
    color: Colors.textLight,
  },
  guidanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  guidanceText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  guidanceTextDark: {
    color: Colors.textLight,
  },
  collegeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: FontWeights.semibold,
  },
  collegeTextDark: {
    color: Colors.textLight,
  },
  heartIcon: {
    marginHorizontal: 2,
  },
  copyrightContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  copyright: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  copyrightDark: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  version: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  versionDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  techBadgeContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  techBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  techBadgeDark: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  techBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: FontWeights.semibold,
  },
  techBadgeTextDark: {
    color: Colors.primary,
  },
});
