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
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_pinned: boolean
          notify_members: boolean
          show_on_login: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          notify_members?: boolean
          show_on_login?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          is_pinned?: boolean
          notify_members?: boolean
          show_on_login?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_announcements: {
        Row: {
          announcement_id: string
          dismissed_at: string
          member_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          member_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          member_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          assigned_at: string
          assigned_by: string
          badge_type: string
          id: string
          member_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          badge_type: string
          id?: string
          member_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          badge_type?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "badges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      event_field_responses: {
        Row: {
          created_at: string
          field_id: string
          id: string
          registration_id: string
          response_value: string | null
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          registration_id: string
          response_value?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          registration_id?: string
          response_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_field_responses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "event_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_field_responses_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_fields: {
        Row: {
          created_at: string
          display_order: number
          event_id: string
          field_label: string
          field_options: Json | null
          field_type: string
          id: string
          required: boolean
        }
        Insert: {
          created_at?: string
          display_order?: number
          event_id: string
          field_label: string
          field_options?: Json | null
          field_type: string
          id?: string
          required?: boolean
        }
        Update: {
          created_at?: string
          display_order?: number
          event_id?: string
          field_label?: string
          field_options?: Json | null
          field_type?: string
          id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "event_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image_url: string | null
          capacity: number | null
          capacity_mode: string
          created_at: string
          description: string | null
          early_bird_ends_at: string | null
          early_bird_price: number | null
          event_date: string
          event_type: string
          flyer_url: string | null
          id: string
          location: string | null
          registration_closes_at: string | null
          registration_open: boolean
          rich_description: string | null
          slug: string | null
          status: Database["public"]["Enums"]["event_status"]
          ticket_price: number
          title: string
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          capacity?: number | null
          capacity_mode?: string
          created_at?: string
          description?: string | null
          early_bird_ends_at?: string | null
          early_bird_price?: number | null
          event_date: string
          event_type?: string
          flyer_url?: string | null
          id?: string
          location?: string | null
          registration_closes_at?: string | null
          registration_open?: boolean
          rich_description?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          ticket_price?: number
          title: string
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          capacity?: number | null
          capacity_mode?: string
          created_at?: string
          description?: string | null
          early_bird_ends_at?: string | null
          early_bird_price?: number | null
          event_date?: string
          event_type?: string
          flyer_url?: string | null
          id?: string
          location?: string | null
          registration_closes_at?: string | null
          registration_open?: boolean
          rich_description?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          ticket_price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          big_id: string | null
          birthday: string | null
          city: string | null
          country: string
          created_at: string
          email: string
          first_name: string
          home_address: string | null
          id: string
          last_name: string
          linkedin_url: string | null
          nickname: string | null
          phone: string | null
          pin_number: string | null
          pledge_class: string | null
          profile_photo_url: string | null
          referred_by: string | null
          newsletter_opt_out: boolean
          onboarding_dismissed: boolean
          show_address: boolean
          show_birthday: boolean
          show_phone: boolean
          state: string | null
          // Manually patched: CHECK constraint values not captured by CLI codegen
          status: "pending" | "member" | "admin" | "stub"
          street_address: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          big_id?: string | null
          birthday?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email: string
          first_name: string
          home_address?: string | null
          id?: string
          last_name: string
          linkedin_url?: string | null
          nickname?: string | null
          phone?: string | null
          pin_number?: string | null
          pledge_class?: string | null
          profile_photo_url?: string | null
          referred_by?: string | null
          newsletter_opt_out?: boolean
          onboarding_dismissed?: boolean
          show_address?: boolean
          show_birthday?: boolean
          show_phone?: boolean
          state?: string | null
          // Manually patched: CHECK constraint values not captured by CLI codegen
          status?: "pending" | "member" | "admin" | "stub"
          street_address?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          big_id?: string | null
          birthday?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          home_address?: string | null
          id?: string
          last_name?: string
          linkedin_url?: string | null
          nickname?: string | null
          phone?: string | null
          pin_number?: string | null
          pledge_class?: string | null
          profile_photo_url?: string | null
          referred_by?: string | null
          newsletter_opt_out?: boolean
          onboarding_dismissed?: boolean
          show_address?: boolean
          show_birthday?: boolean
          show_phone?: boolean
          state?: string | null
          // Manually patched: CHECK constraint values not captured by CLI codegen
          status?: "pending" | "member" | "admin" | "stub"
          street_address?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_big_id_fkey"
            columns: ["big_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          email: string
          expires_at: string
          first_name: string
          id: string
          last_name: string
          referred_by: string
          status: Database["public"]["Enums"]["referral_status"]
          token: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          first_name: string
          id?: string
          last_name: string
          referred_by: string
          status?: Database["public"]["Enums"]["referral_status"]
          token?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          last_name?: string
          referred_by?: string
          status?: Database["public"]["Enums"]["referral_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_guests: {
        Row: {
          guest_name: string
          id: string
          registration_id: string
        }
        Insert: {
          guest_name: string
          id?: string
          registration_id: string
        }
        Update: {
          guest_name?: string
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_guests_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_payments: {
        Row: {
          amount: number
          created_at: string
          guest_count_delta: number
          id: string
          registration_id: string
          stripe_payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          guest_count_delta: number
          id?: string
          registration_id: string
          stripe_payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          guest_count_delta?: number
          id?: string
          registration_id?: string
          stripe_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          amount_paid: number | null
          applied_price: number | null
          dietary_restrictions: string | null
          email: string
          event_id: string
          guest_count: number
          id: string
          member_id: string | null
          payment_status: string
          pending_guests: Json | null
          phone: string | null
          registrant_name: string
          stripe_payment_id: string | null
          submitted_at: string
          tshirt_size: string | null
        }
        Insert: {
          amount_paid?: number | null
          applied_price?: number | null
          dietary_restrictions?: string | null
          email: string
          event_id: string
          guest_count?: number
          id?: string
          member_id?: string | null
          payment_status?: string
          pending_guests?: Json | null
          phone?: string | null
          registrant_name: string
          stripe_payment_id?: string | null
          submitted_at?: string
          tshirt_size?: string | null
        }
        Update: {
          amount_paid?: number | null
          applied_price?: number | null
          dietary_restrictions?: string | null
          email?: string
          event_id?: string
          guest_count?: number
          id?: string
          member_id?: string | null
          payment_status?: string
          pending_guests?: Json | null
          phone?: string | null
          registrant_name?: string
          stripe_payment_id?: string | null
          submitted_at?: string
          tshirt_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          event_id: string
          guest_email: string | null
          guest_name: string | null
          id: string
          member_id: string | null
          notified_at: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          member_id?: string | null
          notified_at?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          member_id?: string | null
          notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_member_status: { Args: never; Returns: string }
      find_member_by_name: {
        Args: { search_name: string }
        Returns: {
          id: string
          similarity: number
        }[]
      }
      search_stubs: {
        Args: {
          search_name: string
          search_pin?: string
          search_pledge_class?: string
        }
        Returns: {
          first_name: string
          id: string
          last_name: string
          nickname: string
          pin_number: string
          pledge_class: string
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      event_status: "draft" | "published" | "archived"
      referral_status: "pending" | "completed" | "expired"
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
      event_status: ["draft", "published", "archived"],
      referral_status: ["pending", "completed", "expired"],
    },
  },
} as const
