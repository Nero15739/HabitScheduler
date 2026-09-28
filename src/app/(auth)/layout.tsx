import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[420px] animate-fade-up">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Logo size={44} />
          <div className="text-center">
            <div className="text-xl font-extrabold tracking-tight">HabitScheduler</div>
            <div className="text-sm text-text-2">The dashboard for your habits</div>
          </div>
        </div>
        <div className="card p-6 sm:p-7">{children}</div>
        <p className="mt-6 text-center text-xs text-text-3">
          Self-hosted. Your data stays on your server.
        </p>
      </div>
    </main>
  );
}
