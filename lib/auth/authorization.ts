import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types/domain";

export async function getOptionalProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return data as Profile | null;
  } catch { return null; }
}

export async function requireProfile(roles?: readonly AppRole[]): Promise<Profile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/elections");
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error || !profile) redirect("/login?error=Profile%20not%20available");
  if (roles && !roles.includes(profile.role)) redirect("/elections?error=Not%20authorized");
  return profile as Profile;
}

export async function requireElectionManager(electionId: string) {
  const profile = await requireProfile(["ADMIN", "ORGANIZER"]);
  const supabase = await createClient();
  const { data: election, error } = await supabase.from("elections").select("*").eq("id", electionId).single();
  if (error || !election) throw new Error("Election not found");
  if (profile.role !== "ADMIN" && election.created_by !== profile.id) throw new Error("You cannot manage this election");
  return { profile, election, supabase };
}
