import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        command: {
          canvas: "#020617",
          panel: "#0f172a",
          panelSoft: "#111827",
          border: "#1f2937",
          muted: "#64748b",
        },
        severity: {
          p1: "#ef4444",
          p2: "#f97316",
          p3: "#eab308",
          p4: "#94a3b8",
        },
      },
      boxShadow: {
        urgent:
          "0 0 0 1px rgba(239, 68, 68, 0.45), 0 18px 40px rgba(127, 29, 29, 0.22)",
        command: "0 18px 50px rgba(2, 6, 23, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
