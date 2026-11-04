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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      competitions: {
        Row: {
          category: Database["public"]["Enums"]["pageant_category"]
          cover_url: string | null
          created_at: string
          description: string | null
          edition: string | null
          id: string
          organizer_id: string | null
          published: boolean
          slug: string
          title: string
          voting_ends_at: string | null
          voting_open: boolean
          voting_starts_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["pageant_category"]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          id?: string
          organizer_id?: string | null
          published?: boolean
          slug: string
          title: string
          voting_ends_at?: string | null
          voting_open?: boolean
          voting_starts_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["pageant_category"]
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          id?: string
          organizer_id?: string | null
          published?: boolean
          slug?: string
          title?: string
          voting_ends_at?: string | null
          voting_open?: boolean
          voting_starts_at?: string | null
        }
        Relationships: []
      }
      contestants: {
        Row: {
          age: number | null
          bio: string | null
          competition_id: string
          country: string
          country_code: string
          created_at: string
          height: string | null
          id: string
          name: string
          photo_url: string | null
          position: number | null
        }
        Insert: {
          age?: number | null
          bio?: string | null
          competition_id: string
          country: string
          country_code: string
          created_at?: string
          height?: string | null
          id?: string
          name: string
          photo_url?: string | null
          position?: number | null
        }
        Update: {
          age?: number | null
          bio?: string | null
          competition_id?: string
          country?: string
          country_code?: string
          created_at?: string
          height?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contestants_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_applications: {
        Row: {
          country: string | null
          created_at: string
          id: string
          message: string | null
          organization_name: string
          status: Database["public"]["Enums"]["application_status"]
          user_id: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_name: string
          status?: Database["public"]["Enums"]["application_status"]
          user_id: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          message?: string | null
          organization_name?: string
          status?: Database["public"]["Enums"]["application_status"]
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          competition_id: string
          contestant_id: string
          created_at: string
          id: string
          user_id: string
          vote_date: string
        }
        Insert: {
          competition_id: string
          contestant_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_date?: string
        }
        Update: {
          competition_id?: string
          contestant_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_contestant_id_fkey"
            columns: ["contestant_id"]
            isOneToOne: false
            referencedRelation: "contestants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      all_results: {
        Args: never
        Returns: {
          competition_id: string
          contestant_id: string
          votes: number
        }[]
      }
      can_manage_competition: {
        Args: { _competition_id: string }
        Returns: boolean
      }
      cast_vote: { Args: { _contestant_id: string }; Returns: undefined }
      competition_results: {
        Args: { _competition_id: string }
        Returns: {
          contestant_id: string
          votes: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_voting_live: { Args: { _competition_id: string }; Returns: boolean }
      review_organizer: {
        Args: { _application_id: string; _approve: boolean }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "organizer" | "user"
      application_status: "pending" | "approved" | "rejected"
      pageant_category: "miss" | "mister"
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
      app_role: ["super_admin", "organizer", "user"],
      application_status: ["pending", "approved", "rejected"],
      pageant_category: ["miss", "mister"],
    },
  },
} as const
