"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireElectionManager, requireProfile } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { isRegistrationOpen } from "@/features/elections/rules";
import { registerVoterSchema, reviewSchema } from "./schemas";

const field = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function registerForElectionAction(formData: FormData) {
  const profile = await requireProfile();
  const parsed = registerVoterSchema.safeParse({ electionId: field(formData, "electionId"), walletAddress: field(formData, "walletAddress") });
  if (!parsed.success) redirect(`/elections/${field(formData, "electionId")}/register?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid registration")}`);
  const supabase = await createClient();
  const { data: election } = await supabase.from("elections").select("*").eq("id", parsed.data.electionId).single();
  if (!election || !isRegistrationOpen(election)) redirect(`/elections/${parsed.data.electionId}/register?error=Registration%20is%20not%20open`);
  const { error: profileError } = await supabase.from("profiles").update({ wallet_address: parsed.data.walletAddress }).eq("id", profile.id);
  if (profileError) redirect(`/elections/${parsed.data.electionId}/register?error=${encodeURIComponent(profileError.message)}`);
  const { error } = await supabase.from("voter_registrations").insert({ election_id: parsed.data.electionId, user_id: profile.id, status: "PENDING", reviewed_by: null, reviewed_at: null });
  if (error) redirect(`/elections/${parsed.data.electionId}/register?error=${encodeURIComponent(error.code === "23505" ? "You are already registered" : error.message)}`);
  redirect(`/elections/${parsed.data.electionId}?message=Registration%20submitted`);
}

export async function rejectRegistrationAction(formData: FormData) {
  const parsed = reviewSchema.safeParse({ electionId: field(formData, "electionId"), registrationId: field(formData, "registrationId") });
  if (!parsed.success) throw new Error("Invalid review request");
  const { profile, supabase } = await requireElectionManager(parsed.data.electionId);
  const { data: registration } = await supabase.from("voter_registrations").select("status").eq("id", parsed.data.registrationId).eq("election_id", parsed.data.electionId).single();
  if (!registration || registration.status !== "PENDING") throw new Error("Only pending registrations can be rejected");
  const { error } = await supabase.from("voter_registrations").update({ status: "REJECTED", reviewed_by: profile.id, reviewed_at: new Date().toISOString() }).eq("id", parsed.data.registrationId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/elections/${parsed.data.electionId}/voters`);
}
