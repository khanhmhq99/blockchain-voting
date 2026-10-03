import { Activity, CheckCircle2, ClipboardList, Vote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth/authorization";
import { createClient } from "@/lib/supabase/server";
import { deriveElectionStatus } from "@/features/elections/rules";
import type { Election } from "@/types/domain";

export const dynamic = "force-dynamic";
export default async function AdminDashboardPage() {
  await requireProfile(["ADMIN", "ORGANIZER"]); const supabase = await createClient();
  const [{ data: rows }, registrations, approved, votes] = await Promise.all([
    supabase.from("elections").select("*"),
    supabase.from("voter_registrations").select("id", { count: "exact", head: true }),
    supabase.from("voter_registrations").select("id", { count: "exact", head: true }).eq("status", "APPROVED"),
    supabase.from("blockchain_transactions").select("id", { count: "exact", head: true }).eq("type", "CAST_VOTE").eq("status", "CONFIRMED"),
  ]);
  const elections = (rows ?? []) as Election[]; const active = elections.filter((election) => deriveElectionStatus(election.start_time, election.end_time, election.status) === "ACTIVE").length;
  const metrics = [[ClipboardList,"Total elections",elections.length],[Activity,"Active elections",active],[CheckCircle2,"Approved voters",approved.count ?? 0],[Vote,"Votes cast",votes.count ?? 0]] as const;
  const turnout = approved.count ? Math.min(100, ((votes.count ?? 0) / approved.count) * 100) : 0;
  return <div><h1 className="text-3xl font-bold">Dashboard</h1><p className="mt-2 text-slate-600">Application workflow and confirmed-chain activity.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([Icon,label,value]) => <Card key={label}><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-sm text-slate-600">{label}</CardTitle><Icon className="size-5 text-blue-700" /></CardHeader><CardContent><p className="text-3xl font-bold">{value}</p></CardContent></Card>)}</div><Card className="mt-5"><CardHeader><CardTitle>Registration and turnout</CardTitle></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-sm text-slate-500">Registrations</p><p className="text-2xl font-semibold">{registrations.count ?? 0}</p></div><div><p className="text-sm text-slate-500">Approved</p><p className="text-2xl font-semibold">{approved.count ?? 0}</p></div><div><p className="text-sm text-slate-500">Confirmed turnout</p><p className="text-2xl font-semibold">{turnout.toFixed(1)}%</p></div></div></CardContent></Card></div>;
}
