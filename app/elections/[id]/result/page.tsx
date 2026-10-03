import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getElectionPageData } from "@/features/elections/queries";
import { ResultsPanel } from "@/features/voting/results-panel";

export const dynamic = "force-dynamic";
export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const { election, candidates } = await getElectionPageData(id);
  if (election.contract_election_id === null || !election.contract_address) return <Alert>This election has not been provisioned on-chain.</Alert>;
  const mapped = candidates.filter((candidate): candidate is typeof candidate & { contract_candidate_id: number } => candidate.contract_candidate_id !== null).map((candidate) => ({ id: candidate.id, contractCandidateId: candidate.contract_candidate_id, name: candidate.name }));
  return <div className="mx-auto max-w-3xl"><Card><CardHeader><CardTitle>{election.title} results</CardTitle><CardDescription>Counts are read directly from the voting contract; Supabase does not store vote choices.</CardDescription></CardHeader><CardContent><ResultsPanel contractAddress={election.contract_address} contractElectionId={election.contract_election_id} candidates={mapped} /></CardContent></Card></div>;
}
