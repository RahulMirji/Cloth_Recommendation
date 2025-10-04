// Auto-generated types from Supabase
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          age: number | null
          gender: string | null
          style_preferences: string[] | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          age?: number | null
          gender?: string | null
          style_preferences?: string[] | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age?: number | null
          gender?: string | null
          style_preferences?: string[] | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      outfit_analyses: {
        Row: {
          id: string
          user_id: string
          image_url: string
          analysis_type: 'ai_stylist' | 'outfit_scorer'
          ai_response: string
          score: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          analysis_type: 'ai_stylist' | 'outfit_scorer'
          ai_response: string
          score?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          analysis_type?: 'ai_stylist' | 'outfit_scorer'
          ai_response?: string
          score?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      stylist_recommendations: {
        Row: {
          id: string
          user_id: string
          occasion: string
          style_preference: string
          weather: string | null
          ai_response: string
          bookmarked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          occasion: string
          style_preference: string
          weather?: string | null
          ai_response: string
          bookmarked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          occasion?: string
          style_preference?: string
          weather?: string | null
          ai_response?: string
          bookmarked?: boolean
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          is_dark_mode: boolean
          notifications_enabled: boolean
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_dark_mode?: boolean
          notifications_enabled?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_dark_mode?: boolean
          notifications_enabled?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
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
  }
}
