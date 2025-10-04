/**
 * Supabase Connection Test
 * 
 * Diagnostic tool to test Supabase connection and configuration
 */

import { supabase } from '@/lib/supabase';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function SupabaseTestScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      addResult('Testing Supabase connection...');
      
      // Test 1: Check if client is initialized
      if (!supabase) {
        addResult('❌ Supabase client not initialized');
        return;
      }
      addResult('✅ Supabase client initialized');
      
      // Test 2: Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addResult(`❌ Session check failed: ${sessionError.message}`);
      } else {
        addResult(`✅ Session check successful. Logged in: ${!!sessionData.session}`);
        if (sessionData.session) {
          addResult(`   User: ${sessionData.session.user.email}`);
        }
      }
      
      // Test 3: Try to access user_profiles table (should fail if not authenticated)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      if (profileError) {
        addResult(`ℹ️ Profile table access: ${profileError.message}`);
      } else {
        addResult('✅ Profile table accessible');
      }
      
      // Test 4: Check auth settings
      addResult('📋 Supabase URL: ' + process.env.EXPO_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
      addResult('📋 Anon key configured: ' + (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Yes' : 'No'));
      
    } catch (error: any) {
      addResult(`❌ Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSignUp = async () => {
    setIsLoading(true);
    addResult('Testing sign up with test credentials...');
    
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'Test123456!';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Test User',
          },
        },
      });
      
      if (error) {
        addResult(`❌ Sign up failed: ${error.message}`);
        addResult(`   Status: ${error.status}`);
      } else {
        addResult(`✅ Sign up successful!`);
        addResult(`   User ID: ${data.user?.id}`);
        addResult(`   Email: ${data.user?.email}`);
        addResult(`   Confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No (check email)'}`);
      }
    } catch (error: any) {
      addResult(`❌ Exception: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.gradient.start, Colors.gradient.end]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Text style={styles.title}>Supabase Connection Test</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testConnection}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={testSignUp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Sign Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={() => setResults([])}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Results:</Text>
          {results.length === 0 ? (
            <Text style={styles.emptyText}>Press a button to run tests</Text>
          ) : (
            results.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: FontSizes.heading,
    fontWeight: FontWeights.bold as any,
    color: Colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    fontSize: FontSizes.body,
    fontWeight: FontWeights.semibold as any,
    color: Colors.primary,
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: FontSizes.subheading,
    fontWeight: FontWeights.bold as any,
    color: Colors.white,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: FontSizes.body,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  resultText: {
    fontSize: FontSizes.small,
    color: Colors.white,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});
