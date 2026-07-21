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
      artist_profile: {
        Row: {
          album_cover_url: string | null
          artist_name: string
          biography: string | null
          created_at: string
          hero_artwork_url: string | null
          hero_headline: string | null
          hero_subheading: string | null
          id: string
          management_email: string | null
          management_phone: string | null
          portrait_url: string | null
          singleton: boolean
          updated_at: string
        }
        Insert: {
          album_cover_url?: string | null
          artist_name?: string
          biography?: string | null
          created_at?: string
          hero_artwork_url?: string | null
          hero_headline?: string | null
          hero_subheading?: string | null
          id?: string
          management_email?: string | null
          management_phone?: string | null
          portrait_url?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          album_cover_url?: string | null
          artist_name?: string
          biography?: string | null
          created_at?: string
          hero_artwork_url?: string | null
          hero_headline?: string | null
          hero_subheading?: string | null
          id?: string
          management_email?: string | null
          management_phone?: string | null
          portrait_url?: string | null
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          city: string
          created_at: string
          display_order: number
          event_date: string
          id: string
          is_visible: boolean
          notes: string | null
          ticket_url: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          city: string
          created_at?: string
          display_order?: number
          event_date: string
          id?: string
          is_visible?: boolean
          notes?: string | null
          ticket_url?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          city?: string
          created_at?: string
          display_order?: number
          event_date?: string
          id?: string
          is_visible?: boolean
          notes?: string | null
          ticket_url?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_visible: boolean
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_visible?: boolean
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_visible?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          body_md: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_md?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      merch_items: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          display_order: number
          external_url: string | null
          id: string
          image_url: string | null
          is_visible: boolean
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name: string
          price_cents?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          body: string | null
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      streaming_links: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_visible: boolean
          platform: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          platform: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_visible?: boolean
          platform?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          artist: string | null
          audio_url: string | null
          cover_url: string | null
          created_at: string
          display_order: number
          duration_seconds: number | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          artist?: string | null
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          display_order?: number
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          artist?: string | null
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          display_order?: number
          duration_seconds?: number | null
          id?: string
          is_published?: boolean
          title?: string
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
      [_ in never]: never
    }
    Functions: {
      admin_exists: { Args: never; Returns: boolean }
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "editor"],
    },
  },
} as const
