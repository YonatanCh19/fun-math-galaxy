export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      competition_invitations: {
        Row: {
          competition_id: string
          created_at: string
          from_profile_id: string
          id: string
          status: string
          to_profile_id: string
          updated_at: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          from_profile_id: string
          id?: string
          status?: string
          to_profile_id: string
          updated_at?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          from_profile_id?: string
          id?: string
          status?: string
          to_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_invitations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "online_competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      online_competitions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          player1_id: string
          player1_score: number
          player2_id: string
          player2_score: number
          started_at: string | null
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          player1_id: string
          player1_score?: number
          player2_id: string
          player2_score?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          player1_id?: string
          player1_score?: number
          player2_id?: string
          player2_score?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_character: string | null
          created_at: string
          id: string
          name: string
          pin: string | null
          user_id: string
        }
        Insert: {
          avatar_character?: string | null
          created_at?: string
          id?: string
          name: string
          pin?: string | null
          user_id: string
        }
        Update: {
          avatar_character?: string | null
          created_at?: string
          id?: string
          name?: string
          pin?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          is_online?: boolean
          last_seen?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          is_online?: boolean
          last_seen?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          coins: number
          correct: number
          created_at: string
          free_games: number
          id: string
          profile_id: string
          total: number
          trophies: number
          updated_at: string
        }
        Insert: {
          coins?: number
          correct?: number
          created_at?: string
          free_games?: number
          id?: string
          profile_id: string
          total?: number
          trophies?: number
          updated_at?: string
        }
        Update: {
          coins?: number
          correct?: number
          created_at?: string
          free_games?: number
          id?: string
          profile_id?: string
          total?: number
          trophies?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_profile_owner: {
        Args: { profile_id_to_check: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
