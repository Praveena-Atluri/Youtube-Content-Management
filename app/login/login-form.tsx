"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requestMagicLink, type LoginState } from "@/app/login/actions";

const INITIAL_STATE: LoginState = { status: "idle", message: "" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(requestMagicLink, INITIAL_STATE);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Company email</span>
        <div className="flex h-12 items-center gap-3 rounded-2xl border bg-background px-4 focus-within:ring-2 focus-within:ring-ring">
          <Mail className="size-4 text-muted-foreground" />
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </label>
      <Button type="submit" disabled={pending} className="h-12 w-full rounded-2xl">
        {pending ? "Sending link…" : "Email me a sign-in link"}
      </Button>
      {state.message ? (
        <p
          role="status"
          className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-emerald-700 dark:text-emerald-400"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
