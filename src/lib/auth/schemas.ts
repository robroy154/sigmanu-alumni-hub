import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const SignupSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    pledge_class:   z.string().optional(),
    phone:          z.string().optional(),
    street_address: z.string().optional(),
    city:           z.string().optional(),
    state:          z.string().optional(),
    zip:            z.string().optional(),
    country:        z.string().optional(),
    birthday:       z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const CompleteProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  pledge_class: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;
