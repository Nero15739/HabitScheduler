/** Habit/goal accent colors. Dark values validated for the dark card surface; light for the light surface. */
export const HABIT_COLORS: Record<string, { dark: string; light: string; label: string }> = {
  mint: { dark: "#34e3c2", light: "#0fa892", label: "Mint" },
  violet: { dark: "#9d8cff", light: "#6f5fe0", label: "Violet" },
  rose: { dark: "#ff6b8a", light: "#d33f63", label: "Rose" },
  amber: { dark: "#f4b740", light: "#c98500", label: "Amber" },
  sky: { dark: "#5ab8ff", light: "#2a78d6", label: "Sky" },
  lime: { dark: "#a3e635", light: "#4d8a00", label: "Lime" },
  coral: { dark: "#ff8a5b", light: "#d95926", label: "Coral" },
  pink: { dark: "#f472b6", light: "#c7407f", label: "Pink" },
};

export const COLOR_KEYS = Object.keys(HABIT_COLORS);

/** CSS value that resolves per theme without JS: uses light-dark() with data-theme fallbacks handled via CSS vars. */
export function colorVar(key: string): string {
  return `var(--hc-${key in HABIT_COLORS ? key : "mint"})`;
}

export function colorCssVars(theme: "dark" | "light"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(HABIT_COLORS)) out[`--hc-${k}`] = v[theme];
  return out;
}

export function colorCss(): string {
  const light = Object.entries(HABIT_COLORS).map(([k, v]) => `--hc-${k}:${v.light};`).join("");
  const dark = Object.entries(HABIT_COLORS).map(([k, v]) => `--hc-${k}:${v.dark};`).join("");
  return `:root{${light}}:root[data-theme="dark"]{${dark}}`;
}
