import Link from "next/link";
import { requireProfile } from "@/lib/auth/authorization";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireProfile(["ADMIN", "ORGANIZER"]);
  return <div className="grid gap-8 lg:grid-cols-[220px_1fr]"><aside><div className="sticky top-6 rounded-xl border bg-white p-3"><p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Management</p><nav className="space-y-1"><Link className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" href="/admin">Dashboard</Link><Link className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" href="/admin/elections">Elections</Link><Link className="block rounded-md px-3 py-2 text-sm hover:bg-slate-100" href="/admin/elections/new">Create election</Link></nav></div></aside><section>{children}</section></div>;
}
