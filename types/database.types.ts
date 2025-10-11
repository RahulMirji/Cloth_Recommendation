/**
 * Supabase Database Types
 * 
 * Auto-generated types for the Supabase database schema.
 * These types ensure type-safety when interacting with the database.
 * 
 * Generated: October 4, 2025
 * Project: AI Cloth Recommendation
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      analysis_history: {
        Row: {
          conversation_data: Json | null
          created_at: string | null
          feedback: Json | null
          id: string
          image_url: string | null
          result: string
          score: number | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_data?: Json | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          image_url?: string | null
          result: string
          score?: number | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_data?: Json | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          image_url?: string | null
          result?: string
          score?: number | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          is_dark_mode: boolean | null
          save_history: boolean | null
          updated_at: string | null
          use_cloud_ai: boolean | null
          use_voice_interaction: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_dark_mode?: boolean | null
          save_history?: boolean | null
          updated_at?: string | null
          use_cloud_ai?: boolean | null
          use_voice_interaction?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_dark_mode?: boolean | null
          save_history?: boolean | null
          updated_at?: string | null
          use_cloud_ai?: boolean | null
          use_voice_interaction?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_recommendations: {
        Row: {
          analysis_id: string
          created_at: string | null
          id: string
          item_type: string
          marketplace: string
          missing_reason: string | null
          price: string | null
          priority: number | null
          product_image_url: string
          product_name: string
          product_url: string
          rating: number | null
          user_id: string
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          id?: string
          item_type: string
          marketplace: string
          missing_reason?: string | null
          price?: string | null
          priority?: number | null
          product_image_url: string
          product_name: string
          product_url: string
          rating?: number | null
          user_id: string
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          id?: string
          item_type?: string
          marketplace?: string
          missing_reason?: string | null
          price?: string | null
          priority?: number | null
          product_image_url?: string
          product_name?: string
          product_url?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analysis_history"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          age: number | null
          bio: string | null
          created_at: string | null
          email: string
          gender: string | null
          id: string
          name: string
          phone: string | null
          profile_image: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          created_at?: string | null
          email: string
          gender?: string | null
          id?: string
          name: string
          phone?: string | null
          profile_image?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          created_at?: string | null
          email?: string
          gender?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_image?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
