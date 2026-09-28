import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { registrationOpen } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const open = registrationOpen();
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Welcome back</h1>
      <p className="text-sm text-text-2 mb-6">Sign in to keep the chain going.</p>
      <LoginForm next={next ?? "/"} />
      {open && (
        <p className="mt-6 text-sm text-text-2 text-center">
          New here?{" "}
          <Link href="/register" className="text-accent font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </>
  );
}
