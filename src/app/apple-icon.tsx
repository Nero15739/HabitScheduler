import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#34e3c2", borderRadius: 40 }}>
        <svg width="110" height="110" viewBox="0 0 64 64">
          <path d="M16 34l11 11 21-24" fill="none" stroke="#06201b" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    size,
  );
}
