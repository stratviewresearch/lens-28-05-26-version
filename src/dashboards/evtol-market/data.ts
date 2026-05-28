import { useState, useEffect, useCallback, useRef } from "react";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";
import { EVTOL_UNITS_FALLBACK_CSV } from "./units-fallback";

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
  processType?: SegmentData[];
  materialType?: SegmentData[];
  countryDataByRegion: Record<string, SegmentData[]>;
  endUserByAircraftType: Record<string, SegmentData[]>;
  endUserByRegion: Record<string, SegmentData[]>;
  aircraftTypeByRegion: Record<string, SegmentData[]>;
  applicationByRegion: Record<string, SegmentData[]>;
  equipmentByRegion: Record<string, SegmentData[]>;
  processTypeByRegion?: Record<string, SegmentData[]>;
  materialTypeByRegion?: Record<string, SegmentData[]>;
  processTypeByApplication?: Record<string, SegmentData[]>;
}

export interface DualMarketData {
  value: MarketData;
  units: MarketData;
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// ── CSV Parsing ───────────────────────────────────────────────

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

function parseNumber(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[,$"]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function csvTextToLines(text: string): string[][] {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/).map(parseCSVLine);
}

interface ParsedSection {
  title: string;
  years: number[];
  segments: { name: string; values: number[]; subSegments?: { region: string; values: number[] }[] }[];
}

function parseSectionsFromLines(lines: string[][]): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let i = 0;

  while (i < lines.length) {
    const row = lines[i];
    if (row.length > 2 && row[0] && !row[0].startsWith("(")) {
      const potentialYears = row.slice(1).map(s => parseInt(s)).filter(n => n >= 2000 && n <= 2100);
      if (potentialYears.length >= 5) {
        const sectionTitle = row[0].trim();
        const years = potentialYears;
        i++;

        // Check for unit/total row like "(in US$ Million)", "(in Units)", or "Units"
        if (i < lines.length) {
          const unitCell = lines[i][0]?.trim().toLowerCase() || "";
          const isUnitRow = unitCell.startsWith("(") || unitCell === "units" || unitCell === "unit";
          if (isUnitRow) {
            const totalValues = lines[i].slice(1, years.length + 1).map(parseNumber);
            sections.push({ title: sectionTitle, years, segments: [{ name: "Total", values: totalValues }] });
            i++;
            while (i < lines.length && lines[i].every(c => !c.trim())) i++;
            continue;
          }
        }

        // Parse segment rows
        const section: ParsedSection = { title: sectionTitle, years, segments: [] };
        let currentParentSegment: ParsedSection["segments"][0] | null = null;
        const regionNames = ["North America", "Europe", "APAC", "RoW"];
        const isRegionSection = sectionTitle.toLowerCase().includes("region");

        while (i < lines.length) {
          const segRow = lines[i];
          if (segRow.every(c => !c.trim())) { i++; break; }

          const segName = segRow[0]?.trim();
          if (!segName) { i++; continue; }
          if (segName === "Total") { i++; continue; }

          const segValues = segRow.slice(1, years.length + 1).map(parseNumber);

          if (!isRegionSection && regionNames.includes(segName) && currentParentSegment) {
            if (!currentParentSegment.subSegments) currentParentSegment.subSegments = [];
            currentParentSegment.subSegments.push({ region: segName, values: segValues });
          } else {
            currentParentSegment = { name: segName, values: segValues };
            section.segments.push(currentParentSegment);
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

function buildMarketDataFromSections(sections: ParsedSection[]): MarketData {
  const findSection = (keywords: string[]) =>
    sections.find(s => keywords.some(k => s.title.toLowerCase().includes(k.toLowerCase())));

  const totalSection = findSection(["eVTOL Market", "eVTOL"]);
  const configSection = findSection(["Configuration Type"]);
  const regionSection = findSection(["By Region", "Region"]);
  const appSection = findSection(["Application Type"]);
  const seatingSection = findSection(["Seating Capacity"]);

  const years = totalSection?.years || configSection?.years || regionSection?.years || [];

  const toSegmentData = (seg: { name: string; values: number[] }): SegmentData => ({
    name: seg.name,
    data: years.map((y, idx) => ({ year: y, value: seg.values[idx] ?? 0 })),
  });

  const totalMarketValues = totalSection?.segments[0]?.values || [];
  const totalMarket: YearlyData[] = years.map((y, idx) => ({ year: y, value: totalMarketValues[idx] ?? 0 }));

  const endUser = (configSection?.segments || []).map(toSegmentData);
  const region = (regionSection?.segments || []).map(toSegmentData);
  const application = (appSection?.segments || []).map(toSegmentData);
  const seatingCapacity = (seatingSection?.segments || []).map(toSegmentData);

  // Build cross-tabulations: config type by region (from sub-segments)
  const endUserByRegion: Record<string, SegmentData[]> = {};
  for (const seg of configSection?.segments || []) {
    if (seg.subSegments && seg.subSegments.length > 0) {
      endUserByRegion[seg.name] = seg.subSegments.map(sub => ({
        name: sub.region,
        data: years.map((y, idx) => ({ year: y, value: sub.values[idx] ?? 0 })),
      }));
    }
  }

  return {
    years,
    totalMarket,
    endUser,
    aircraftType: [],
    region,
    application,
    furnishedEquipment: seatingCapacity,
    countryDataByRegion: {},
    endUserByAircraftType: {},
    endUserByRegion,
    aircraftTypeByRegion: {},
    applicationByRegion: {},
    equipmentByRegion: {},
  };
}

/**
 * Convert a worksheet to string[][] (same format parseSectionsFromLines expects).
 */
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

/**
 * Parse the XLS/XLSX workbook with two sheets:
 * Sheet 1 = Value (US$ Million), Sheet 2 = Units.
 * Falls back to CSV parsing if the data isn't a valid workbook.
 */
function parseWorkbook(buffer: ArrayBuffer): DualMarketData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  console.log("[eVTOL parser] Sheets found:", sheetNames);

  // Sheet 1 = value, Sheet 2 = units
  const valueSheet = workbook.Sheets[sheetNames[0]];
  const valueLines = sheetToLines(valueSheet);
  const valueSections = parseSectionsFromLines(valueLines);
  const valueData = buildMarketDataFromSections(valueSections);

  let unitsData: MarketData;
  if (sheetNames.length >= 2) {
    const unitsSheet = workbook.Sheets[sheetNames[1]];
    const unitsLines = sheetToLines(unitsSheet);
    const unitsSections = parseSectionsFromLines(unitsLines);
    unitsData = buildMarketDataFromSections(unitsSections);
  } else {
    const unitsSections = parseSectionsFromLines(csvTextToLines(EVTOL_UNITS_FALLBACK_CSV));
    unitsData = buildMarketDataFromSections(unitsSections);
  }

  console.log("[eVTOL parser] Dual data parsed:", {
    sheets: sheetNames.length,
    valueYears: valueData.years.length,
    unitsYears: unitsData.years.length,
    valueSegments: valueData.endUser.length,
  });

  return { value: valueData, units: unitsData };
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
      const parsed = parseWorkbook(buffer);
      setData(parsed);
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
