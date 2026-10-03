import type { Metadata } from "next";
import { getElections } from "@/features/elections/queries";
import { ElectionCard } from "@/components/election-card";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Elections" };
export const dynamic = "force-dynamic";
export default async function ElectionsPage() {
  const elections = await getElections();
  return <div><div className="mb-8"><h1 className="text-3xl font-bold">Elections</h1><p className="mt-2 text-slate-600">Browse registration windows, active votes, and verifiable results.</p></div>{elections.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{elections.map((election) => <ElectionCard key={election.id} election={election} />)}</div> : <EmptyState title="No published elections" description="An organizer has not published an election yet." />}</div>;
}
