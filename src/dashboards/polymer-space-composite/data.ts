/**
 * Polymer Space Composite Matrix Market — data layer.
 *
 * Source: bundled XLSX (src/dashboards/polymer-space-composite/source-data.xlsx)
 * Two sheets: "in US$ Million" and "in Million Lbs". Identical structure.
 *
 * Sections (exact titles from source):
 *   1. Polymer Space Composite Matrix Market   → totalMarket
 *   2. Application by Component                → endUser (parents) + endUserByAircraftType (children)
 *   3. Application by Resin Type               → applicationByRegion (repurposed: app → resin)
 *   4. By Resin Type                           → materialType (Thermoset/Thermoplastics parents)
 *                                                + application (flat sub-types)
 *   5. Application by Fiber Type               → equipmentByRegion (repurposed: app → fiber)
 *   6. By Fiber Type                           → furnishedEquipment
 *   7. Application by Region                   → endUserByRegion
 *   8. By Region                               → region
 *
 * Parent labels are explicit (no value-sum heuristics).
 * "BMI-graphite" → "BMI" (only appears in volume sheet's By Resin Type).
 */

import { useState, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";

// ── Types ─────────────────────────────────────────────────────

export interface YearlyData { year: number; value: number; }
export interface SegmentData { name: string; data: YearlyData[]; }

export interface MarketData {
  years: number[];
  totalMarket: YearlyData[];
  endUser: SegmentData[];
  aircraftType: SegmentData[];
  region: SegmentData[];
  application: SegmentData[];
  furnishedEquipment: SegmentData[];
  processType: SegmentData[];
  materialType: SegmentData[];
  countryDataByRegion: Record<string, SegmentData[]>;
  endUserByAircraftType: Record<string, SegmentData[]>;
  endUserByRegion: Record<string, SegmentData[]>;
  aircraftTypeByRegion: Record<string, SegmentData[]>;
  applicationByRegion: Record<string, SegmentData[]>;
  equipmentByRegion: Record<string, SegmentData[]>;
  processTypeByRegion: Record<string, SegmentData[]>;
  materialTypeByRegion: Record<string, SegmentData[]>;
}

export interface DualMarketData {
  value: MarketData;
  volume: MarketData;
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// ── Sheet → rows ──────────────────────────────────────────────

function sheetToLines(sheet: XLSX.WorkSheet): (string | number | null)[][] {
  const ref = sheet["!ref"];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const lines: (string | number | null)[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: (string | number | null)[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell ? (cell.v as string | number | null) : null);
    }
    lines.push(row);
  }
  return lines;
}

function toNumber(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[,$"]/g, "").trim());
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

const cellLabel = (v: unknown): string => (v == null ? "" : String(v).trim());
const isTotalLabel = (s: string) => /^total\b/i.test(s) || /^\(/.test(s);
const isBlankRow = (row: (string | number | null)[]) =>
  row.every(c => c == null || String(c).trim() === "");

// ── Section extraction ────────────────────────────────────────

interface Section {
  title: string;
  years: number[];
  rows: { name: string; values: number[] }[];
  totalRow?: { name: string; values: number[] };
}

function isSectionHeaderRow(row: (string | number | null)[]): { title: string; years: number[] } | null {
  const title = cellLabel(row[0]);
  if (!title || isTotalLabel(title)) return null;
  const years = row.slice(1).map(v => toNumber(v)).filter(n => n >= 2000 && n <= 2100);
  if (years.length < 5) return null;
  return { title, years };
}

function extractSections(lines: (string | number | null)[][]): Section[] {
  const sections: Section[] = [];
  let i = 0;
  while (i < lines.length) {
    const header = isSectionHeaderRow(lines[i]);
    if (header) {
      i++;
      const rows: { name: string; values: number[] }[] = [];
      let totalRow: { name: string; values: number[] } | undefined;
      while (i < lines.length) {
        const r = lines[i];
        if (isBlankRow(r)) { i++; break; }
        if (isSectionHeaderRow(r)) break; // next section starts — do not consume
        const name = cellLabel(r[0]);
        if (!name) { i++; continue; }
        const values = header.years.map((_, k) => toNumber(r[k + 1]));
        if (isTotalLabel(name)) {
          totalRow = { name, values };
        } else {
          rows.push({ name, values });
        }
        i++;
      }
      sections.push({ title: header.title, years: header.years, rows, totalRow });
      continue;
    }
    i++;
  }
  return sections;
}

function findSection(sections: Section[], predicate: (title: string) => boolean): Section | undefined {
  return sections.find(s => predicate(s.title.toLowerCase()));
}

// ── Build MarketData ──────────────────────────────────────────

const APP_PARENTS = new Set(["payload", "launch vehicles", "group support equipment"]);
const RESIN_PARENTS = new Set(["thermoset", "thermosets", "thermoplastic", "thermoplastics"]);
const REGION_CHILDREN = new Set([
  "north america", "europe", "asia pacific", "asia-pacific", "rest of the world",
]);

type Row = { name: string; values: number[] };
type Group = { parent: Row; children: Row[] };

function groupByParents(rows: Row[], parents: Set<string>): Group[] {
  const out: Group[] = [];
  let current: Group | null = null;
  for (const row of rows) {
    if (parents.has(row.name.toLowerCase())) {
      current = { parent: row, children: [] };
      out.push(current);
    } else if (current) {
      current.children.push(row);
    }
  }
  return out;
}

function buildMarketData(sections: Section[]): MarketData {
  const totalSec   = findSection(sections, t => t.startsWith("polymer space composite"));
  const appCompSec = findSection(sections, t => t.startsWith("application by component"));
  const appResSec  = findSection(sections, t => t.startsWith("application by resin"));
  const resinSec   = findSection(sections, t => t.startsWith("by resin type"));
  const appFibSec  = findSection(sections, t => t.startsWith("application by fiber"));
  const fiberSec   = findSection(sections, t => t.startsWith("by fiber type"));
  const appRegSec  = findSection(sections, t => t.startsWith("application by region"));
  const regionSec  = findSection(sections, t => t.startsWith("by region"));

  const years = totalSec?.years ?? appCompSec?.years ?? [];
  const toYearly = (values: number[]): YearlyData[] =>
    years.map((y, i) => ({ year: y, value: values[i] ?? 0 }));
  const toSeg = (r: Row): SegmentData => ({ name: r.name, data: toYearly(r.values) });
  const hasNonZero = (values: number[]) => values.some(v => v > 0);

  // 1. Total — comes from the section's Total row (header section has no body rows)
  const totalMarket = toYearly(
    totalSec?.totalRow?.values ?? appCompSec?.totalRow?.values ?? []
  );

  // Helper: if a parent has no children in this breakdown, fall back to the parent itself as a single segment
  const fillEmptyParents = (
    map: Record<string, SegmentData[]>,
    groups: Group[],
  ) => {
    for (const g of groups) {
      if (!map[g.parent.name] || map[g.parent.name].length === 0) {
        map[g.parent.name] = [toSeg(g.parent)];
      }
    }
  };

  // 2. Application by Component
  const appGroups = appCompSec ? groupByParents(appCompSec.rows, APP_PARENTS) : [];
  const endUser: SegmentData[] = appGroups.map(g => toSeg(g.parent));
  const endUserByAircraftType: Record<string, SegmentData[]> = {};
  for (const g of appGroups) {
    if (g.children.length > 0) {
      endUserByAircraftType[g.parent.name] = g.children
        .filter(c => hasNonZero(c.values))
        .map(toSeg);
    }
  }
  fillEmptyParents(endUserByAircraftType, appGroups);

  // 3. Application by Resin Type (app → resin)
  const applicationByRegion: Record<string, SegmentData[]> = {};
  const appResGroups = appResSec ? groupByParents(appResSec.rows, APP_PARENTS) : [];
  for (const g of appResGroups) {
    applicationByRegion[g.parent.name] = g.children
      .filter(c => hasNonZero(c.values))
      .map(toSeg);
  }
  fillEmptyParents(applicationByRegion, appGroups);

  // 4. By Resin Type → materialType (parents) + application (flat sub-types)
  const materialType: SegmentData[] = [];
  const application: SegmentData[] = [];
  if (resinSec) {
    for (const g of groupByParents(resinSec.rows, RESIN_PARENTS)) {
      const parentName = /thermoplastic/i.test(g.parent.name) ? "Thermoplastics" : "Thermoset";
      materialType.push({ name: parentName, data: toYearly(g.parent.values) });
      for (const child of g.children) {
        let name = child.name;
        if (/bmi-?graphite/i.test(name)) name = "BMI";
        if (name === "Others") name = `Others (${parentName})`;
        application.push({ name, data: toYearly(child.values) });
      }
    }
  }

  // 5. Application by Fiber Type (app → fiber)
  const equipmentByRegion: Record<string, SegmentData[]> = {};
  const appFibGroups = appFibSec ? groupByParents(appFibSec.rows, APP_PARENTS) : [];
  for (const g of appFibGroups) {
    equipmentByRegion[g.parent.name] = g.children
      .filter(c => hasNonZero(c.values))
      .map(toSeg);
  }
  fillEmptyParents(equipmentByRegion, appGroups);

  // 6. By Fiber Type
  const furnishedEquipment: SegmentData[] = (fiberSec?.rows ?? [])
    .filter(r => hasNonZero(r.values))
    .map(toSeg);

  // 7. Application by Region (keep all 4 regions even if a row happens to be zero)
  const endUserByRegion: Record<string, SegmentData[]> = {};
  const appRegGroups = appRegSec ? groupByParents(appRegSec.rows, APP_PARENTS) : [];
  for (const g of appRegGroups) {
    endUserByRegion[g.parent.name] = g.children
      .filter(c => REGION_CHILDREN.has(c.name.toLowerCase()))
      .map(toSeg);
  }
  fillEmptyParents(endUserByRegion, appGroups);


  // 8. By Region
  const region: SegmentData[] = (regionSec?.rows ?? [])
    .filter(r => hasNonZero(r.values))
    .map(toSeg);

  return {
    years,
    totalMarket,
    endUser,
    aircraftType: [],
    region,
    application,
    furnishedEquipment,
    processType: [],
    materialType,
    countryDataByRegion: {},
    endUserByAircraftType,
    endUserByRegion,
    aircraftTypeByRegion: {},
    applicationByRegion,
    equipmentByRegion,
    processTypeByRegion: {},
    materialTypeByRegion: {},
  };
}

// ── Workbook → DualMarketData ─────────────────────────────────

function parseWorkbook(buffer: ArrayBuffer): DualMarketData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  const buildFromSheetName = (name: string): MarketData => {
    const sheet = workbook.Sheets[name];
    return buildMarketData(extractSections(sheetToLines(sheet)));
  };

  const valueSheetName  = sheetNames.find(n => /us\$|million(?!\s+lbs)/i.test(n)) ?? sheetNames[0];
  const volumeSheetName = sheetNames.find(n => /lbs/i.test(n)) ?? sheetNames[1] ?? sheetNames[0];

  return {
    value:  buildFromSheetName(valueSheetName),
    volume: buildFromSheetName(volumeSheetName),
  };
}

// ── useMarketData ─────────────────────────────────────────────

interface UseMarketDataResult {
  data: DualMarketData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMarketData(dataUrl: string): UseMarketDataResult {
  const [data, setData] = useState<DualMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(dataUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const buffer = await response.arrayBuffer();
      setData(parseWorkbook(buffer));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load market data");
    } finally {
      setIsLoading(false);
    }
  }, [dataUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, isLoading, error, refetch: fetchData };
}

// ── useDrillDown ──────────────────────────────────────────────

export interface DrillDownState {
  isOpen: boolean;
  segmentName: string;
  segmentData: YearlyData[];
  color: string;
  relatedSegments?: { title: string; data: SegmentData[] };
}

const initialDrillDown: DrillDownState = {
  isOpen: false, segmentName: "", segmentData: [], color: "hsl(192, 95%, 55%)",
};

export function useDrillDown() {
  const [drillDownState, setDrillDownState] = useState<DrillDownState>(initialDrillDown);
  const openDrillDown = useCallback(
    (segmentName: string, segmentData: YearlyData[], color: string, relatedSegments?: { title: string; data: SegmentData[] }) => {
      setDrillDownState({ isOpen: true, segmentName, segmentData, color, relatedSegments });
    }, []
  );
  const closeDrillDown = useCallback(() => setDrillDownState(initialDrillDown), []);
  return { drillDownState, openDrillDown, closeDrillDown };
}

// ── useChartDownload ──────────────────────────────────────────

const EXPORT_WIDTH = 1920;
const EXPORT_HEIGHT = 1080;
const HEADER_HEIGHT = 90;
const FOOTER_HEIGHT = 60;
const BG_COLOR = "#0a0f1a";

export function useChartDownload() {
  const downloadChart = useCallback(async (ref: React.RefObject<HTMLDivElement>, filename: string, title?: string) => {
    if (!ref.current) return;
    try {
      const filter = (node: HTMLElement) => !node?.hasAttribute?.("data-download-exclude");
      const chartDataUrl = await toPng(ref.current, { backgroundColor: BG_COLOR, quality: 1, pixelRatio: 3, filter });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = EXPORT_WIDTH;
      canvas.height = EXPORT_HEIGHT;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
      if (title) {
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(0, 0, EXPORT_WIDTH, HEADER_HEIGHT);
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.font = "bold 28px system-ui, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(title, 40, 55);
      }
      const chartImg = new Image();
      chartImg.src = chartDataUrl;
      await new Promise((resolve) => { chartImg.onload = resolve; });
      const topOffset = title ? HEADER_HEIGHT : 20;
      const padding = 30;
      const chartAreaWidth = EXPORT_WIDTH - padding * 2;
      const chartAreaHeight = EXPORT_HEIGHT - topOffset - FOOTER_HEIGHT - padding;
      const scale = Math.min(chartAreaWidth / chartImg.width, chartAreaHeight / chartImg.height);
      const drawW = chartImg.width * scale;
      const drawH = chartImg.height * scale;
      ctx.drawImage(chartImg, (EXPORT_WIDTH - drawW) / 2, topOffset + (chartAreaHeight - drawH) / 2, drawW, drawH);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, EXPORT_HEIGHT - FOOTER_HEIGHT, EXPORT_WIDTH, FOOTER_HEIGHT);
      const logoImg = new Image();
      logoImg.src = stratviewLogoWhite;
      await new Promise((resolve) => { logoImg.onload = resolve; });
      const logoH = 30;
      const logoW = (logoImg.width / logoImg.height) * logoH;
      ctx.drawImage(logoImg, 24, EXPORT_HEIGHT - FOOTER_HEIGHT + (FOOTER_HEIGHT - logoH) / 2, logoW, logoH);
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("stratviewresearch.com", EXPORT_WIDTH - 24, EXPORT_HEIGHT - FOOTER_HEIGHT + (FOOTER_HEIGHT + 10) / 2);
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png", 1);
      link.click();
    } catch (error) {
      console.error("Failed to download chart:", error);
    }
  }, []);
  return { downloadChart };
}
