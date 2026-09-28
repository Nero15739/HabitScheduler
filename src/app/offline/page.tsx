export default function OfflinePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 text-center">
      <div className="card p-8 max-w-sm">
        <h1 className="text-xl font-extrabold mb-2">You&apos;re offline</h1>
        <p className="text-sm text-text-2">HabitScheduler needs a connection to your server to load fresh data. Your last-loaded pages are still available from the back button.</p>
      </div>
    </main>
  );
}
