import { Inbox } from "lucide-react";
export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-xl border border-dashed bg-white p-10 text-center"><Inbox className="mx-auto mb-3 size-8 text-slate-400" /><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-slate-600">{description}</p></div>;
}
