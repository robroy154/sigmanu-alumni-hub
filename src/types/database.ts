// Canonical TypeScript types mirroring the Supabase schema.
// Manually maintained in Phase 1.
// Phase 2: replace with auto-generated types via `supabase gen types typescript`.

export type MemberStatus = "pending" | "member" | "admin";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type TShirtSize = "S" | "M" | "L" | "XL" | "XXL";

export interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  pledge_class: string | null;
  pin_number: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  home_address: string | null;
  linkedin_url: string | null;
  profile_photo_url: string | null;
  big_id: string | null;
  status: MemberStatus;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  member_id: string;
  badge_type: string;
  assigned_by: string;
  assigned_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  ticket_price: number;
  registration_open: boolean;
  capacity: number | null;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  member_id: string | null;
  registrant_name: string;
  email: string;
  phone: string | null;
  dietary_restrictions: string | null;
  tshirt_size: TShirtSize | null;
  guest_count: number;
  payment_status: PaymentStatus;
  stripe_payment_id: string | null;
  submitted_at: string;
}

export interface RegistrationGuest {
  id: string;
  registration_id: string;
  guest_name: string;
}
