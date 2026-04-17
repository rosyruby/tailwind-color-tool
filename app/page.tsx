"use client";

import chroma from "chroma-js";
import { useState } from "react";
import { SHADE_KEYS, useColorGenerator } from "./hooks/useColorGenerator";

type ContrastInfo = {
  whiteRatio: number;
  blackRatio: number;
  textColorClass: "text-white" | "text-black";
  recommended: "White text" | "Black text";
  selectedRatio: number;
};

function getContrastInfo(hex: string): ContrastInfo {
  const whiteRatio = chroma.contrast(hex, "#FFFFFF");
  const blackRatio = chroma.contrast(hex, "#000000");
  const useWhiteText = whiteRatio >= blackRatio;

  return {
    whiteRatio,
    blackRatio,
    textColorClass: useWhiteText ? "text-white" : "text-black",
    recommended: useWhiteText ? "White text" : "Black text",
    selectedRatio: useWhiteText ? whiteRatio : blackRatio,
  };
}

export default function Home() {
  const [hexInput, setHexInput] = useState("#6366F1");
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedHexKey, setCopiedHexKey] = useState<number | null>(null);

  const { normalizedHex, palette, configCode } = useColorGenerator(hexInput);

  const copyCode = async () => {
    if (!configCode) return;
    await navigator.clipboard.writeText(configCode);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 1500);
  };

  const exportTailwindConfig = () => {
    if (!configCode) return;
    const blob = new Blob([configCode], { type: "text/typescript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tailwind.config.ts";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyHex = async (shadeKey: number, hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopiedHexKey(shadeKey);
    setTimeout(() => setCopiedHexKey(null), 1200);
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-6 py-10 text-zinc-900">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Tailwind Color Palette Generator</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Enter a base hex color to generate a `50-950` scale and a ready-to-use `tailwind.config.ts` snippet.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={hexInput}
              onChange={(event) => setHexInput(event.target.value)}
              placeholder="#6366F1"
              className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 text-sm outline-none ring-zinc-400 transition focus:ring-2 sm:max-w-xs"
            />
            <div className="flex items-center gap-2">
              <div
                className="h-10 w-10 rounded-lg border border-zinc-200"
                style={{ backgroundColor: normalizedHex ?? "transparent" }}
              />
              <span className="text-sm font-medium text-zinc-600">{normalizedHex ?? "Invalid Hex"}</span>
            </div>
          </div>
        </section>

        {palette ? (
          <>
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SHADE_KEYS.map((key) => {
                  const chipHex = palette[key];
                  const contrastInfo = getContrastInfo(chipHex);
                  const wcagLevel = contrastInfo.selectedRatio >= 7 ? "AAA" : contrastInfo.selectedRatio >= 4.5 ? "AA" : "NG";

                  return (
                    <div key={key} className="space-y-1.5">
                      <p className="text-xs text-zinc-600">
                        White {contrastInfo.whiteRatio.toFixed(2)}:1 / Black {contrastInfo.blackRatio.toFixed(2)}:1
                        {"  "}Recommended: {contrastInfo.recommended} ({wcagLevel})
                      </p>
                      <div
                        className={`flex items-center justify-between rounded-xl border border-black/5 px-4 py-3 ${contrastInfo.textColorClass}`}
                        style={{ backgroundColor: chipHex }}
                      >
                        <span className="text-sm font-semibold">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{chipHex}</span>
                          <button
                            type="button"
                            onClick={() => copyHex(key, chipHex)}
                            className="rounded-md border border-current/35 px-2 py-1 text-[10px] font-semibold transition hover:bg-black/10"
                          >
                            {copiedHexKey === key ? "Copied" : "Copy Hex"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-900">tailwind.config.ts snippet</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyCode}
                    className="rounded-md border border-zinc-200 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700"
                  >
                    {copiedConfig ? "Copied" : "Copy Code"}
                  </button>
                  <button
                    type="button"
                    onClick={exportTailwindConfig}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100"
                  >
                    Export tailwind.config.ts
                  </button>
                </div>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100">
                <code>{configCode}</code>
              </pre>
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            Please enter a valid hex color (for example: `#0EA5E9`, `0EA5E9`, or `abc`).
          </section>
        )}
      </main>
    </div>
  );
}
