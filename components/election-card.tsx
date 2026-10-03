import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { deriveElectionStatus } from "@/features/elections/rules";
import { formatDate } from "@/lib/utils";
import type { Election } from "@/types/domain";

export function ElectionCard({ election }: { election: Election }) {
  const status = deriveElectionStatus(election.start_time, election.end_time, election.status);
  return <Card className="flex h-full flex-col"><CardHeader><div className="mb-2 flex items-start justify-between gap-3"><CardTitle>{election.title}</CardTitle><StatusBadge status={status} /></div><p className="line-clamp-2 text-sm text-slate-600">{election.description || "No description provided."}</p></CardHeader><CardContent className="flex-1 space-y-2 text-sm text-slate-600"><p className="flex items-center gap-2"><CalendarDays className="size-4" />{formatDate(election.start_time)}</p><p className="flex items-center gap-2"><Users className="size-4" />Chain {election.chain_id ?? "not provisioned"}</p></CardContent><CardFooter><Button variant="outline" className="w-full" asChild><Link href={`/elections/${election.id}`}>View election</Link></Button></CardFooter></Card>;
}
