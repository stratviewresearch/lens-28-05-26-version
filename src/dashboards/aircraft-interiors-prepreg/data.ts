/**
 * Types, data fetching hook, and utility hooks for Aircraft Interiors Prepreg dashboard.
 * Fetches XLS from remote proxy and parses into DualMarketData (value + volume).
 *
 * Data segments:
 *   - Panel Type: Panels (7 sub), Non-Sandwich Panels (3 sub)
 *   - Resin Type: Thermoset (Phenolic, Epoxy, Other), Thermoplastic (PEI, Other)
 *   - Fiber Type: Glass, Carbon, Other (cross-tabbed by Resin Type)
 *   - Form Type: Woven, Unidirectional, Laminates (cross-tabbed by Resin Type)
 *   - Region: NA, Europe, AP, RoW
 *   - OEM: Boeing, Airbus, Others
 *   - Sales Channel: OE, Aftermarket
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
  endUser: SegmentData[];           // Panel Type parents (Panels, Non-Sandwich Panels)
  aircraftType: SegmentData[];      // Sales Channel (OE, Aftermarket)
  region: SegmentData[];
  application: SegmentData[];       // Form Type (aggregated)
  furnishedEquipment: SegmentData[];// Fiber Type (aggregated)
  processType: SegmentData[];       // OEM (Boeing, Airbus, Others)
  materialType: SegmentData[];      // Resin Type (Thermoset, Thermoplastic)
  countryDataByRegion: Record<string, SegmentData[]>;
  endUserByAircraftType: Record<string, SegmentData[]>;   // Panel Type children per parent
  endUserByRegion: Record<string, SegmentData[]>;
  aircraftTypeByRegion: Record<string, SegmentData[]>;
  applicationByRegion: Record<string, SegmentData[]>;     // Form by Resin cross-tab
  equipmentByRegion: Record<string, SegmentData[]>;       // Fiber by Resin cross-tab
  processTypeByRegion: Record<string, SegmentData[]>;
  materialTypeByRegion: Record<string, SegmentData[]>;    // Resin sub-type breakdown
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

interface ParsedSegment {
  name: string;
  values: number[];
  children?: { name: string; values: number[] }[];
}

interface ParsedSection {
  title: string;
  years: number[];
  totalValues?: number[];
  segments: ParsedSegment[];
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

/**
 * Custom parser for Aircraft Interiors Prepreg data.
 * Handles:
 * - Title + Total row
 * - "By Panel Type" with hierarchical parents (Panels, Non-Sandwich Panels) and children
 * - Three "By Resin Type" sections (1st=resin sub-types, 2nd=fiber by resin, 3rd=form by resin)
 * - "By Region", "By OEM", "By Sales Channel" as flat segments
 */
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

        // Check for total row immediately after header
        const nextLabel = lines[i]?.[0]?.trim() ?? "";
        const isTotalRow = nextLabel.startsWith("(") || nextLabel.startsWith("in ") ||
          (nextLabel.toLowerCase().startsWith("total") && (nextLabel.includes("$") || nextLabel.toLowerCase().includes("million") || nextLabel.toLowerCase().includes("lbs") || nextLabel.toLowerCase().includes("unit")));
        if (i < lines.length && isTotalRow) {
          const totalValues = lines[i].slice(1, years.length + 1).map(parseNumber);
          sections.push({ title: sectionTitle, years, totalValues, segments: [] });
          i++;
          while (i < lines.length && lines[i].every(c => !c.trim())) i++;
          continue;
        }

        const section: ParsedSection = { title: sectionTitle, years, segments: [] };

        while (i < lines.length) {
          const segRow = lines[i];
          if (segRow.every(c => !c.trim())) { i++; break; }

          const segName = segRow[0]?.trim() ?? "";
          if (!segName) { i++; continue; }
          if (segName.startsWith("Total")) { i++; continue; }

          const segValues = segRow.slice(1, years.length + 1).map(parseNumber);
          section.segments.push({ name: segName, values: segValues });
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

/**
 * The Panel Type section has this structure:
 * Panels (parent)
 *   Galley Panels, Lavatory Panels, Stowage Bin Panels, Cabin Linings, Floor Panels, Cargo Liners, Others
 * Non-Sandwich Panels (parent)
 *   ECS/Air Ducts, Seats, Others
 *
 * We identify parents by checking if subsequent segments sum to the parent value.
 */
function buildPanelTypeHierarchy(section: ParsedSection): {
  parents: ParsedSegment[];
  childrenMap: Record<string, ParsedSegment[]>;
} {
  // Known parent names
  const PARENT_NAMES = ["Panels", "Non-Sandwich Panels"];
  const parents: ParsedSegment[] = [];
  const childrenMap: Record<string, ParsedSegment[]> = {};
  let currentParent: ParsedSegment | null = null;

  for (const seg of section.segments) {
    const cleanName = seg.name.trim();
    if (PARENT_NAMES.some(p => cleanName === p || cleanName === p + " ")) {
      currentParent = seg;
      parents.push(seg);
      childrenMap[seg.name] = [];
    } else if (currentParent) {
      childrenMap[currentParent.name].push(seg);
    }
  }

  return { parents, childrenMap };
}

/**
 * The three "By Resin Type" sections have parent-child structure:
 * Parent: Thermoset Prepreg / Thermoplastic Prepreg
 * Children: sub-segments (resins, fibers, or forms)
 */
function buildResinCrossTab(section: ParsedSection): {
  parents: ParsedSegment[];
  childrenMap: Record<string, ParsedSegment[]>;
} {
  const PARENT_NAMES = ["Thermoset Prepreg", "Thermoplastic Prepreg"];
  const parents: ParsedSegment[] = [];
  const childrenMap: Record<string, ParsedSegment[]> = {};
  let currentParent: ParsedSegment | null = null;

  for (const seg of section.segments) {
    const cleanName = seg.name.trim();
    if (PARENT_NAMES.some(p => cleanName === p || cleanName === p + " ")) {
      currentParent = seg;
      parents.push(seg);
      childrenMap[seg.name] = [];
    } else if (currentParent) {
      childrenMap[currentParent.name].push(seg);
    }
  }

  return { parents, childrenMap };
}

function buildMarketData(sections: ParsedSection[]): MarketData {
  // Find the title/total section
  const titleSection = sections.find(s => s.title.toLowerCase().includes("aerospace interior prepreg") || s.title.toLowerCase().includes("aircraft interior"));

  // Find sections by title
  const panelTypeSection = sections.find(s => s.title === "By Panel Type");
  const regionSection = sections.find(s => s.title === "By Region");
  const oemSection = sections.find(s => s.title === "By OEM");
  const salesChannelSection = sections.find(s => s.title === "By Sales Channel");

  // Source workbook has dedicated sections (titles match exactly).
  const resinSubTypeSection = sections.find(s => s.title === "By Resin Type"); // Resin sub-types (Phenolic, Epoxy, PEI, ...)
  const fiberByResinSection = sections.find(s => s.title === "By Fiber Type"); // Fiber by Resin (Glass, Carbon, Other)
  const formByResinSection  = sections.find(s => s.title === "By Form Type");  // Form by Resin (Woven, UD, Laminates)

  const years = titleSection?.years || panelTypeSection?.years || [];

  const toSegmentData = (seg: { name: string; values: number[] }): SegmentData => ({
    name: seg.name.trim(),
    data: years.map((y, idx) => ({ year: y, value: seg.values[idx] ?? 0 })),
  });

  const toYearlyData = (values: number[]): YearlyData[] =>
    years.map((y, idx) => ({ year: y, value: values[idx] ?? 0 }));

  // Total market
  const totalMarket = toYearlyData(titleSection?.totalValues || []);

  // Panel Type - hierarchical
  let endUser: SegmentData[] = [];
  const endUserByAircraftType: Record<string, SegmentData[]> = {};
  if (panelTypeSection) {
    const { parents, childrenMap } = buildPanelTypeHierarchy(panelTypeSection);
    endUser = parents.map(toSegmentData);
    for (const parent of parents) {
      const children = childrenMap[parent.name] || [];
      if (children.length > 0) {
        endUserByAircraftType[parent.name.trim()] = children.map(toSegmentData);
      }
    }
  }

  // Resin Type - parents with sub-resin breakdown
  let materialType: SegmentData[] = [];
  const materialTypeByRegion: Record<string, SegmentData[]> = {};
  if (resinSubTypeSection) {
    const { parents, childrenMap } = buildResinCrossTab(resinSubTypeSection);
    materialType = parents.map(toSegmentData);
    for (const parent of parents) {
      const children = childrenMap[parent.name] || [];
      if (children.length > 0) {
        materialTypeByRegion[parent.name.trim()] = children.map(toSegmentData);
      }
    }
  }

  // Fiber Type - aggregate across resin types
  let furnishedEquipment: SegmentData[] = [];
  const equipmentByRegion: Record<string, SegmentData[]> = {};
  if (fiberByResinSection) {
    const { parents, childrenMap } = buildResinCrossTab(fiberByResinSection);

    // Aggregate fiber types across Thermoset + Thermoplastic
    const fiberAgg: Record<string, number[]> = {};
    for (const parent of parents) {
      for (const child of childrenMap[parent.name] || []) {
        const name = child.name.trim();
        if (!fiberAgg[name]) fiberAgg[name] = new Array(years.length).fill(0);
        child.values.forEach((v, idx) => { fiberAgg[name][idx] += v; });
      }
    }
    furnishedEquipment = Object.entries(fiberAgg).map(([name, vals]) => toSegmentData({ name, values: vals }));

    // Cross-tab: fiber per resin parent
    for (const parent of parents) {
      const children = childrenMap[parent.name] || [];
      if (children.length > 0) {
        equipmentByRegion[parent.name.trim()] = children.map(toSegmentData);
      }
    }
  }

  // Form Type - aggregate across resin types
  let application: SegmentData[] = [];
  const applicationByRegion: Record<string, SegmentData[]> = {};
  if (formByResinSection) {
    const { parents, childrenMap } = buildResinCrossTab(formByResinSection);

    const formAgg: Record<string, number[]> = {};
    for (const parent of parents) {
      for (const child of childrenMap[parent.name] || []) {
        const name = child.name.trim();
        if (!formAgg[name]) formAgg[name] = new Array(years.length).fill(0);
        child.values.forEach((v, idx) => { formAgg[name][idx] += v; });
      }
    }
    application = Object.entries(formAgg).map(([name, vals]) => toSegmentData({ name, values: vals }));

    // Cross-tab: form per resin parent
    for (const parent of parents) {
      const children = childrenMap[parent.name] || [];
      if (children.length > 0) {
        applicationByRegion[parent.name.trim()] = children.map(toSegmentData);
      }
    }
  }

  // Region
  const region = (regionSection?.segments || []).map(toSegmentData);

  // OEM → stored in processType
  const processType = (oemSection?.segments || []).map(toSegmentData);

  // Sales Channel → stored in aircraftType
  const aircraftType = (salesChannelSection?.segments || []).map(toSegmentData);

  console.log("[Aircraft Interiors Prepreg parser] Parsed:", {
    years: years.length,
    panelType: endUser.map(s => s.name),
    resinType: materialType.map(s => s.name),
    fiberType: furnishedEquipment.map(s => s.name),
    formType: application.map(s => s.name),
    region: region.map(s => s.name),
    oem: processType.map(s => s.name),
    salesChannel: aircraftType.map(s => s.name),
    panelChildren: Object.keys(endUserByAircraftType),
    resinChildren: Object.keys(materialTypeByRegion),
    fiberByResin: Object.keys(equipmentByRegion),
    formByResin: Object.keys(applicationByRegion),
  });

  return {
    years,
    totalMarket,
    endUser,
    aircraftType,
    region,
    application,
    furnishedEquipment,
    processType,
    materialType,
    countryDataByRegion: {},
    endUserByAircraftType,
    endUserByRegion: {},
    aircraftTypeByRegion: {},
    applicationByRegion,
    equipmentByRegion,
    processTypeByRegion: {},
    materialTypeByRegion,
  };
}

// ── XLS/XLSX Workbook Parsing ─────────────────────────────────

function parseWorkbook(buffer: ArrayBuffer): DualMarketData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  console.log("[Aircraft Interiors Prepreg parser] Sheets found:", sheetNames);

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
