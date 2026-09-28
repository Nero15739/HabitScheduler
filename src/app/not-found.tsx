import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div className="card p-8 max-w-sm">
        <div className="text-5xl font-extrabold text-accent tabular">404</div>
        <h1 className="text-lg font-bold mt-2">Nothing here</h1>
        <p className="text-sm text-text-2 mt-1 mb-4">That page doesn&apos;t exist, or it belongs to someone else.</p>
        <Link href="/" className="text-accent font-semibold">Back to Today</Link>
      </div>
    </main>
  );
}
