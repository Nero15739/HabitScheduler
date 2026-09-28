import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { getCurrentUser } from "@/lib/auth";
import { colorCss } from "@/lib/colors";

export const metadata: Metadata = {
  title: { default: "HabitScheduler", template: "%s · HabitScheduler" },
  description: "A self-hosted dashboard for your habits, tasks and goals, built on Atomic Habits principles.",
  applicationName: "HabitScheduler",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Habits" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#070908",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const pref = user?.theme ?? "system";
  const initial = pref === "system" ? "dark" : pref;
  return (
    <html lang="en" data-theme-pref={pref} data-theme={initial} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <style dangerouslySetInnerHTML={{ __html: colorCss() }} />
      </head>
      <body className="antialiased">
        <div className="app-bg" aria-hidden />
        {children}
      </body>
    </html>
  );
}
