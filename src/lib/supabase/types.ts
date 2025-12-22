/**
 * Supabase Database Types
 *
 * These types represent the database schema for the LakeB2B Social Post Creator.
 * They provide TypeScript type safety for all Supabase operations.
 */

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
      user_profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          total_points: number
          level: number
          generation_count: number
          achievements: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          total_points?: number
          level?: number
          generation_count?: number
          achievements?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          total_points?: number
          level?: number
          generation_count?: number
          achievements?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          user_id: string
          image_url: string
          prompt: string
          headline: string | null
          style: string
          meme_format: string | null
          size: string | null
          logo_position: string | null
          logo_size: number | null
          logo_opacity: number | null
          logo_rotation: number | null
          created_at: string
          is_public: boolean
          likes_count: number
          views_count: number
        }
        Insert: {
          id?: string
          user_id: string
          image_url: string
          prompt: string
          headline?: string | null
          style: string
          meme_format?: string | null
          size?: string | null
          logo_position?: string | null
          logo_size?: number | null
          logo_opacity?: number | null
          logo_rotation?: number | null
          created_at?: string
          is_public?: boolean
          likes_count?: number
          views_count?: number
        }
        Update: {
          id?: string
          user_id?: string
          image_url?: string
          prompt?: string
          headline?: string | null
          style?: string
          meme_format?: string | null
          size?: string | null
          logo_position?: string | null
          logo_size?: number | null
          logo_opacity?: number | null
          logo_rotation?: number | null
          created_at?: string
          is_public?: boolean
          likes_count?: number
          views_count?: number
        }
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      post_views: {
        Row: {
          id: string
          post_id: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string | null
          viewed_at?: string
        }
      }
      linkedin_connections: {
        Row: {
          id: string
          user_id: string
          linkedin_id: string
          access_token: string
          refresh_token: string | null
          token_expires_at: string
          profile_name: string | null
          profile_url: string | null
          profile_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          linkedin_id: string
          access_token: string
          refresh_token?: string | null
          token_expires_at: string
          profile_name?: string | null
          profile_url?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          linkedin_id?: string
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string
          profile_name?: string | null
          profile_url?: string | null
          profile_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scheduled_posts: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          linkedin_connection_id: string | null
          post_text: string
          scheduled_for: string
          status: 'pending' | 'published' | 'failed'
          linkedin_post_id: string | null
          error_message: string | null
          created_at: string
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          linkedin_connection_id?: string | null
          post_text: string
          scheduled_for: string
          status?: 'pending' | 'published' | 'failed'
          linkedin_post_id?: string | null
          error_message?: string | null
          created_at?: string
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          linkedin_connection_id?: string | null
          post_text?: string
          scheduled_for?: string
          status?: 'pending' | 'published' | 'failed'
          linkedin_post_id?: string | null
          error_message?: string | null
          created_at?: string
          published_at?: string | null
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

// Convenience types for common operations
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostLike = Database['public']['Tables']['post_likes']['Row']
export type PostView = Database['public']['Tables']['post_views']['Row']
export type LinkedInConnection = Database['public']['Tables']['linkedin_connections']['Row']
export type ScheduledPost = Database['public']['Tables']['scheduled_posts']['Row']

// Insert types
export type NewUserProfile = Database['public']['Tables']['user_profiles']['Insert']
export type NewPost = Database['public']['Tables']['posts']['Insert']
export type NewPostLike = Database['public']['Tables']['post_likes']['Insert']
export type NewLinkedInConnection = Database['public']['Tables']['linkedin_connections']['Insert']
export type NewScheduledPost = Database['public']['Tables']['scheduled_posts']['Insert']

// Update types
export type UpdateUserProfile = Database['public']['Tables']['user_profiles']['Update']
export type UpdatePost = Database['public']['Tables']['posts']['Update']
export type UpdateScheduledPost = Database['public']['Tables']['scheduled_posts']['Update']
