import { FM_COLS, FRIGO_COLS, GATZARA_COLS } from "./grid";
import type { EventId, MedalThresholds, TableName } from "./types";

export interface EventGrid {
  title: string;
  tables: TableName[];
  cols: string[];
}

export interface EventConfig {
  event: EventId;
  /** Nom visible ("aquesta FM" als missatges de celebració). */
  name: string;
  medal: MedalThresholds;
  grids: EventGrid[];
  programPdf?: string;
}

export const FM_EVENT: EventConfig = {
  event: "fm",
  name: "FM",
  medal: { bronze: 1, plata: 3, or: 5 },
  grids: [
    { title: "Prèvia i Festa Major", tables: ["FM"], cols: FM_COLS },
    { title: "Frigofiesta", tables: ["FRIGO"], cols: FRIGO_COLS },
  ],
  programPdf: "/Programa_Festa_Major_2026.pdf",
};

export const GATZARA_EVENT: EventConfig = {
  event: "gatzara",
  name: "Gatzara",
  medal: { bronze: 1, plata: 2, or: 3 },
  grids: [
    { title: "Gatzara Sonora", tables: ["GATZARA_BARRA", "GATZARA_CUINA"], cols: GATZARA_COLS },
  ],
};
