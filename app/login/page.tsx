import Image from "next/image";

import { LoginForm } from "@/app/login/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSafeNextPath } from "@/lib/access-policy";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = isSafeNextPath(params.next ?? null) ? params.next! : "/";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-[1.75rem] shadow-lg">
        <CardHeader className="items-center space-y-4 text-center">
          <Image src="/app-icon.png" alt="Media Radar" width={80} height={80} className="rounded-3xl" />
          <div className="space-y-2">
            <CardTitle className="text-2xl font-black">Employee access</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in with an approved email address.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {params.error ? (
            <p className="mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              {params.error === "domain" ? "This email domain is not authorized." : "The sign-in link is invalid or expired."}
            </p>
          ) : null}
          <LoginForm nextPath={nextPath} />
        </CardContent>
      </Card>
    </main>
  );
}
