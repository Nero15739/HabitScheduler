export function PwaIcon({ size, maskable }: { size: number; maskable?: boolean }) {
  const pad = maskable ? size * 0.1 : 0;
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#34e3c2", borderRadius: maskable ? 0 : size * 0.22 }}>
      <svg width={size * 0.6 - pad} height={size * 0.6 - pad} viewBox="0 0 64 64">
        <path d="M16 34l11 11 21-24" fill="none" stroke="#06201b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
