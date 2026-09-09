"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { notify } from "@/lib/notify";
import type { ActionResult } from "@/lib/errors";

export function AdminDeleteButton({
  id,
  label,
  name,
  description,
  action,
}: {
  id: string;
  label: string;
  name?: string;
  description: string;
  action: (id: string) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onConfirm() {
    setPending(true);
    const result = await action(id);
    setPending(false);
    if (!result.success) {
      notify.error(result.error);
      return;
    }
    notify.success(`${label} deleted`);
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className="btn-admin-danger" disabled={pending}>
        <Trash2 className="size-3.5" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label.toLowerCase()}?</AlertDialogTitle>
          <AlertDialogDescription>
            {name ? `Are you sure you want to delete “${name}”? ` : null}
            {description} This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={pending}
            onClick={() => void onConfirm()}
          >
            {pending ? "Deleting…" : `Delete ${label}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
