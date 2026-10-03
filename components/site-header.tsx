import Link from "next/link";
import { Vote } from "lucide-react";
import { getOptionalProfile } from "@/lib/auth/authorization";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export async function SiteHeader() {
  const profile = await getOptionalProfile();
  const isManager = profile?.role === "ADMIN" || profile?.role === "ORGANIZER";
  return <header className="border-b bg-white"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/" className="flex items-center gap-2 font-bold"><span className="rounded-lg bg-blue-700 p-2 text-white"><Vote className="size-5" /></span>ChainBallot</Link><nav className="flex items-center gap-1 sm:gap-3"><Link className="rounded px-2 py-2 text-sm hover:bg-slate-100" href="/elections">Elections</Link>{profile && <Link className="rounded px-2 py-2 text-sm hover:bg-slate-100" href="/my-elections">My activity</Link>}{isManager && <Link className="rounded px-2 py-2 text-sm hover:bg-slate-100" href="/admin">Admin</Link>}{profile ? <form action={logoutAction}><Button size="sm" variant="outline">Logout</Button></form> : <Button size="sm" asChild><Link href="/login">Sign in</Link></Button>}</nav></div></header>;
}
