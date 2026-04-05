// Canonical application-level types for the Sigma Nu Alumni Hub.
//
// The raw generated types live in src/types/supabase.ts (gitignored).
// Regenerate with: npm run db:types
//
// Do NOT import from supabase.ts directly in app code — always import from
// @/types or @/types/database.

import type { Database } from "./supabase";

// Row types — what you get back from a SELECT with no joins.
export type MemberRow            = Database["public"]["Tables"]["members"]["Row"];
export type BadgeRow             = Database["public"]["Tables"]["badges"]["Row"];
export type EventRow             = Database["public"]["Tables"]["events"]["Row"];
export type RegistrationRow      = Database["public"]["Tables"]["registrations"]["Row"];
export type RegistrationGuestRow = Database["public"]["Tables"]["registration_guests"]["Row"];

// Insert types — what you pass to an INSERT. Columns with defaults are optional.
export type MemberInsert            = Database["public"]["Tables"]["members"]["Insert"];
export type BadgeInsert             = Database["public"]["Tables"]["badges"]["Insert"];
export type EventInsert             = Database["public"]["Tables"]["events"]["Insert"];
export type RegistrationInsert      = Database["public"]["Tables"]["registrations"]["Insert"];
export type RegistrationGuestInsert = Database["public"]["Tables"]["registration_guests"]["Insert"];

// Update types — all columns optional, for PATCH-style updates.
export type MemberUpdate            = Database["public"]["Tables"]["members"]["Update"];
export type BadgeUpdate             = Database["public"]["Tables"]["badges"]["Update"];
export type EventUpdate             = Database["public"]["Tables"]["events"]["Update"];
export type RegistrationUpdate      = Database["public"]["Tables"]["registrations"]["Update"];
export type RegistrationGuestUpdate = Database["public"]["Tables"]["registration_guests"]["Update"];

// Enum unions — maintained manually because Postgres check constraints do not
// produce Supabase pg_enum types (which would appear in Database["public"]["Enums"]).
export type MemberStatus  = "pending" | "member" | "admin";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type TShirtSize    = "S" | "M" | "L" | "XL" | "XXL";

// Composite types for common join shapes — extend as query patterns emerge.
export type MemberWithBadges         = MemberRow & { badges: BadgeRow[] };
export type RegistrationWithGuests   = RegistrationRow & { registration_guests: RegistrationGuestRow[] };
export type EventWithRegistrationCount = EventRow & { registration_count: number };
