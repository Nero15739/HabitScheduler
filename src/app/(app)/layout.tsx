import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ServiceWorker } from "@/components/service-worker";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <>
      <AppShell>{children}</AppShell>
      <ServiceWorker />
    </>
  );
}
