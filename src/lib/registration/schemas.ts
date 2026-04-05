import { z } from "zod";

export const TSHIRT_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type TShirtSize = (typeof TSHIRT_SIZES)[number];

export const RegistrationSchema = z.object({
  registrant_name:      z.string().min(1, "Name is required"),
  email:                z.string().email("Enter a valid email address"),
  phone:                z.string().optional(),
  dietary_restrictions: z.string().optional(),
  tshirt_size:          z.enum(TSHIRT_SIZES, { message: "Select a shirt size" }),
  // guest_names drives guest_count — one entry per additional attendee.
  guest_names:          z.array(z.string().min(1, "Guest name is required")),
});

export type RegistrationInput = z.infer<typeof RegistrationSchema>;
