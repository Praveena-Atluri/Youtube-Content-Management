"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  requestMagicLink,
  signInWithGoogle,
  type LoginState
} from "@/app/login/actions";

const INITIAL_STATE: LoginState = { status: "idle", message: "" };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(requestMagicLink, INITIAL_STATE);

  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={nextPath} />
        <Button type="submit" variant="secondary" className="h-12 w-full rounded-2xl border">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 size-5">
            <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" />
            <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5L15.4 17c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z" />
            <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.5H3.2a10 10 0 0 0 0 9.1L6.5 14Z" />
            <path fill="#EA4335" d="M12 6c1.6 0 3 .5 4.1 1.6l3.1-3A10 10 0 0 0 3.2 7.5l3.3 2.6A5.8 5.8 0 0 1 12 6Z" />
          </svg>
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or use a magic link
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Email address</span>
          <div className="flex h-12 items-center gap-3 rounded-2xl border bg-background px-4 focus-within:ring-2 focus-within:ring-ring">
            <Mail className="size-4 text-muted-foreground" />
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
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
    </div>
  );
}
