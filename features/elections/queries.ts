import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Candidate, Election } from "@/types/domain";

export async function getElections() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("elections").select("*").order("start_time", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Election[];
}

export async function getElectionPageData(id: string) {
  const supabase = await createClient();
  const [{ data: election }, { data: candidates }] = await Promise.all([
    supabase.from("elections").select("*").eq("id", id).single(),
    supabase.from("candidates").select("*").eq("election_id", id).order("created_at"),
  ]);
  if (!election) notFound();
  return { election: election as Election, candidates: (candidates ?? []) as Candidate[], supabase };
}
