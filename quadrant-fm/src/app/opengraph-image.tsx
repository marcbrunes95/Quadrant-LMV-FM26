import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const alt = "Quadrant Festa Major 2026 · La Mama Ve";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const logo = readFileSync(join(process.cwd(), "public", "lamamave.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdf2f8",
          gap: 48,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={640} alt="La Mama Ve" />
        <div style={{ fontSize: 56, fontWeight: 800, color: "#be185d" }}>
          Quadrant Festa Major 2026
        </div>
        <div style={{ fontSize: 36, color: "#6b7280" }}>
          Apunta&apos;t als torns
        </div>
      </div>
    ),
    { ...size },
  );
}
