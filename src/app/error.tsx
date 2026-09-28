"use client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div className="card p-8 max-w-md">
        <h1 className="text-lg font-bold">Something went wrong</h1>
        <p className="text-sm text-text-2 mt-1 break-words">{error.message}</p>
        <button onClick={reset} className="mt-4 h-10 px-5 rounded-full bg-accent text-accent-fg font-semibold text-sm">Try again</button>
      </div>
    </main>
  );
}
