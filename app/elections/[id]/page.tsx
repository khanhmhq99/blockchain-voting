import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { getElectionPageData } from "@/features/elections/queries";
import { deriveElectionStatus } from "@/features/elections/rules";
import { getOptionalProfile } from "@/lib/auth/authorization";
import { formatDate } from "@/lib/utils";
import type { VoterRegistration } from "@/types/domain";

export const dynamic = "force-dynamic";
export default async function ElectionDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; error?: string }> }) {
  const { id } = await params; const query = await searchParams; const profile = await getOptionalProfile();
  const { election, candidates, supabase } = await getElectionPageData(id);
  let registration: VoterRegistration | null = null;
  if (profile) { const { data } = await supabase.from("voter_registrations").select("*").eq("election_id", id).eq("user_id", profile.id).maybeSingle(); registration = data as VoterRegistration | null; }
  const status = deriveElectionStatus(election.start_time, election.end_time, election.status);
  return <div className="space-y-6">{query.message && <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">{query.message}</Alert>}{query.error && <Alert className="border-red-200 bg-red-50 text-red-800">{query.error}</Alert>}<div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-3"><StatusBadge status={status} /></div><h1 className="text-3xl font-bold">{election.title}</h1><p className="mt-3 max-w-3xl text-slate-600">{election.description}</p></div><div className="flex gap-2">{status === "REGISTRATION" && !registration && <Button asChild><Link href={`/elections/${id}/register`}>Register</Link></Button>}{status === "ACTIVE" && registration?.status === "APPROVED" && <Button asChild><Link href={`/elections/${id}/vote`}>Vote now</Link></Button>}<Button variant="outline" asChild><Link href={`/elections/${id}/result`}>Results</Link></Button></div></div><div className="grid gap-5 lg:grid-cols-3"><Card><CardHeader><CardTitle>Schedule</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div><span className="text-slate-500">Starts</span><p className="font-medium">{formatDate(election.start_time)}</p></div><div><span className="text-slate-500">Ends</span><p className="font-medium">{formatDate(election.end_time)}</p></div></CardContent></Card><Card><CardHeader><CardTitle>Your registration</CardTitle></CardHeader><CardContent>{registration ? <StatusBadge status={registration.status} /> : <p className="text-sm text-slate-600">No registration submitted.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Blockchain</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Chain ID: <strong>{election.chain_id ?? "—"}</strong></p><p className="break-all">Contract: <span className="font-mono text-xs">{election.contract_address ?? "Not provisioned"}</span></p></CardContent></Card></div><Card><CardHeader><CardTitle>Candidates</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{candidates.map((candidate) => <div key={candidate.id} className="rounded-lg border p-4"><div className="flex justify-between"><h3 className="font-semibold">{candidate.name}</h3>{candidate.contract_candidate_id && <Badge variant="outline">#{candidate.contract_candidate_id}</Badge>}</div><p className="mt-2 text-sm text-slate-600">{candidate.description}</p></div>)}{!candidates.length && <p className="text-sm text-slate-600">Candidates have not been published.</p>}</CardContent></Card></div>;
}
