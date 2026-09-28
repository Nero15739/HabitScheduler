"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, destroySession, registerUser } from "@/lib/auth";

export type AuthState = { error?: string } | undefined;

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await authenticate(email, password);
  if (!user) return { error: "That email and password don't match." };
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const res = await registerUser({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
    password: String(formData.get("password") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
  });
  if (!res.ok) return { error: res.error };
  await createSession(res.user.id);
  redirect("/?welcome=1");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
