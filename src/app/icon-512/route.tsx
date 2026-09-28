import { ImageResponse } from "next/og";
import { PwaIcon } from "@/components/pwa-icon";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<PwaIcon size={512} maskable />, { width: 512, height: 512 });
}
