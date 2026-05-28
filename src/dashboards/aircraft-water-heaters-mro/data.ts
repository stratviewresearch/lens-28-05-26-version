/**
 * Types, data fetching hook, and utility hooks for Aircraft Water Heaters MRO dashboard.
 * Fetches CSV from remote proxy (US$ Million) and parses into MarketData.
 *
 * Source sections (each with regional children):
 *   - By Platform Type → aircraftType slot  +  aircraftTypeByRegion
 *   - By Region        → region slot        +  countryDataByRegion
 *   - By Application   → endUser slot       +  endUserByRegion
 */

import { useState, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";

// ── Types ─────────────────────────────────────────────────────

export interface YearlyData { year: number; value: number; }
export interface SegmentData { name: string; data: YearlyData[]; }

export interface MarketData {
  years: number[];
  totalMarket: YearlyData[];
  endUser: SegmentData[];               // Application
  aircraftType: SegmentData[];          // Platform Type
  region: SegmentData[];
  application: SegmentData[];           // unused — empty
  furnishedEquipment: SegmentData[];    // unused — empty
  countryDataByRegion: Record<string, SegmentData[]>;
  endUserByAircraftType: Record<string, SegmentData[]>;
  endUserByRegion: Record<string, SegmentData[]>;        // Application × Region
  aircraftTypeByRegion: Record<string, SegmentData[]>;   // Platform × Region
  aircraftTypeByOEM: Record<string, SegmentData[]>;      // empty
  applicationByRegion: Record<string, SegmentData[]>;
  equipmentByRegion: Record<string, SegmentData[]>;
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

const REGIONS = ["North America", "Europe", "Asia Pacific", "Asia-Pacific", "Rest of the World"];
const COUNTRIES = [
  "USA", "Canada", "Mexico",
  "Eastern Europe", "Western Europe",
  "China", "India", "Rest of Asia Pacific",
  "Middle East", "Latin America", "Africa",
];

function isRegion(name: string): boolean {
  return REGIONS.some(r => name.toLowerCase() === r.toLowerCase());
}
function isCountry(name: string): boolean {
  return COUNTRIES.some(c => name === c);
}

interface ParsedSection {
  title: string;
  years: number[];
  topSegments: { name: string; values: number[]; children: { name: string; values: number[] }[] }[];
  totalValues?: number[];
}

function parseSectionsFromCSV(text: string): ParsedSection[] {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => parseCSVLine(l));
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
          (nextLabel.toLowerCase().startsWith("total") && nextLabel.includes("$"));
        if (i < lines.length && isTotalRow) {
          const totalValues = lines[i].slice(1, years.length + 1).map(parseNumber);
          sections.push({ title: sectionTitle, years, topSegments: [], totalValues });
          i++;
          while (i < lines.length && lines[i].every(c => !c.trim())) i++;
          continue;
        }

        const section: ParsedSection = { title: sectionTitle, years, topSegments: [] };
        let currentParent: { name: string; values: number[]; children: { name: string; values: number[] }[] } | null = null;

        const titleLower = sectionTitle.toLowerCase();
        const isPlatformSection = titleLower.includes("platform type");
        const isRegionSection = titleLower.includes("by region");
        const isApplicationSection = titleLower.includes("application");

        const isChildRow = (name: string): boolean => {
          if (isPlatformSection)    return isRegion(name);
          if (isRegionSection)      return isCountry(name);
          if (isApplicationSection) return isRegion(name);
          return isRegion(name) || isCountry(name);
        };

        while (i < lines.length) {
          const segRow = lines[i];
          if (segRow.every(c => !c.trim())) { i++; break; }

          const segName = segRow[0]?.trim() ?? "";
          if (!segName) { i++; continue; }
          if (segName.startsWith("Total")) { i++; continue; }

          const segValues = segRow.slice(1, years.length + 1).map(parseNumber);

          if (currentParent && isChildRow(segName)) {
            currentParent.children.push({ name: segName.trim(), values: segValues });
            i++;
            continue;
          }

          currentParent = { name: segName, values: segValues, children: [] };
          section.topSegments.push(currentParent);
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

function buildMarketData(sections: ParsedSection[]): MarketData {
  const findSection = (keywords: string[]) =>
    sections.find(s => keywords.some(k => s.title.toLowerCase().includes(k.toLowerCase())));

  const totalSection = findSection(["Aircraft Water Heaters MRO", "Safety MRO", "MRO Market"]);
  const years = totalSection?.years || sections[0]?.years || [];

  const toYearlyData = (values: number[]): YearlyData[] =>
    years.map((y, idx) => ({ year: y, value: values[idx] ?? 0 }));

  const toSegmentData = (seg: { name: string; values: number[] }): SegmentData => ({
    name: seg.name, data: toYearlyData(seg.values),
  });

  const hasNonZeroData = (seg: { values: number[] }): boolean =>
    seg.values.some(v => v > 0);

  const toFilteredSegments = (section: ParsedSection | undefined): SegmentData[] =>
    (section?.topSegments || []).filter(hasNonZeroData).map(ts => toSegmentData(ts));

  const totalMarket = toYearlyData(totalSection?.totalValues || []);

  const platformSection = findSection(["By Platform Type"]);
  const regionSection = findSection(["By Region"]);
  const applicationSection = findSection(["By Application"]);

  const aircraftType = toFilteredSegments(platformSection);
  const endUser = toFilteredSegments(applicationSection);
  const region = toFilteredSegments(regionSection);

  const application: SegmentData[] = [];
  const furnishedEquipment: SegmentData[] = [];

  const buildFilteredCrossTab = (section: ParsedSection | undefined): Record<string, SegmentData[]> => {
    const result: Record<string, SegmentData[]> = {};
    if (section) {
      section.topSegments.filter(hasNonZeroData).forEach(ts => {
        const children = ts.children.filter(hasNonZeroData);
        if (children.length > 0) result[ts.name] = children.map(c => toSegmentData(c));
      });
    }
    return result;
  };

  const aircraftTypeByRegion = buildFilteredCrossTab(platformSection);
  const endUserByRegion = buildFilteredCrossTab(applicationSection);
  const countryDataByRegion = buildFilteredCrossTab(regionSection);

  const aircraftTypeByOEM: Record<string, SegmentData[]> = {};
  const endUserByAircraftType: Record<string, SegmentData[]> = {};
  const applicationByRegion: Record<string, SegmentData[]> = {};
  const equipmentByRegion: Record<string, SegmentData[]> = {};

  console.log("[Aircraft Water Heaters MRO parser] Parsed:", {
    years: years.length,
    platformType: aircraftType.map(s => s.name),
    application: endUser.map(s => s.name),
    region: region.map(s => s.name),
    crossTabs: {
      platformByRegion: Object.keys(aircraftTypeByRegion),
      applicationByRegion: Object.keys(endUserByRegion),
      countryDataByRegion: Object.keys(countryDataByRegion),
    },
  });

  return {
    years,
    totalMarket,
    endUser,
    aircraftType,
    region,
    application,
    furnishedEquipment,
    countryDataByRegion,
    endUserByAircraftType,
    endUserByRegion,
    aircraftTypeByRegion,
    aircraftTypeByOEM,
    applicationByRegion,
    equipmentByRegion,
  };
}

// ── useMarketData ─────────────────────────────────────────────

interface UseMarketDataResult {
  data: MarketData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMarketData(dataUrl: string): UseMarketDataResult {
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(dataUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const text = await response.text();
      const sections = parseSectionsFromCSV(text);
      const parsed = buildMarketData(sections);
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
