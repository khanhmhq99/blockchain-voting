import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getElections } from "@/features/elections/queries";
import { deriveElectionStatus } from "@/features/elections/rules";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function AdminElectionsPage() {
  const elections = await getElections();
  return <div><div className="mb-8 flex items-end justify-between"><div><h1 className="text-3xl font-bold">Manage elections</h1><p className="mt-2 text-slate-600">Configure metadata, candidates, registration, and chain state.</p></div><Button asChild><Link href="/admin/elections/new">New election</Link></Button></div>{elections.length ? <div className="rounded-xl border bg-white"><Table><TableHeader><TableRow><TableHead>Election</TableHead><TableHead>Status</TableHead><TableHead>Starts</TableHead><TableHead>Chain</TableHead></TableRow></TableHeader><TableBody>{elections.map((election) => <TableRow key={election.id}><TableCell><Link className="font-medium text-blue-700 hover:underline" href={`/admin/elections/${election.id}`}>{election.title}</Link></TableCell><TableCell><StatusBadge status={deriveElectionStatus(election.start_time, election.end_time, election.status)} /></TableCell><TableCell>{formatDate(election.start_time)}</TableCell><TableCell>{election.chain_id ?? "Draft"}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="No elections" description="Create the first election to begin the workflow." />}</div>;
}
