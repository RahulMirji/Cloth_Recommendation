import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Sparkles } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const userName = 'Rahul';

  return (
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hey {userName} 👋</Text>
          <Text style={styles.subtitle}>Ready to get some style tips?</Text>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/ai-stylist')}
          >
            <LinearGradient
              colors={[Colors.gradient.start, Colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Camera size={32} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>AI Stylist</Text>
              <Text style={styles.cardDescription}>
                Get real-time outfit recommendations with voice interaction
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/outfit-scorer')}
          >
            <LinearGradient
              colors={[Colors.secondary, Colors.secondaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Sparkles size={32} color={Colors.white} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardTitle}>Outfit Scorer</Text>
              <Text style={styles.cardDescription}>
                Upload a photo and get your outfit scored with feedback
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoStep}>1. Choose your mode</Text>
            <Text style={styles.infoText}>
              Live AI Stylist for real-time feedback or Outfit Scorer for photo analysis
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoStep}>2. Get AI-powered insights</Text>
            <Text style={styles.infoText}>
              Our AI analyzes your outfit and provides personalized recommendations
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoStep}>3. Level up your style</Text>
            <Text style={styles.infoText}>
              Apply the suggestions and become more confident in your fashion choices
            </Text>
          </View>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '400' as const,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 40,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardGradient: {
    padding: 28,
    minHeight: 200,
    justifyContent: 'center',
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.white,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
