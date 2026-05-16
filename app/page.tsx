"use client";

import { useState } from "react";
import { LoaderCircle, Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6">
      <div className="absolute right-4 top-4 [&_button]:h-12 [&_button]:w-12 [&_svg]:size-6">
        <ThemeToggle />
      </div>

      <div className="mb-10 flex flex-col items-center gap-3 text-center">
        <Image
          src="/app-icon.png"
          alt="Media Radar"
          width={96}
          height={96}
          className="rounded-3xl shadow-md"
        />
        <h1 className="text-4xl font-black">Media Radar</h1>
        <p className="max-w-sm text-muted-foreground">
          News, movies, sports, and tech — all in one place.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <Link
          href="/stories"
          onClick={() => setLoading(true)}
          className="group flex flex-col gap-4 rounded-[1.75rem] border bg-card/85 p-8 shadow-sm backdrop-blur transition hover:border-amber-400/60 hover:bg-amber-50/60 dark:hover:bg-amber-900/20"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-100 p-4 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <Newspaper className="size-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Trending Stories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fresh stories ranked by virality. Be the first to know.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Loading stories...
              </>
            ) : (
              "Browse stories →"
            )}
          </span>
        </Link>
      </div>
    </main>
  );
}
