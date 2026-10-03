import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { getElectionPageData } from "@/features/elections/queries";
import { registerForElectionAction } from "@/features/voters/actions";
import { requireProfile } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";
export default async function ElectionRegistrationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const profile = await requireProfile(); const { id } = await params; const { error } = await searchParams; const { election } = await getElectionPageData(id);
  return <div className="mx-auto max-w-xl"><Card><CardHeader><CardTitle>Register for {election.title}</CardTitle><CardDescription>Your wallet is stored off-chain and will be approved on-chain if the organizer accepts your registration.</CardDescription></CardHeader><CardContent>{error && <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">{error}</Alert>}<form action={registerForElectionAction} className="space-y-4"><input type="hidden" name="electionId" value={id} /><div className="space-y-2"><Label htmlFor="walletAddress">EVM wallet address</Label><Input id="walletAddress" name="walletAddress" defaultValue={profile.wallet_address ?? ""} placeholder="0x…" pattern="^0x[0-9a-fA-F]{40}$" required /><p className="text-xs text-slate-500">You must cast the vote from this exact wallet.</p></div><SubmitButton pendingLabel="Submitting…">Submit registration</SubmitButton></form></CardContent></Card></div>;
}
