import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { createElectionAction } from "@/features/elections/actions";

export default async function NewElectionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div className="max-w-2xl"><Card><CardHeader><CardTitle>Create election</CardTitle><CardDescription>First save descriptive metadata, then add candidates and provision the election on-chain.</CardDescription></CardHeader><CardContent>{error && <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">{error}</Alert>}<form action={createElectionAction} className="space-y-4"><div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" minLength={3} maxLength={120} required /></div><div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" maxLength={4000} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="startTime">Voting starts</Label><Input id="startTime" name="startTime" type="datetime-local" required /></div><div className="space-y-2"><Label htmlFor="endTime">Voting ends</Label><Input id="endTime" name="endTime" type="datetime-local" required /></div></div><SubmitButton pendingLabel="Creating…">Create draft</SubmitButton></form></CardContent></Card></div>;
}
