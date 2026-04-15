"use client";

import chroma from "chroma-js";
import { useMemo } from "react";

export const SHADE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ShadeKey = (typeof SHADE_KEYS)[number];

const SHADE_POSITION: Record<ShadeKey, number> = {
  50: 0.05,
  100: 0.1,
  200: 0.2,
  300: 0.3,
  400: 0.4,
  500: 0.5,
  600: 0.6,
  700: 0.7,
  800: 0.8,
  900: 0.9,
  950: 0.95,
};

function normalizeHex(input: string): string | null {
  const stripped = input.trim().replace(/^#/, "");
  if (!/^([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(stripped)) {
    return null;
  }

  if (stripped.length === 3) {
    return `#${stripped
      .split("")
      .map((char) => char + char)
      .join("")
      .toUpperCase()}`;
  }

  return `#${stripped.toUpperCase()}`;
}

function createToneAnchor(baseColor: chroma.Color, mode: "light" | "dark"): chroma.Color {
  const [, baseC, baseH] = baseColor.lch();
  const targetL = mode === "light" ? 97 : 20;
  const targetC =
    mode === "light"
      ? baseC > 0
        ? Math.max(baseC * 0.42, 10)
        : 0
      : baseC > 0
        ? Math.max(baseC * 0.9, 12)
        : 0;

  if (Number.isNaN(baseH)) {
    return chroma.lch(targetL, 0, 0);
  }

  return chroma.lch(targetL, targetC, baseH);
}

function generatePalette(baseHex: string): Record<ShadeKey, string> {
  const baseColor = chroma(baseHex);
  const lightAnchor = createToneAnchor(baseColor, "light");
  const darkAnchor = createToneAnchor(baseColor, "dark");
  const scale = chroma.scale([lightAnchor, baseColor, darkAnchor]).mode("lch").domain([0.05, 0.5, 0.95]);

  return SHADE_KEYS.reduce(
    (acc, key) => {
      acc[key] = scale(SHADE_POSITION[key]).hex("rgb").toUpperCase();
      return acc;
    },
    {} as Record<ShadeKey, string>,
  );
}

function makeTailwindConfigCode(palette: Record<ShadeKey, string>): string {
  const lines = SHADE_KEYS.map((key) => `      ${key}: "${palette[key]}",`);
  return `// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        brand: {
${lines.join("\n")}
        },
      },
    },
  },
} satisfies Config;
`;
}

export function useColorGenerator(hexInput: string) {
  const normalizedHex = useMemo(() => normalizeHex(hexInput), [hexInput]);
  const palette = useMemo(
    () => (normalizedHex ? generatePalette(normalizedHex) : null),
    [normalizedHex],
  );
  const configCode = useMemo(() => (palette ? makeTailwindConfigCode(palette) : ""), [palette]);

  return { normalizedHex, palette, configCode };
}
