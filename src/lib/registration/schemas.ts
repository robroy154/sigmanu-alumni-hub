import { z } from "zod";

export const RegistrationSchema = z.object({
  registrant_name: z.string().min(1, "Name is required"),
  email:           z.string().email("Enter a valid email address"),
  phone:           z.string().optional(),
  // guest_names drives guest_count — one entry per additional attendee.
  guest_names:     z.array(z.string().min(1, "Guest name is required")),
});

export type RegistrationInput = z.infer<typeof RegistrationSchema>;

export const GuestRegistrationSchema = z.object({
  first_name:  z.string().min(1, "First name is required"),
  last_name:   z.string().min(1, "Last name is required"),
  email:       z.string().email("Enter a valid email address"),
  phone:       z.string().optional(),
  guest_names: z.array(z.string().min(1, "Guest name is required")),
});

export type GuestRegistrationInput = z.infer<typeof GuestRegistrationSchema>;
