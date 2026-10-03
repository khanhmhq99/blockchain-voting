import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireProfile } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { formatDate, shortHash } from "@/lib/utils";
import type { BlockchainTransaction, Election } from "@/types/domain";

export const dynamic = "force-dynamic";
export default async function MyVotesPage() {
  const profile = await requireProfile(); const supabase = await createClient();
  const { data } = await supabase.from("blockchain_transactions").select("*").eq("user_id", profile.id).eq("type", "CAST_VOTE").order("created_at", { ascending: false });
  const transactions = (data ?? []) as BlockchainTransaction[]; const ids = [...new Set(transactions.map((row) => row.election_id))];
  let elections: Election[] = []; if (ids.length) { const result = await supabase.from("elections").select("*").in("id", ids); elections = (result.data ?? []) as Election[]; }
  const byId = new Map(elections.map((election) => [election.id, election])); const explorer = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;
  return <div><h1 className="text-3xl font-bold">My vote receipts</h1><p className="mt-2 mb-8 text-slate-600">This history stores transaction metadata only, never your selected candidate.</p>{transactions.length ? <div className="rounded-xl border bg-white"><Table><TableHeader><TableRow><TableHead>Election</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead>Transaction</TableHead></TableRow></TableHeader><TableBody>{transactions.map((transaction) => <TableRow key={transaction.id}><TableCell><Link className="font-medium hover:underline" href={`/elections/${transaction.election_id}`}>{byId.get(transaction.election_id)?.title ?? "Election"}</Link></TableCell><TableCell><StatusBadge status={transaction.status} /></TableCell><TableCell>{formatDate(transaction.created_at)}</TableCell><TableCell><a className="inline-flex items-center gap-1 font-mono text-xs text-blue-700" href={explorer ? `${explorer}/tx/${transaction.transaction_hash}` : `#${transaction.transaction_hash}`} target="_blank" rel="noreferrer">{shortHash(transaction.transaction_hash)}<ExternalLink className="size-3" /></a></TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState title="No vote receipts" description="Confirmed voting transactions will appear here." />}</div>;
}
