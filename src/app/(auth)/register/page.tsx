import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";
import { registrationOpen, userCount } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  const open = registrationOpen();
  const first = userCount() === 0;
  if (!open) {
    return (
      <>
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">Registration is closed</h1>
        <p className="text-sm text-text-2 mb-6">Ask the admin of this instance to invite you.</p>
        <Link href="/login" className="text-accent font-semibold hover:underline text-sm">
          Back to sign in
        </Link>
      </>
    );
  }
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">{first ? "Set up your instance" : "Create your account"}</h1>
      <p className="text-sm text-text-2 mb-6">
        {first ? "You're the first user, so you'll be the admin." : "Start building the identity you want."}
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-text-2 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-accent font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
