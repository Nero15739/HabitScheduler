"use client";

type Vals = { energy: number | null; focus: number | null; motivation: number | null };

const ROWS: { key: keyof Vals; label: string; color: string }[] = [
  { key: "energy", label: "Energy", color: "var(--series-energy)" },
  { key: "focus", label: "Focus", color: "var(--series-focus)" },
  { key: "motivation", label: "Motivation", color: "var(--series-motivation)" },
];

export function MindsetSliders({ values, onChange, compact }: { values: Vals; onChange: (v: Vals) => void; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {ROWS.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="inline-flex items-center gap-1.5 font-semibold text-text-2">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />
              {r.label}
            </span>
            <span className="tabular text-text-3">{values[r.key] ?? "–"}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={values[r.key] ?? 5}
            aria-label={r.label}
            style={{ ["--slider-color" as string]: r.color }}
            onChange={(e) => onChange({ ...values, [r.key]: Number(e.target.value) })}
          />
        </div>
      ))}
    </div>
  );
}
