"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CheckSquare, Home, LayoutGrid, Settings, Target } from "lucide-react";
import { cn } from "@/components/ui";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/", label: "Today", icon: Home },
  { href: "/habits", label: "Habits", icon: LayoutGrid },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const pathname = usePathname();
  const current = NAV.find((n) => isActive(pathname, n.href));
  const pageTitle = title ?? (pathname.startsWith("/settings") ? "Settings" : current?.label ?? "HabitScheduler");
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-bg/70 border-b border-border/60">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="sm:hidden shrink-0" aria-label="Home">
              <Logo size={30} />
            </Link>
            <h1 className="text-[15px] sm:text-lg font-extrabold tracking-[0.12em] uppercase truncate">{pageTitle}</h1>
          </div>
          <nav className="hidden md:flex items-center rounded-full bg-surface/80 border border-border p-1 gap-0.5" aria-label="Primary">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold transition",
                    active ? "text-accent bg-accent-soft" : "text-text-2 hover:text-text hover:bg-surface-2",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={17} strokeWidth={2.2} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="flex justify-end">
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                "h-10 w-10 inline-flex items-center justify-center rounded-full border border-border bg-surface/80 hover:bg-surface-2 transition",
                pathname.startsWith("/settings") ? "text-accent" : "text-text-2",
              )}
            >
              <Settings size={18} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 py-5 sm:py-7 pb-28 md:pb-10">{children}</main>

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md safe-bottom"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5 h-16">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn("flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wide uppercase", active ? "text-accent" : "text-text-3")}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
