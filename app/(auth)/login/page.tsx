import Link from "next/link";
import { loginAction } from "@/features/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const query = await searchParams;
  return <div className="mx-auto max-w-md py-10"><Card><CardHeader><CardTitle>Sign in</CardTitle><CardDescription>Access your voting account and participation history.</CardDescription></CardHeader><CardContent>{query.error && <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">{query.error}</Alert>}{query.message && <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-800">{query.message}</Alert>}<form action={loginAction} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required /></div><SubmitButton className="w-full" pendingLabel="Signing in…">Sign in</SubmitButton></form><p className="mt-5 text-center text-sm text-slate-600">No account? <Link className="font-medium text-blue-700 hover:underline" href="/register">Register</Link></p></CardContent></Card></div>;
}
