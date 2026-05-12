export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-3xl border bg-card/90 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you requested does not exist.
        </p>
      </div>
    </main>
  );
}
