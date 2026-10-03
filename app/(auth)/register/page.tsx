import Link from "next/link";
import { registerAction } from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div className="mx-auto max-w-md py-10"><Card><CardHeader><CardTitle>Create voter account</CardTitle><CardDescription>New self-service accounts receive the VOTER role.</CardDescription></CardHeader><CardContent>{error && <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">{error}</Alert>}<form action={registerAction} className="space-y-4"><div className="space-y-2"><Label htmlFor="displayName">Display name</Label><Input id="displayName" name="displayName" minLength={2} maxLength={80} required /></div><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div><SubmitButton className="w-full" pendingLabel="Creating account…">Create account</SubmitButton></form><p className="mt-5 text-center text-sm text-slate-600">Already registered? <Link className="font-medium text-blue-700 hover:underline" href="/login">Sign in</Link></p></CardContent></Card></div>;
}
