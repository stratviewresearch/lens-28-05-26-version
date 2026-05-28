/**
 * Types, data fetching hook, and utility hooks for Aircraft Cabin Linings dashboard.
 * Fetches CSV from remote proxy and parses into MarketData.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toPng } from "html-to-image";
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

interface ParsedSection {
  title: string;
  years: number[];
  segments: { name: string; values: number[]; subSegments?: { name: string; values: number[] }[] }[];
}

// Normalize known misspellings in the source data
function normalizeName(name: string): string {
  const fixes: Record<string, string> = {
    "Bussiness Jet": "Business Jet",
    "Regional Aircaft": "Regional Aircraft",
    "Business Jets": "Business Jets",
  };
  return fixes[name] || name;
}

function parseSectionsFromCSV(text: string): ParsedSection[] {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => parseCSVLine(l));
  return parseSectionsFromLines(lines);
}

function parseSectionsFromLines(lines: string[][]): ParsedSection[] {
  const sections: ParsedSection[] = [];
  let i = 0;

  // Known region names for detecting sub-segments
  const regionNames = ["North America", "Europe", "Asia-Pacific", "Rest of the World", "RoW", "RoAP"];
  // Known country names for region sub-segments
  const countryNames = ["USA", "Canada", "Mexico", "Germany", "France", "UK", "Russia", "Others",
    "China", "Japan", "India", "RoAP", "Saudi Arabia", "Brazil"];
  // Known aircraft sub-segment names under end-user
  const aircraftNames = ["Narrow Body Aircraft", "Wide-Body Aircraft", "Regional Aircraft", "Regional Aircaft", "Business Jet", "Business Jets"];

  while (i < lines.length) {
    const row = lines[i];
    if (row.length > 2 && row[0] && !row[0].startsWith("(") && !row[0].startsWith("Total")) {
      const potentialYears = row.slice(1).map(s => parseInt(s)).filter(n => n >= 2000 && n <= 2100);
      if (potentialYears.length >= 5) {
        const sectionTitle = row[0].trim();
        const years = potentialYears;
        i++;

        // Check for unit/total row like "(in US$ Million)" or "Total (in US$ Million)"
        const nextLabel = lines[i]?.[0]?.trim() ?? "";
        const isTotalRow = nextLabel.startsWith("(") || nextLabel.startsWith("in ") ||
          (nextLabel.toLowerCase().startsWith("total") && nextLabel.includes("$"));
        if (i < lines.length && isTotalRow) {
          const totalValues = lines[i].slice(1, years.length + 1).map(parseNumber);
          sections.push({ title: sectionTitle, years, segments: [{ name: "Total", values: totalValues }] });
          i++;
          while (i < lines.length && lines[i].every(c => !c.trim())) i++;
          continue;
        }

        // Parse segment rows with potential sub-segments
        const section: ParsedSection = { title: sectionTitle, years, segments: [] };
        let currentParent: ParsedSection["segments"][0] | null = null;

        // Determine what constitutes a sub-segment based on section type
        const isEndUserSection = sectionTitle.toLowerCase().includes("end-user") || sectionTitle.toLowerCase().includes("end user");
        const isAircraftSection = sectionTitle.toLowerCase().includes("aircraft type");
        const isRegionSection = sectionTitle.toLowerCase().includes("region");
        const isApplicationSection = sectionTitle.toLowerCase().includes("application");
        const isEquipmentSection = sectionTitle.toLowerCase().includes("equipment");

        while (i < lines.length) {
          const segRow = lines[i];
          if (segRow.every(c => !c.trim())) { i++; break; }

          const segName = normalizeName(segRow[0]?.trim() ?? "");
          if (!segName) { i++; continue; }
          if (segName.startsWith("Total")) { i++; continue; }

          const segValues = segRow.slice(1, years.length + 1).map(parseNumber);

          // Determine if this is a sub-segment
          let isSubSegment = false;

          if (isEndUserSection && currentParent) {
            // In end-user section: aircraft names and region names are sub-segments
            if (aircraftNames.includes(segName) || regionNames.includes(segName)) {
              isSubSegment = true;
            }
          }

          if ((isAircraftSection || isApplicationSection || isEquipmentSection) && currentParent) {
            // Region names are sub-segments
            if (regionNames.includes(segName)) {
              isSubSegment = true;
            }
          }

          if (isRegionSection && currentParent) {
            // Country names are sub-segments
            if (countryNames.includes(segName)) {
              isSubSegment = true;
            }
          }

          if (isSubSegment && currentParent) {
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

function buildMarketData(sections: ParsedSection[]): MarketData {
  const findSection = (keywords: string[]) =>
    sections.find(s => keywords.some(k => s.title.toLowerCase().includes(k.toLowerCase())));

  const totalSection = findSection(["Aircraft Cabin Lining Market", "Aircraft Cabin"]);
  const endUserSections = sections.filter(s =>
    s.title.toLowerCase().includes("end-user") || s.title.toLowerCase().includes("end user"));
  // First end-user section has aircraft sub-segments, second has region sub-segments
  const endUserByAircraftSection = endUserSections[0];
  const endUserByRegionSection = endUserSections.length > 1 ? endUserSections[1] : undefined;
  const aircraftSection = findSection(["Aircraft Type"]);
  const regionSection = findSection(["By Region"]);
  const applicationSection = findSection(["Application Type"]);
  const equipmentSection = findSection(["Equipment Type"]);

  const years = totalSection?.years || aircraftSection?.years || [];

  const toSegmentData = (seg: { name: string; values: number[] }): SegmentData => ({
    name: seg.name,
    data: years.map((y, idx) => ({ year: y, value: seg.values[idx] ?? 0 })),
  });

  const toYearlyData = (values: number[]): YearlyData[] =>
    years.map((y, idx) => ({ year: y, value: values[idx] ?? 0 }));

  // Total market
  const totalMarketValues = totalSection?.segments[0]?.values || [];
  const totalMarket = toYearlyData(totalMarketValues);

  // End-User: OE and Aftermarket (top-level only)
  const endUser = (endUserByAircraftSection?.segments || []).map(toSegmentData);

  // Aircraft Type: top-level segments
  const aircraftType = (aircraftSection?.segments || []).map(toSegmentData);

  // Region: top-level segments
  const region = (regionSection?.segments || []).map(toSegmentData);

  // Application Type: top-level segments
  const application = (applicationSection?.segments || []).map(toSegmentData);

  // Equipment Type: top-level segments
  const furnishedEquipment = (equipmentSection?.segments || []).map(toSegmentData);

  // ── Cross-tabulations ───────────────────────────────────────

  // endUserByAircraftType: { "OE": [{name: "Narrow Body Aircraft", data: [...]}], ... }
  const endUserByAircraftType: Record<string, SegmentData[]> = {};
  for (const seg of endUserByAircraftSection?.segments || []) {
    if (seg.subSegments && seg.subSegments.length > 0) {
      endUserByAircraftType[seg.name] = seg.subSegments.map(sub => ({
        name: sub.name,
        data: toYearlyData(sub.values),
      }));
    }
  }

  // endUserByRegion: { "OE": [{name: "North America", data: [...]}], ... }
  const endUserByRegion: Record<string, SegmentData[]> = {};
  for (const seg of endUserByRegionSection?.segments || []) {
    if (seg.subSegments && seg.subSegments.length > 0) {
      endUserByRegion[seg.name] = seg.subSegments.map(sub => ({
        name: sub.name,
        data: toYearlyData(sub.values),
      }));
    }
  }

  // aircraftTypeByRegion: { "Narrow Body Aircraft": [{name: "North America", data: [...]}], ... }
  const aircraftTypeByRegion: Record<string, SegmentData[]> = {};
  for (const seg of aircraftSection?.segments || []) {
    if (seg.subSegments && seg.subSegments.length > 0) {
      aircraftTypeByRegion[seg.name] = seg.subSegments.map(sub => ({
        name: sub.name,
        data: toYearlyData(sub.values),
      }));
    }
  }

  // countryDataByRegion: { "North America": [{name: "USA", data: [...]}], ... }
  const countryDataByRegion: Record<string, SegmentData[]> = {};
  for (const seg of regionSection?.segments || []) {
    if (seg.subSegments && seg.subSegments.length > 0) {
      countryDataByRegion[seg.name] = seg.subSegments.map(sub => ({
        name: sub.name,
        data: toYearlyData(sub.values),
      }));
    }
  }

  // applicationByRegion: { "Sidewalls": [{name: "North America", data: [...]}], ... }
  const applicationByRegion: Record<string, SegmentData[]> = {};
  for (const seg of applicationSection?.segments || []) {
    if (seg.subSegments && seg.subSegments.length > 0) {
      applicationByRegion[seg.name] = seg.subSegments.map(sub => ({
        name: sub.name,
        data: toYearlyData(sub.values),
      }));
    }
  }

  // equipmentByRegion: { "BFE": [{name: "North America", data: [...]}], ... }
  const equipmentByRegion: Record<string, SegmentData[]> = {};
  for (const seg of equipmentSection?.segments || []) {
    if (seg.subSegments && seg.subSegments.length > 0) {
      equipmentByRegion[seg.name] = seg.subSegments.map(sub => ({
        name: sub.name,
        data: toYearlyData(sub.values),
      }));
    }
  }

  console.log("[Cabin Linings parser] Parsed:", {
    years: years.length,
    endUser: endUser.length,
    aircraftType: aircraftType.length,
    region: region.length,
    application: application.length,
    equipment: furnishedEquipment.length,
    countriesTotal: Object.values(countryDataByRegion).flat().length,
    endUserByAircraftTypeKeys: Object.keys(endUserByAircraftType),
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
