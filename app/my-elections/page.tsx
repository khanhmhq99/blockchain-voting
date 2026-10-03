import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { requireProfile } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import type { Election, VoterRegistration } from "@/types/domain";

export const dynamic = "force-dynamic";
export default async function MyElectionsPage() {
  const profile = await requireProfile(); const supabase = await createClient();
  const { data } = await supabase.from("voter_registrations").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
  const registrations = (data ?? []) as VoterRegistration[]; const ids = registrations.map((row) => row.election_id);
  let elections: Election[] = []; if (ids.length) { const result = await supabase.from("elections").select("*").in("id", ids); elections = (result.data ?? []) as Election[]; }
  const byId = new Map(elections.map((election) => [election.id, election]));
  return <div><div className="mb-8 flex items-end justify-between"><div><h1 className="text-3xl font-bold">My elections</h1><p className="mt-2 text-slate-600">Registration status and available voter actions.</p></div><Button variant="outline" asChild><Link href="/my-votes">Transaction history</Link></Button></div>{registrations.length ? <div className="space-y-3">{registrations.map((registration) => { const election = byId.get(registration.election_id); return <Card key={registration.id}><CardHeader className="flex-row items-center justify-between"><CardTitle>{election?.title ?? "Election"}</CardTitle><StatusBadge status={registration.status} /></CardHeader><CardContent><Button size="sm" variant="outline" asChild><Link href={`/elections/${registration.election_id}`}>Open election</Link></Button></CardContent></Card>; })}</div> : <EmptyState title="No registrations" description="Browse elections to submit your first registration." />}</div>;
}
