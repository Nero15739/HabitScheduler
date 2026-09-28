import { ImageResponse } from "next/og";
import { PwaIcon } from "@/components/pwa-icon";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<PwaIcon size={192} />, { width: 192, height: 192 });
}
