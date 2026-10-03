"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "./schemas";

function value(form: FormData, name: string) { return String(form.get(name) ?? ""); }

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password") });
  if (!parsed.success) redirect("/login?error=Enter%20a%20valid%20email%20and%208-character%20password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/elections");
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({ email: value(formData, "email"), password: value(formData, "password"), displayName: value(formData, "displayName") });
  if (!parsed.success) redirect("/register?error=Check%20the%20registration%20fields");
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { emailRedirectTo: `${origin}/auth/confirm`, data: { display_name: parsed.data.displayName } } });
  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);
  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
