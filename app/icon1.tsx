import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0c0a09",
          color: "#f59e0b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: -6,
        }}
      >
        HS
      </div>
    ),
    { ...size }
  );
}
