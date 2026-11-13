import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const projectSchema = z.object({
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z][A-Z0-9]{1,9}$/, "Key: 2-10 letters/digits, starting with a letter"),
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(500).default(""),
});
