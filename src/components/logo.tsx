export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-2xl bg-accent text-accent-fg shadow-[0_10px_30px_-10px_var(--ring)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13l5 5L20 7" />
      </svg>
    </div>
  );
}
