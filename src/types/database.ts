// Canonical application-level types for the Sigma Nu Alumni Hub.
//
// The raw generated types live in src/types/supabase.ts (gitignored).
// Regenerate with: npm run db:types
//
// Do NOT import from supabase.ts directly in app code — always import from
// @/types or @/types/database.

import type { Database } from "./supabase";

// Row types — what you get back from a SELECT with no joins.
export type MemberRow                = Database["public"]["Tables"]["members"]["Row"];
export type BadgeRow                 = Database["public"]["Tables"]["badges"]["Row"];
export type EventRow                 = Database["public"]["Tables"]["events"]["Row"];
export type RegistrationRow          = Database["public"]["Tables"]["registrations"]["Row"];
export type RegistrationGuestRow     = Database["public"]["Tables"]["registration_guests"]["Row"];
export type EventFieldRow            = Database["public"]["Tables"]["event_fields"]["Row"];
export type EventFieldResponseRow    = Database["public"]["Tables"]["event_field_responses"]["Row"];
export type GuestFieldResponseRow    = Database["public"]["Tables"]["guest_field_responses"]["Row"];
export type WaitlistRow              = Database["public"]["Tables"]["waitlist"]["Row"];

// Insert types — what you pass to an INSERT. Columns with defaults are optional.
export type MemberInsert                = Database["public"]["Tables"]["members"]["Insert"];
export type BadgeInsert                 = Database["public"]["Tables"]["badges"]["Insert"];
export type EventInsert                 = Database["public"]["Tables"]["events"]["Insert"];
export type RegistrationInsert          = Database["public"]["Tables"]["registrations"]["Insert"];
export type RegistrationGuestInsert     = Database["public"]["Tables"]["registration_guests"]["Insert"];
export type EventFieldInsert            = Database["public"]["Tables"]["event_fields"]["Insert"];
export type EventFieldResponseInsert    = Database["public"]["Tables"]["event_field_responses"]["Insert"];
export type GuestFieldResponseInsert    = Database["public"]["Tables"]["guest_field_responses"]["Insert"];
export type WaitlistInsert              = Database["public"]["Tables"]["waitlist"]["Insert"];

// Update types — all columns optional, for PATCH-style updates.
export type MemberUpdate                = Database["public"]["Tables"]["members"]["Update"];
export type BadgeUpdate                 = Database["public"]["Tables"]["badges"]["Update"];
export type EventUpdate                 = Database["public"]["Tables"]["events"]["Update"];
export type RegistrationUpdate          = Database["public"]["Tables"]["registrations"]["Update"];
export type RegistrationGuestUpdate     = Database["public"]["Tables"]["registration_guests"]["Update"];
export type EventFieldUpdate            = Database["public"]["Tables"]["event_fields"]["Update"];
export type EventFieldResponseUpdate    = Database["public"]["Tables"]["event_field_responses"]["Update"];
export type GuestFieldResponseUpdate    = Database["public"]["Tables"]["guest_field_responses"]["Update"];
export type WaitlistUpdate              = Database["public"]["Tables"]["waitlist"]["Update"];

// Enum unions — maintained manually because Postgres check constraints do not
// produce Supabase pg_enum types (which would appear in Database["public"]["Enums"]).
export type MemberStatus  = "pending" | "member" | "admin" | "stub";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type TShirtSize    = "S" | "M" | "L" | "XL" | "XXL";
export type EventStatus   = "draft" | "published" | "archived";
export type CapacityMode  = "unlimited" | "capped" | "waitlist";
export type EventType     = "internal" | "external";
export type FieldType     = "short_text" | "long_text" | "dropdown" | "checkbox" | "multi_select" | "file_upload";
export type FieldScope    = "registration" | "attendee";

// Composite types for common join shapes — extend as query patterns emerge.
export type MemberWithBadges         = MemberRow & { badges: BadgeRow[] };
export type RegistrationWithGuests   = RegistrationRow & { registration_guests: RegistrationGuestRow[] };
export type EventWithRegistrationCount = EventRow & { registration_count: number };
