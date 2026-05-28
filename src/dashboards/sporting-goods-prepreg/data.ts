/**
 * Types, data fetching hook, and utility hooks for Sporting Goods Prepreg dashboard.
 * Fetches XLS from remote proxy and parses into DualMarketData (value + volume).
 *
 * Data segments:
 *   - Fiber Type: Carbon, Glass, Aramid (with region cross-tabs)
 *   - Resin Type: Thermoplastics, Thermosets (with region cross-tabs)
 *   - Form Type: Unidirectional Tape, Fabric (with region cross-tabs)
 *   - Process Type: Autoclave, Out of Autoclave, Others (with region cross-tabs)
 *   - Region: derived from Fiber Type cross-tabs (NA, Europe, AP, RoW)
 *
 * Two sheets: "in US$ Million" and "in Million Lbs".
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
  processTypeByApplication?: Record<string, SegmentData[]>;
}

export interface DualMarketData {
  value: MarketData;
  volume: MarketData;
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// ── Parsing helpers ───────────────────────────────────────────

function parseNumber(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[,$"]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

interface ParsedSection {
  title: string;
  years: number[];
  segments: { name: string; values: number[]; subSegments?: { name: string; values: number[] }[] }[];
}

function sheetToLines(sheet: XLSX.WorkSheet): string[][] {
  const ref = sheet["!ref"];
  if (!ref) return [];
  const range = XLSX.utils.decode_range(ref);
  const lines: string[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row.push(cell ? String(cell.v ?? "") : "");
    }
    lines.push(row);
  }
  return lines;
}

const REGION_NAMES = ["North America", "Europe", "Asia Pacific", "Asia-Pacific", "Rest of the World"];

function parseSectionsFromLines(lines: string[][]): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const row = lines[i];
    if (row.length > 2 && row[0] && !row[0].startsWith("(") && !row[0].startsWith("Total")) {
      const potentialYears = row.slice(1).map(s => parseInt(s)).filter(n => n >= 2000 && n <= 2100);
      if (potentialYears.length >= 5) {
        const sectionTitle = row[0].trim();
        const years = potentialYears;
        i++;

        const nextLabel = lines[i]?.[0]?.trim() ?? "";
        const isTotalRow = nextLabel.startsWith("(") || nextLabel.startsWith("in ") ||
          (nextLabel.toLowerCase().startsWith("total") && (nextLabel.includes("$") || nextLabel.toLowerCase().includes("million") || nextLabel.toLowerCase().includes("lbs") || nextLabel.toLowerCase().includes("unit")));
        if (i < lines.length && isTotalRow) {
          const totalValues = lines[i].slice(1, years.length + 1).map(parseNumber);
          sections.push({ title: sectionTitle, years, segments: [{ name: "Total", values: totalValues }] });
          i++;
          while (i < lines.length && lines[i].every(c => !c.trim())) i++;
          continue;
        }

        const section: ParsedSection = { title: sectionTitle, years, segments: [] };
        let currentParent: ParsedSection["segments"][0] | null = null;

        while (i < lines.length) {
          const segRow = lines[i];
          if (segRow.every(c => !c.trim())) { i++; break; }

          const segName = segRow[0]?.trim() ?? "";
          if (!segName) { i++; continue; }
          if (segName.startsWith("Total")) { i++; continue; }

          const segValues = segRow.slice(1, years.length + 1).map(parseNumber);

          const isRegionSub = currentParent && REGION_NAMES.some(rn => segName === rn || segName.startsWith(rn));

          if (isRegionSub && currentParent) {
            if (!currentParent.subSegments) currentParent.subSegments = [];
            currentParent.subSegments.push({ name: segName, values: segValues });
          } else {
            currentParent = { name: segName, values: segValues };
            section.segments.push(currentParent);
          }
          i++;
        }
        sections.push(section);
        continue;
      }
    }
    i++;
  }
  return sections;
}

function hasNonZeroData(seg: { values: number[] }): boolean {
  return seg.values.some(v => v > 0);
}

function buildMarketData(sections: ParsedSection[]): MarketData {
  const findSection = (keywords: string[]) =>
    sections.find(s => keywords.some(k => s.title.toLowerCase().includes(k.toLowerCase())));

  const totalSection = findSection(["Sporting Good Prepreg"]);
  const fiberSection = findSection(["Fiber Type"]);
  const resinSection = findSection(["Resin Type"]);
  const formSection = findSection(["Form Type"]);
  const processSection = findSection(["Process Type"]);

  const years = totalSection?.years || fiberSection?.years || [];

  const toSegmentData = (seg: { name: string; values: number[] }): SegmentData => ({
    name: seg.name,
    data: years.map((y, idx) => ({ year: y, value: seg.values[idx] ?? 0 })),
  });

  const toYearlyData = (values: number[]): YearlyData[] =>
    years.map((y, idx) => ({ year: y, value: values[idx] ?? 0 }));

  const totalMarket = toYearlyData(totalSection?.segments[0]?.values || []);
  const furnishedEquipment = (fiberSection?.segments || []).filter(hasNonZeroData).map(toSegmentData);
  const materialType = (resinSection?.segments || []).filter(hasNonZeroData).map(toSegmentData);
  const application = (formSection?.segments || []).filter(hasNonZeroData).map(toSegmentData);
  const processType = (processSection?.segments || []).filter(hasNonZeroData).map(toSegmentData);

  // Derive region from fiber type cross-tabs
  const regionMap: Record<string, number[]> = {};
  for (const seg of fiberSection?.segments || []) {
    if (seg.subSegments) {
      for (const sub of seg.subSegments) {
        if (!regionMap[sub.name]) regionMap[sub.name] = new Array(years.length).fill(0);
        sub.values.forEach((v, idx) => { regionMap[sub.name][idx] += v; });
      }
    }
  }
  const region = Object.entries(regionMap)
    .filter(([_, vals]) => vals.some(v => v > 0))
    .map(([name, vals]) => toSegmentData({ name, values: vals }));

  // Cross-tabs: segment by region
  const buildCrossTab = (section: ParsedSection | undefined): Record<string, SegmentData[]> => {
    const result: Record<string, SegmentData[]> = {};
    if (!section) return result;
    for (const seg of section.segments) {
      if (seg.subSegments && seg.subSegments.length > 0 && hasNonZeroData(seg)) {
        result[seg.name] = seg.subSegments.map(sub => ({
          name: sub.name,
          data: toYearlyData(sub.values),
        }));
      }
    }
    return result;
  };

  const equipmentByRegion = buildCrossTab(fiberSection);
  const materialTypeByRegion = buildCrossTab(resinSection);
  const applicationByRegion = buildCrossTab(formSection);
  const processTypeByRegion = buildCrossTab(processSection);

  console.log("[Sporting Goods Prepreg parser] Parsed:", {
    years: years.length,
    fiberType: furnishedEquipment.map(s => s.name),
    resinType: materialType.map(s => s.name),
    formType: application.map(s => s.name),
    processType: processType.map(s => s.name),
    region: region.map(s => s.name),
  });

  return {
    years,
    totalMarket,
    endUser: [],
    aircraftType: [],
    region,
    application,
    furnishedEquipment,
    processType,
    materialType,
    countryDataByRegion: {},
    endUserByAircraftType: {},
    endUserByRegion: {},
    aircraftTypeByRegion: {},
    applicationByRegion,
    equipmentByRegion,
    processTypeByRegion,
    materialTypeByRegion,
  };
}

// ── XLS/XLSX Workbook Parsing ─────────────────────────────────

function parseWorkbook(buffer: ArrayBuffer): DualMarketData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  console.log("[Sporting Goods Prepreg parser] Sheets found:", sheetNames);

  const valueSheet = workbook.Sheets[sheetNames[0]];
  const valueLines = sheetToLines(valueSheet);
  const valueSections = parseSectionsFromLines(valueLines);
  const valueData = buildMarketData(valueSections);

  let volumeData: MarketData;
  if (sheetNames.length >= 2) {
    const volumeSheet = workbook.Sheets[sheetNames[1]];
    const volumeLines = sheetToLines(volumeSheet);
    const volumeSections = parseSectionsFromLines(volumeLines);
    volumeData = buildMarketData(volumeSections);
  } else {
    volumeData = valueData;
  }

  return { value: valueData, volume: volumeData };
}

// ── CSV fallback ──────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseCSVFallback(text: string): DualMarketData {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map(parseCSVLine);
  const sections = parseSectionsFromLines(lines);
  const data = buildMarketData(sections);
  return { value: data, volume: data };
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
      const firstBytes = new Uint8Array(buffer.slice(0, 8));
      const isXLS = (firstBytes[0] === 0xD0 && firstBytes[1] === 0xCF) ||
                    (firstBytes[0] === 0x50 && firstBytes[1] === 0x4B);

      if (isXLS) {
        const parsed = parseWorkbook(buffer);
        setData(parsed);
      } else {
        const text = new TextDecoder().decode(buffer);
        const parsed = parseCSVFallback(text);
        setData(parsed);
      }
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
