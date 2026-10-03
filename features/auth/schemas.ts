import { z } from "zod";

export const loginSchema = z.object({ email: z.email(), password: z.string().min(8).max(128) });
export const registerSchema = loginSchema.extend({ displayName: z.string().trim().min(2).max(80) });
