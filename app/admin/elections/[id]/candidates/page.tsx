import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { addCandidateAction } from "@/features/elections/actions";
import { getElectionPageData } from "@/features/elections/queries";
import { requireElectionManager } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";
export default async function CandidatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; await requireElectionManager(id); const { election, candidates } = await getElectionPageData(id); const editable = election.status === "DRAFT" && election.contract_election_id === null && new Date(election.start_time) > new Date();
  return <div className="space-y-6"><Button variant="ghost" asChild><Link href={`/admin/elections/${id}`}><ArrowLeft className="size-4" />Back to election</Link></Button><div><h1 className="text-3xl font-bold">Candidates</h1><p className="mt-2 text-slate-600">{election.title}</p></div>{editable && <Card><CardHeader><CardTitle>Add candidate</CardTitle><CardDescription>Candidate configuration locks when the election is provisioned on-chain.</CardDescription></CardHeader><CardContent><form action={addCandidateAction} className="space-y-4"><input type="hidden" name="electionId" value={id} /><div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" maxLength={120} required /></div><div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" maxLength={2000} /></div><SubmitButton>Add candidate</SubmitButton></form></CardContent></Card>}<Card><CardHeader><CardTitle>Configured candidates ({candidates.length})</CardTitle></CardHeader><CardContent className="space-y-3">{candidates.map((candidate) => <div key={candidate.id} className="flex justify-between rounded-lg border p-4"><div><p className="font-medium">{candidate.name}</p><p className="mt-1 text-sm text-slate-600">{candidate.description}</p></div><Badge variant={candidate.contract_candidate_id ? "success" : "secondary"}>{candidate.contract_candidate_id ? `On-chain #${candidate.contract_candidate_id}` : "Draft"}</Badge></div>)}{!candidates.length && <p className="text-sm text-slate-600">No candidates yet.</p>}</CardContent></Card></div>;
}
