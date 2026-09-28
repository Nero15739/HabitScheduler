"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useClientValue } from "@/lib/use-client-value";

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card p-4 sm:p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function Label({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("label", className)} {...rest}>
      {children}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
        size === "sm" && "h-9 px-3.5 text-[13px]",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && "bg-accent text-accent-fg hover:brightness-110 shadow-[0_6px_20px_-8px_var(--ring)]",
        variant === "secondary" && "bg-surface-2 text-text border border-border hover:bg-surface-3",
        variant === "ghost" && "text-text-2 hover:bg-surface-2 hover:text-text",
        variant === "danger" && "bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20",
        className,
      )}
      {...rest}
    />
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-11 rounded-2xl bg-surface-2 border border-border px-4 text-[15px] text-text placeholder:text-text-3 focus:border-accent focus:outline-none transition",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[84px] rounded-2xl bg-surface-2 border border-border px-4 py-3 text-[15px] text-text placeholder:text-text-3 focus:border-accent focus:outline-none transition",
          className,
        )}
        {...rest}
      />
    );
  },
);

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 rounded-2xl bg-surface-2 border border-border px-4 pr-9 text-[15px] text-text focus:border-accent focus:outline-none appearance-none bg-no-repeat bg-[right_14px_center]",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
      }}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="block text-xs text-text-3">{hint}</span>}
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex rounded-full bg-surface-2 border border-border p-1 gap-1", size === "lg" && "w-full", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-full font-bold tracking-[0.12em] uppercase transition whitespace-nowrap",
              size === "sm" && "h-7 px-3 text-[10px]",
              size === "md" && "h-9 px-4 text-[11px]",
              size === "lg" && "h-11 flex-1 text-[11px]",
              active ? "bg-accent text-accent-fg shadow-[0_6px_20px_-8px_var(--ring)]" : "text-text-2 hover:text-text",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Ring({
  value,
  size = 96,
  stroke = 8,
  color = "var(--accent)",
  track = "var(--track)",
  children,
  className,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Bar({ value, color = "var(--accent)", className, height = 6 }: { value: number; color?: string; className?: string; height?: number }) {
  return (
    <div className={cn("w-full rounded-full bg-track overflow-hidden", className)} style={{ height }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color, transition: "width 500ms cubic-bezier(.2,.8,.2,1)" }}
      />
    </div>
  );
}

export function StatTile({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card px-4 py-4 sm:py-5 flex flex-col items-center text-center gap-1.5">
      <Label>{label}</Label>
      <div className={cn("text-2xl sm:text-[28px] font-extrabold tracking-tight tabular", accent && "text-accent")}>{value}</div>
      {sub && <div className="text-xs text-text-3">{sub}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 rounded-full transition", checked ? "bg-accent" : "bg-track")}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-3">
      <div className="text-base font-bold">{title}</div>
      {body && <p className="text-sm text-text-2 max-w-sm">{body}</p>}
      {action}
    </div>
  );
}

/** Bottom sheet on mobile, centered dialog on desktop. */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  const mounted = useClientValue(() => true, false);
  if (!open || !mounted) return null;
  // Portal to <body> so page-level transforms/animations can't trap the fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative w-full sm:w-auto sm:min-w-[440px] max-h-[92dvh] overflow-y-auto card rounded-b-none sm:rounded-b-[22px] p-5 sm:p-6 animate-fade-up safe-bottom",
          wide ? "sm:max-w-3xl sm:w-[760px]" : "sm:max-w-lg",
        )}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-extrabold tracking-tight">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="h-9 w-9 rounded-full hover:bg-surface-2 text-text-2 text-xl leading-none">
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function IconButton({ className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "h-10 w-10 inline-flex items-center justify-center rounded-full bg-surface-2 border border-border text-text-2 hover:text-text hover:bg-surface-3 transition disabled:opacity-40",
        className,
      )}
      {...rest}
    />
  );
}
