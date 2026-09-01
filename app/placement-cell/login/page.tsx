"use client";

import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { SubmitButton } from "@/components/chat/submit-button";
import { GenieMark } from "@/components/placement/genie-mark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginPlacementCell, type PlacementCellLoginState } from "./actions";

export default function PlacementCellLoginPage() {
  const router = useRouter();
  const [state, formAction] = useActionState<PlacementCellLoginState, FormData>(
    loginPlacementCell,
    { status: "idle" }
  );

  useEffect(() => {
    if (state.status === "success") {
      router.replace("/placement-cell");
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card/60 p-8 shadow-[var(--shadow-card)]">
        <Link
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          href="/"
        >
          <ArrowLeftIcon className="size-3.5" />
          Student portal
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <GenieMark size={40} />
          <div>
            <h1 className="font-semibold text-xl tracking-tight">
              Placement Cell
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Campus placement intelligence
            </p>
          </div>
        </div>

        {state.status === "not_configured" ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
            Placement Cell access is not configured. Set{" "}
            <code className="font-mono text-[12px]">PLACEMENT_CELL_CODE</code>{" "}
            on the server.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="placement-cell-code">Access code</Label>
              <Input
                autoComplete="off"
                id="placement-cell-code"
                name="code"
                placeholder="Enter placement cell code"
                required
                type="password"
              />
            </div>

            {state.status === "failed" ? (
              <p className="text-[13px] text-destructive">
                Invalid access code. Please try again.
              </p>
            ) : null}

            <SubmitButton isSuccessful={state.status === "success"}>
              <span className="inline-flex items-center gap-2">
                <ShieldCheckIcon className="size-4" />
                Enter dashboard
              </span>
            </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
