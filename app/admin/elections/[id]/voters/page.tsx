import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmitButton } from "@/components/submit-button";
import { getElectionPageData } from "@/features/elections/queries";
import { ApproveVoterButton } from "@/features/voters/approve-voter-button";
import { rejectRegistrationAction } from "@/features/voters/actions";
import { requireElectionManager } from "@/lib/auth/authorization";
import { formatDate, shortHash } from "@/lib/utils";
import type { Profile, VoterRegistration } from "@/types/domain";

export const dynamic = "force-dynamic";
export default async function VotersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; await requireElectionManager(id); const { election, supabase } = await getElectionPageData(id);
  const { data } = await supabase.from("voter_registrations").select("*").eq("election_id", id).order("created_at"); const registrations = (data ?? []) as VoterRegistration[];
  let profiles: Profile[] = []; const userIds = registrations.map((row) => row.user_id); if (userIds.length) { const result = await supabase.from("profiles").select("*").in("id", userIds); profiles = (result.data ?? []) as Profile[]; }
  const byId = new Map(profiles.map((profile) => [profile.id, profile])); const chainReady = election.contract_election_id !== null && Boolean(election.contract_address) && Boolean(election.chain_id);
  return <div><Button variant="ghost" asChild><Link href={`/admin/elections/${id}`}><ArrowLeft className="size-4" />Back to election</Link></Button><div className="mt-4 mb-8"><h1 className="text-3xl font-bold">Voter registrations</h1><p className="mt-2 text-slate-600">Approval writes eligibility on-chain before updating the application workflow.</p></div>{registrations.length ? <div className="rounded-xl border bg-white"><Table><TableHeader><TableRow><TableHead>Voter</TableHead><TableHead>Wallet</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{registrations.map((registration) => { const profile = byId.get(registration.user_id); return <TableRow key={registration.id}><TableCell><p className="font-medium">{profile?.display_name ?? "Voter"}</p><p className="text-xs text-slate-500">{profile?.email}</p></TableCell><TableCell className="font-mono text-xs">{profile?.wallet_address ? shortHash(profile.wallet_address) : "Missing"}</TableCell><TableCell>{formatDate(registration.created_at)}</TableCell><TableCell><StatusBadge status={registration.status} /></TableCell><TableCell>{registration.status === "PENDING" && <div className="flex items-start gap-2">{chainReady && profile?.wallet_address ? <ApproveVoterButton electionId={id} contractElectionId={election.contract_election_id!} contractAddress={election.contract_address!} chainId={election.chain_id!} registrationId={registration.id} walletAddress={profile.wallet_address} /> : <span className="text-xs text-amber-700">Provision election first</span>}<form action={rejectRegistrationAction}><input type="hidden" name="electionId" value={id} /><input type="hidden" name="registrationId" value={registration.id} /><SubmitButton size="sm" variant="outline">Reject</SubmitButton></form></div>}</TableCell></TableRow>; })}</TableBody></Table></div> : <EmptyState title="No registrations" description="Voter requests will appear here." />}</div>;
}
