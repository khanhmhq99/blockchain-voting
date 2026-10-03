import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { CloseElectionButton } from "@/features/elections/close-election-button";
import { ProvisionElection } from "@/features/elections/provision-election";
import { getElectionPageData } from "@/features/elections/queries";
import { deriveElectionStatus } from "@/features/elections/rules";
import { requireElectionManager } from "@/lib/auth/authorization";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function AdminElectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; await requireElectionManager(id); const { election, candidates, supabase } = await getElectionPageData(id);
  const [{ count: registrationCount }, { count: approvedCount }, { count: voteCount }] = await Promise.all([
    supabase.from("voter_registrations").select("id", { count: "exact", head: true }).eq("election_id", id),
    supabase.from("voter_registrations").select("id", { count: "exact", head: true }).eq("election_id", id).eq("status", "APPROVED"),
    supabase.from("blockchain_transactions").select("id", { count: "exact", head: true }).eq("election_id", id).eq("type", "CAST_VOTE").eq("status", "CONFIRMED"),
  ]);
  const status = deriveElectionStatus(election.start_time, election.end_time, election.status); const turnout = approvedCount ? Math.min(100, ((voteCount ?? 0) / approvedCount) * 100) : 0;
  return <div className="space-y-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><StatusBadge status={status} /><h1 className="mt-3 text-3xl font-bold">{election.title}</h1><p className="mt-2 text-slate-600">{election.description}</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link href={`/admin/elections/${id}/candidates`}>Candidates</Link></Button><Button variant="outline" asChild><Link href={`/admin/elections/${id}/voters`}>Voters</Link></Button><Button variant="outline" asChild><Link href={`/elections/${id}/result`}>Results</Link></Button></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Registrations",registrationCount ?? 0],["Approved",approvedCount ?? 0],["Votes cast",voteCount ?? 0],["Turnout",`${turnout.toFixed(1)}%`]].map(([label,value]) => <Card key={label}><CardHeader><CardTitle className="text-sm text-slate-500">{label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{value}</p></CardContent></Card>)}</div><Card><CardHeader><CardTitle>Configuration</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm md:grid-cols-2"><div><span className="text-slate-500">Start</span><p className="font-medium">{formatDate(election.start_time)}</p></div><div><span className="text-slate-500">End</span><p className="font-medium">{formatDate(election.end_time)}</p></div><div><span className="text-slate-500">Contract</span><p className="break-all font-mono text-xs">{election.contract_address ?? "Not provisioned"}</p></div><div><span className="text-slate-500">Chain / election ID</span><p className="font-medium">{election.chain_id ?? "—"} / {election.contract_election_id ?? "—"}</p></div></CardContent></Card><Card><CardHeader><CardTitle>Blockchain lifecycle</CardTitle></CardHeader><CardContent className="space-y-5"><ProvisionElection electionId={id} contractElectionId={election.contract_election_id} startTime={election.start_time} endTime={election.end_time} candidates={candidates.map((candidate) => ({ id: candidate.id, name: candidate.name, description: candidate.description, contractCandidateId: candidate.contract_candidate_id }))} />{election.contract_election_id !== null && election.contract_address && election.chain_id && election.status !== "CLOSED" && <CloseElectionButton electionId={id} contractElectionId={election.contract_election_id} contractAddress={election.contract_address} chainId={election.chain_id} />}</CardContent></Card></div>;
}
