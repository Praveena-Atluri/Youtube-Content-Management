"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  checkEmailAuthorization,
  signInWithGoogle,
  type EmailAuthorizationState
} from "@/app/login/actions";

const INITIAL_STATE: EmailAuthorizationState = {
  email: "",
  message: "",
  status: "idle"
};

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, checkEmail, pending] = useActionState(
    checkEmailAuthorization,
    INITIAL_STATE
  );

  if (state.status === "authorized") {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border bg-muted/40 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Authorized email
          </p>
          <p className="mt-1 break-all text-sm font-semibold">{state.email}</p>
        </div>

        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="email" value={state.email} />
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

        <a
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="block text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Use a different email
        </a>
      </div>
    );
  }

  return (
    <form action={checkEmail} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Authorized email address</span>
        <div className="flex h-12 items-center gap-3 rounded-2xl border bg-background px-4 focus-within:ring-2 focus-within:ring-ring">
          <Mail className="size-4 text-muted-foreground" />
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            defaultValue={state.email}
            placeholder="you@gmail.com"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </label>
      <Button type="submit" disabled={pending} className="h-12 w-full rounded-2xl">
        {pending ? "Checking…" : "Check access"}
      </Button>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
