/**
 * Age Group Card Component
 * 
 * Expandable card showing age group statistics and user list.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgeGroupCardProps } from '../types/demographics.types';
import { UserMiniCard } from './UserMiniCard';
import { GENDER_COLORS, ANIMATION_DURATION } from '../constants/demographicsConfig';
import { getThemedAdminColors } from '../constants/config';

export const AgeGroupCard: React.FC<AgeGroupCardProps> = ({
  ageGroup,
  gender,
  isDarkMode,
  isExpanded,
  onToggle,
}) => {
  const colors = getThemedAdminColors(isDarkMode);
  const genderColors = GENDER_COLORS[gender];
  
  const rotateAnim = React.useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  
  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [isExpanded]);
  
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? colors.cardDark : colors.card,
        borderColor: isDarkMode ? colors.borderDark : colors.border,
      }
    ]}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: genderColors.primary + '15' }
          ]}>
            <Ionicons name="people" size={20} color={genderColors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[
              styles.ageGroupLabel,
              { color: isDarkMode ? colors.textDark : colors.text }
            ]}>
              {ageGroup.label}
            </Text>
            <Text style={[
              styles.ageGroupSubtext,
              { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
            ]}>
              {ageGroup.count} {ageGroup.count === 1 ? 'user' : 'users'}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[
            styles.percentageBadge,
            { backgroundColor: genderColors.primary }
          ]}>
            <Text style={styles.percentageText}>
              {ageGroup.percentage}%
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons 
              name="chevron-down" 
              size={20} 
              color={isDarkMode ? colors.textSecondaryDark : colors.textSecondary} 
            />
          </Animated.View>
        </View>
      </TouchableOpacity>
      
      {/* Progress Bar */}
      <View style={[
        styles.progressBarContainer,
        { backgroundColor: isDarkMode ? colors.borderDark : colors.border }
      ]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${ageGroup.percentage}%`,
              backgroundColor: genderColors.primary,
            }
          ]}
        />
      </View>
      
      {/* Expanded Content */}
      {isExpanded && ageGroup.users.length > 0 && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <Text style={[
            styles.userListTitle,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]}>
            Users in this age group:
          </Text>
          {ageGroup.users.map((user) => (
            <UserMiniCard
              key={user.id}
              user={user}
              isDarkMode={isDarkMode}
            />
          ))}
        </View>
      )}
      
      {isExpanded && ageGroup.users.length === 0 && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <Text style={[
            styles.emptyText,
            { color: isDarkMode ? colors.textSecondaryDark : colors.textSecondary }
          ]}>
            No users in this age group
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  ageGroupLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  ageGroupSubtext: {
    fontSize: 13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  percentageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentageText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userListTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
