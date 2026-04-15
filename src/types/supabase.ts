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
          id:             string
          title:          string
          body:           string
          is_active:      boolean
          notify_members: boolean
          created_by:     string
          created_at:     string
          updated_at:     string
        }
        Insert: {
          id?:             string
          title:           string
          body:            string
          is_active?:      boolean
          notify_members?: boolean
          created_by:      string
          created_at?:     string
          updated_at?:     string
        }
        Update: {
          id?:             string
          title?:          string
          body?:           string
          is_active?:      boolean
          notify_members?: boolean
          created_by?:     string
          created_at?:     string
          updated_at?:     string
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
      referrals: {
        Row: {
          id:           string
          referred_by:  string
          first_name:   string
          last_name:    string
          email:        string
          token:        string
          status:       "pending" | "completed" | "expired"
          created_at:   string
          completed_at: string | null
          expires_at:   string
        }
        Insert: {
          id?:          string
          referred_by:  string
          first_name:   string
          last_name:    string
          email:        string
          token?:       string
          status?:      "pending" | "completed" | "expired"
          created_at?:  string
          completed_at?: string | null
          expires_at?:  string
        }
        Update: {
          id?:          string
          referred_by?: string
          first_name?:  string
          last_name?:   string
          email?:       string
          token?:       string
          status?:      "pending" | "completed" | "expired"
          created_at?:  string
          completed_at?: string | null
          expires_at?:  string
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
      events: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          registration_open: boolean
          status: "draft" | "published" | "archived"
          ticket_price: number
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          registration_open?: boolean
          status?: "draft" | "published" | "archived"
          ticket_price?: number
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          registration_open?: boolean
          status?: "draft" | "published" | "archived"
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
          referred_by: string | null
          linkedin_url: string | null
          nickname: string | null
          phone: string | null
          pin_number: string | null
          pledge_class: string | null
          profile_photo_url: string | null
          show_address: boolean
          show_birthday: boolean
          show_phone: boolean
          state: string | null
          status: string
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
          id: string
          last_name: string
          referred_by?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          phone?: string | null
          pin_number?: string | null
          pledge_class?: string | null
          profile_photo_url?: string | null
          show_address?: boolean
          show_birthday?: boolean
          show_phone?: boolean
          state?: string | null
          status?: string
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
          referred_by?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          phone?: string | null
          pin_number?: string | null
          pledge_class?: string | null
          profile_photo_url?: string | null
          show_address?: boolean
          show_birthday?: boolean
          show_phone?: boolean
          state?: string | null
          status?: string
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
          amount:            number
          created_at:        string
          guest_count_delta: number
          id:                string
          registration_id:   string
          stripe_payment_id: string
        }
        Insert: {
          amount:            number
          created_at?:       string
          guest_count_delta: number
          id?:               string
          registration_id:   string
          stripe_payment_id: string
        }
        Update: {
          amount?:            number
          created_at?:        string
          guest_count_delta?: number
          id?:                string
          registration_id?:   string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_member_status: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
