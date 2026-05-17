"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";

const HEADLINES = [
  "Scanning latest stories…",
  "Fetching trending topics…",
  "Tuning into the news radar…",
  "Picking up fresh headlines…",
  "Almost there…",
];

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const handleClick = () => {
    setLoading(true);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      if (i < HEADLINES.length) {
        setHeadlineIndex(i);
      } else {
        clearInterval(interval);
      }
    }, 600);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-background/95 backdrop-blur">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-40 animate-ping rounded-full bg-amber-400/10" />
          <div className="absolute size-28 animate-pulse rounded-full bg-amber-400/20" />
          <div className="absolute size-20 animate-spin rounded-full border-4 border-amber-300/30 border-t-amber-500" />
          <div className="relative rounded-2xl bg-amber-100 p-5 dark:bg-amber-900/40">
            <Newspaper className="size-10 animate-bounce text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <p className="text-2xl font-black">{HEADLINES[headlineIndex]}</p>
          <p className="text-sm text-muted-foreground">Powered by Media Radar</p>
        </div>

        <div className="flex gap-2">
          {HEADLINES.map((_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition-all duration-500 ${
                i <= headlineIndex ? "bg-amber-500 scale-125" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

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
          News, movies, sports, business and tech — all in one place.
        </p>
      </div>

      <div className="w-full max-w-sm">
        <Link
          href="/stories"
          onClick={handleClick}
          className="group flex flex-col gap-4 rounded-[1.75rem] border bg-card/85 p-8 shadow-sm backdrop-blur transition hover:border-amber-400/60 hover:bg-amber-50/60 dark:hover:bg-amber-900/20"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-amber-100 p-4 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <Newspaper className="size-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Trending Stories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Freshly picked updates. Be the first to know.
              </p>
            </div>
          </div>
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Browse stories →
          </span>
        </Link>
      </div>
    </main>
  );
}
