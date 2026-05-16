import { z } from "zod";

export const ProfileUpdateSchema = z.object({
  first_name:    z.string().min(1, "First name is required"),
  last_name:     z.string().min(1, "Last name is required"),
  nickname:      z.string().optional(),
  pledge_class:  z.string().optional(),
  phone:         z.string().optional(),
  // Structured address fields
  street_address: z.string().optional(),
  city:          z.string().optional(),
  state:         z.string().optional(),
  zip:           z.string().optional(),
  country:       z.string().optional(),
  // Birthday stored as ISO date string "YYYY-MM-DD" (date inputs return strings)
  birthday:      z.string().optional(),
  linkedin_url:  z
    .string()
    .optional()
    .refine(
      (val) => !val || val.startsWith("https://www.linkedin.com/") || val.startsWith("https://linkedin.com/"),
      { message: "Must be a LinkedIn URL" }
    ),
  // Privacy toggles — only on profile edit, not signup
  show_address:       z.boolean().optional(),
  show_birthday:      z.boolean().optional(),
  show_phone:         z.boolean().optional(),
  // CAN-SPAM compliance
  newsletter_opt_out: z.boolean().optional(),
});

// Separate schema for the one-time pin number set.
// Accepts a non-empty string; uniqueness enforced at the DB layer.
export const SetPinSchema = z.object({
  pin_number: z
    .string()
    .min(1, "Pin number is required")
    .max(20, "Pin number cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9\-]+$/, "Only letters, numbers, and hyphens allowed"),
});

export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type SetPinInput        = z.infer<typeof SetPinSchema>;
