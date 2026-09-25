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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      club_settings: {
        Row: {
          city: string
          founded: string
          history: string | null
          id: boolean
          identity: string | null
          league: string
          name: string
          sponsors: string | null
          updated_at: string
          venue_info: string | null
        }
        Insert: {
          city?: string
          founded?: string
          history?: string | null
          id?: boolean
          identity?: string | null
          league?: string
          name?: string
          sponsors?: string | null
          updated_at?: string
          venue_info?: string | null
        }
        Update: {
          city?: string
          founded?: string
          history?: string | null
          id?: boolean
          identity?: string | null
          league?: string
          name?: string
          sponsors?: string | null
          updated_at?: string
          venue_info?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      match_attendance: {
        Row: {
          created_at: string
          id: string
          match_id: string
          player_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          player_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_attendance_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_attendance_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          match_id: string
          minute: number | null
          note: string | null
          player_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          match_id: string
          minute?: number | null
          note?: string | null
          player_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          match_id?: string
          minute?: number | null
          note?: string | null
          player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_lineup: {
        Row: {
          id: string
          match_id: string
          player_id: string
        }
        Insert: {
          id?: string
          match_id: string
          player_id: string
        }
        Update: {
          id?: string
          match_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_lineup_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_lineup_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          chronicle: string | null
          created_at: string
          goals_against: number | null
          goals_for: number | null
          id: string
          is_home: boolean
          kickoff: string | null
          matchday: string | null
          mvp_comment: string | null
          mvp_player_id: string | null
          opponent: string
          opponent_crest_url: string | null
          preview: string | null
          published: boolean
          season_id: string | null
          status: string
          updated_at: string
          venue: string | null
          vikingada_description: string | null
          vikingada_display_mode: string
          vikingada_media_url: string | null
          vikingada_player_id: string | null
          vikingada_title: string | null
        }
        Insert: {
          chronicle?: string | null
          created_at?: string
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          is_home?: boolean
          kickoff?: string | null
          matchday?: string | null
          mvp_comment?: string | null
          mvp_player_id?: string | null
          opponent: string
          opponent_crest_url?: string | null
          preview?: string | null
          published?: boolean
          season_id?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
          vikingada_description?: string | null
          vikingada_display_mode?: string
          vikingada_media_url?: string | null
          vikingada_player_id?: string | null
          vikingada_title?: string | null
        }
        Update: {
          chronicle?: string | null
          created_at?: string
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          is_home?: boolean
          kickoff?: string | null
          matchday?: string | null
          mvp_comment?: string | null
          mvp_player_id?: string | null
          opponent?: string
          opponent_crest_url?: string | null
          preview?: string | null
          published?: boolean
          season_id?: string | null
          status?: string
          updated_at?: string
          venue?: string | null
          vikingada_description?: string | null
          vikingada_display_mode?: string
          vikingada_media_url?: string | null
          vikingada_player_id?: string | null
          vikingada_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_mvp_player_id_fkey"
            columns: ["mvp_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "matches_mvp_player_id_fkey"
            columns: ["mvp_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_vikingada_player_id_fkey"
            columns: ["vikingada_player_id"]
            isOneToOne: false
            referencedRelation: "player_stats"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "matches_vikingada_player_id_fkey"
            columns: ["vikingada_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_mode: string
          event_name: string | null
          featured: boolean
          id: string
          match_id: string | null
          media_type: string
          season_id: string | null
          title: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_mode?: string
          event_name?: string | null
          featured?: boolean
          id?: string
          match_id?: string | null
          media_type?: string
          season_id?: string | null
          title?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_mode?: string
          event_name?: string | null
          featured?: boolean
          id?: string
          match_id?: string | null
          media_type?: string
          season_id?: string | null
          title?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          excerpt: string | null
          id: string
          post_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          post_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          post_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          full_name: string
          id: string
          jersey_number: number | null
          joined_on: string | null
          nickname: string | null
          photo_display_mode: string
          photo_url: string | null
          position: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          full_name: string
          id?: string
          jersey_number?: number | null
          joined_on?: string | null
          nickname?: string | null
          photo_display_mode?: string
          photo_url?: string | null
          position?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          full_name?: string
          id?: string
          jersey_number?: number | null
          joined_on?: string | null
          nickname?: string | null
          photo_display_mode?: string
          photo_url?: string | null
          position?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string
          display_mode: string
          id: string
          media_type: string
          post_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          display_mode?: string
          id?: string
          media_type?: string
          post_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          display_mode?: string
          id?: string
          media_type?: string
          post_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          display_mode: string
          id: string
          media_type: string | null
          media_url: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          display_mode?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          display_mode?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          id: string
          is_current: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean
          name?: string
        }
        Relationships: []
      }
      site_images: {
        Row: {
          created_at: string
          display_mode: string
          key: string
          path: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          display_mode?: string
          key: string
          path: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          display_mode?: string
          key?: string
          path?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          destination_url: string
          display_order: number
          id: string
          is_active: boolean
          logo_url: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_url: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_url?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      standings_settings: {
        Row: {
          id: boolean
          points_per_win: number
          tiebreakers: string[]
          updated_at: string
        }
        Insert: {
          id?: boolean
          points_per_win?: number
          tiebreakers?: string[]
          updated_at?: string
        }
        Update: {
          id?: boolean
          points_per_win?: number
          tiebreakers?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      standings_teams: {
        Row: {
          created_at: string
          e: number
          g: number
          gc: number
          gf: number
          id: string
          is_vikingos: boolean
          manual_order: number
          name: string
          p: number
          pj: number
          pts: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          e?: number
          g?: number
          gc?: number
          gf?: number
          id?: string
          is_vikingos?: boolean
          manual_order?: number
          name: string
          p?: number
          pj?: number
          pts?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          e?: number
          g?: number
          gc?: number
          gf?: number
          id?: string
          is_vikingos?: boolean
          manual_order?: number
          name?: string
          p?: number
          pj?: number
          pts?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      player_stats: {
        Row: {
          active: boolean | null
          full_name: string | null
          jersey_number: number | null
          nickname: string | null
          photo_url: string | null
          pj: number | null
          placeholder: number | null
          player_id: string | null
          position: string | null
          season_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_master: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      match_attendance_stats: {
        Args: { _match_id: string }
        Returns: {
          confirmed: number
          total: number
        }[]
      }
    }
    Enums: {
      app_role: "master" | "admin" | "vikingo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["master", "admin", "vikingo"],
    },
  },
} as const
