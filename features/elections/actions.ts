"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireElectionManager, requireProfile } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { candidateSchema, electionSchema } from "./schemas";

const field = (data: FormData, name: string) => String(data.get(name) ?? "");

export async function createElectionAction(formData: FormData) {
  const profile = await requireProfile(["ADMIN", "ORGANIZER"]);
  const parsed = electionSchema.safeParse({ title: field(formData, "title"), description: field(formData, "description"), startTime: field(formData, "startTime"), endTime: field(formData, "endTime") });
  if (!parsed.success) redirect(`/admin/elections/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid election")}`);
  if (parsed.data.endTime <= new Date()) redirect("/admin/elections/new?error=End%20time%20must%20be%20in%20the%20future");
  const supabase = await createClient();
  const { data, error } = await supabase.from("elections").insert({ title: parsed.data.title, description: parsed.data.description, start_time: parsed.data.startTime.toISOString(), end_time: parsed.data.endTime.toISOString(), status: "DRAFT", created_by: profile.id }).select("id").single();
  if (error || !data) redirect(`/admin/elections/new?error=${encodeURIComponent(error?.message ?? "Creation failed")}`);
  redirect(`/admin/elections/${data.id}`);
}

export async function addCandidateAction(formData: FormData) {
  const parsed = candidateSchema.safeParse({ electionId: field(formData, "electionId"), name: field(formData, "name"), description: field(formData, "description") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid candidate");
  const { election, supabase } = await requireElectionManager(parsed.data.electionId);
  if (election.status !== "DRAFT" || election.contract_election_id !== null) throw new Error("Candidate configuration is locked after on-chain provisioning");
  if (new Date(election.start_time) <= new Date()) throw new Error("Candidate configuration closes when voting starts");
  const { error } = await supabase.from("candidates").insert({ election_id: parsed.data.electionId, name: parsed.data.name, description: parsed.data.description, metadata: {} });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/elections/${parsed.data.electionId}/candidates`);
  revalidatePath(`/admin/elections/${parsed.data.electionId}`);
}
