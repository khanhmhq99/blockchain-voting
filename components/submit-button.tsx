"use client";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({ children, pendingLabel = "Saving…", ...props }: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <Button disabled={pending || props.disabled} {...props}>{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? pendingLabel : children}</Button>;
}
