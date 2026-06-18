import type { SlotColor } from "./types";

export const COLOR_HEX: Record<SlotColor, string> = {
  roig: "#E06666",
  vermell: "#F4CCCC",
  verd: "#D9EAD3",
  blanc: "#FFFFFF",
};

export const COLOR_LABEL: Record<SlotColor, string> = {
  roig: "Persones veteranes per cap de barra",
  vermell: "Persones amb experiència (+7 barres)",
  verd: "Persones amb poca o gens experiència",
  blanc: "Indiferent l'experiència que tinguis",
};

export const LEGEND_ORDER: SlotColor[] = ["roig", "vermell", "verd", "blanc"];

/** Text colour that stays readable on each slot background. */
export function textOn(_color: SlotColor): string {
  return "#1a1a1a";
}
