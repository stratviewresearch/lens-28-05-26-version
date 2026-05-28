/**
 * Types, data fetching hook, and utility hooks for Traffic Marking Solutions dashboard.
 * Fetches XLS/XLSX from remote proxy and parses into MarketData.
 *
 * Source schema:
 *   - Overall market totals 2020–2031
 *   - By Product Type: Paint, Thermoplastic, 2-Component, Tape, Marker (each × Region)
 *   - By Region: NA (USA, Canada, Mexico), Europe (Germany, France, The UK, Italy, Russia, Rest of Europe),
 *     Asia-Pacific (India, China, Japan, Australia, RoAP), RoW (Brazil, South Africa, Others)
 *   - By Application Type: Roads & Highways, Airport Marking, Parking Lot, Others (each × Region)
 *   - Company Share (2025 only): PPG, SWARCO, Geveko, 3M, Others
 */

import { useState, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import * as XLSX from "xlsx";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";

// ── Types ─────────────────────────────────────────────────────

export interface YearlyData { year: number; value: number; }
export interface SegmentData { name: string; data: YearlyData[]; }
export interface ShareEntry { name: string; share: number; }

export interface MarketData {
  years: number[];
  totalMarket: YearlyData[];
  productType: SegmentData[];
  region: SegmentData[];
  application: SegmentData[];
  countryDataByRegion: Record<string, SegmentData[]>;
  productByRegion: Record<string, SegmentData[]>;
  applicationByRegion: Record<string, SegmentData[]>;
  companyShare: ShareEntry[];
  companyShareYear: number;
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// ── Parsing helpers ───────────────────────────────────────────

function parseNumber(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/[,$"%]/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
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

// ── Known regions / countries ────────────────────────────────

const REGIONS = ["North America", "Europe", "Asia-Pacific", "Asia Pacific", "RoW", "Rest of the World"];
const COUNTRY_MAP: Record<string, string[]> = {
  "North America": ["USA", "Canada", "Mexico"],
  "Europe": ["Germany", "France", "The UK", "UK", "Italy", "Russia", "Rest of Europe"],
  "Asia-Pacific": ["India", "China", "Japan", "Australia", "RoAP", "Rest of Asia Pacific"],
  "RoW": ["Brazil", "South Africa", "Others"],
};

function isRegion(name: string): boolean {
  return REGIONS.some(r => name.trim().toLowerCase() === r.toLowerCase());
}

// ── Builder ───────────────────────────────────────────────────

function buildMarketData(lines: string[][]): MarketData {
  // Locate header row (contains years)
  const findHeaderRow = (startFrom = 0): number => {
    for (let i = startFrom; i < lines.length; i++) {
      const row = lines[i];
      if (!row) continue;
      const yrs = row.slice(1).map(parseNumber).filter(n => n >= 2000 && n <= 2100);
      if (yrs.length >= 5) return i;
    }
    return -1;
  };

  const firstHeaderRow = findHeaderRow(0);
  if (firstHeaderRow < 0) {
    return {
      years: [], totalMarket: [], productType: [], region: [], application: [],
      countryDataByRegion: {}, productByRegion: {}, applicationByRegion: {},
      companyShare: [], companyShareYear: 0,
    };
  }
  const headerRow = lines[firstHeaderRow];
  const years: number[] = [];
  for (let c = 1; c < headerRow.length; c++) {
    const yr = parseNumber(headerRow[c]);
    if (yr >= 2000 && yr <= 2100) years.push(yr);
    else break;
  }
  const nYears = years.length;

  const toYearlyData = (values: number[]): YearlyData[] =>
    years.map((y, idx) => ({ year: y, value: values[idx] ?? 0 }));

  const toSegmentData = (name: string, values: number[]): SegmentData => ({
    name: name.trim(),
    data: toYearlyData(values),
  });

  const getValues = (row: string[]): number[] =>
    row.slice(1, nYears + 1).map(parseNumber);

  // Row right after first header is the total
  const totalMarket = toYearlyData(getValues(lines[firstHeaderRow + 1] || []));

  // ── Locate section headers (rows whose first cell contains the section title and the rest are years) ──
  const findSectionRow = (keyword: string, startFrom = 0): number => {
    for (let i = startFrom; i < lines.length; i++) {
      const label = (lines[i]?.[0] ?? "").trim().toLowerCase();
      if (label.includes(keyword.toLowerCase())) {
        // Confirm it's a section header (years follow)
        const yrs = lines[i].slice(1).map(parseNumber).filter(n => n >= 2000 && n <= 2100);
        if (yrs.length >= 5) return i;
      }
    }
    return -1;
  };

  // Generic section parser: top segments with region children.
  function parseSegmentSection(startRow: number): {
    segments: SegmentData[];
    byRegion: Record<string, SegmentData[]>;
    endRow: number;
  } {
    const segments: SegmentData[] = [];
    const byRegion: Record<string, SegmentData[]> = {};
    let r = startRow;
    let currentParent: string | null = null;

    while (r < lines.length) {
      const label = (lines[r]?.[0] ?? "").trim();
      if (!label) { r++; if (lines[r]?.[0]?.trim().startsWith("By ") || (lines[r]?.[0] ?? "").includes("Share Analysis")) break; continue; }
      if (label.toLowerCase().startsWith("total")) { r++; break; }
      // Stop if we hit the next section header (years in row)
      const yrs = lines[r].slice(1).map(parseNumber).filter(n => n >= 2000 && n <= 2100);
      const isHeader = yrs.length >= 5 && r !== startRow && segments.length > 0;
      if (isHeader) break;

      if (isRegion(label)) {
        if (currentParent) {
          (byRegion[currentParent] ||= []).push(toSegmentData(label, getValues(lines[r])));
        }
      } else {
        // New top-level segment
        currentParent = label;
        segments.push(toSegmentData(label, getValues(lines[r])));
      }
      r++;
    }
    return { segments, byRegion, endRow: r };
  }

  // ── By Product Type ──
  const productRow = findSectionRow("By Product Type", firstHeaderRow + 1);
  let productType: SegmentData[] = [];
  let productByRegion: Record<string, SegmentData[]> = {};
  if (productRow >= 0) {
    const result = parseSegmentSection(productRow + 1);
    productType = result.segments;
    productByRegion = result.byRegion;
  }

  // ── By Region (with country children) ──
  const regionRow = findSectionRow("By Region", productRow >= 0 ? productRow + 1 : firstHeaderRow + 1);
  const region: SegmentData[] = [];
  const countryDataByRegion: Record<string, SegmentData[]> = {};
  if (regionRow >= 0) {
    let r = regionRow + 1;
    let currentRegion: string | null = null;
    while (r < lines.length) {
      const label = (lines[r]?.[0] ?? "").trim();
      if (!label) { r++; continue; }
      if (label.toLowerCase().startsWith("total")) { r++; break; }
      const yrs = lines[r].slice(1).map(parseNumber).filter(n => n >= 2000 && n <= 2100);
      if (yrs.length >= 5 && region.length > 0) break; // next section

      if (isRegion(label)) {
        currentRegion = label;
        region.push(toSegmentData(label, getValues(lines[r])));
      } else if (currentRegion) {
        (countryDataByRegion[currentRegion] ||= []).push(toSegmentData(label, getValues(lines[r])));
      }
      r++;
    }
  }

  // ── By Application Type ──
  const appRow = findSectionRow("By Application", regionRow >= 0 ? regionRow + 1 : firstHeaderRow + 1);
  let application: SegmentData[] = [];
  let applicationByRegion: Record<string, SegmentData[]> = {};
  if (appRow >= 0) {
    const result = parseSegmentSection(appRow + 1);
    application = result.segments;
    applicationByRegion = result.byRegion;
  }

  // ── Company Share Analysis ──
  const companyShare: ShareEntry[] = [];
  let companyShareYear = 0;
  for (let i = 0; i < lines.length; i++) {
    const label = (lines[i]?.[0] ?? "").trim();
    if (label.toLowerCase().includes("share analysis")) {
      // Extract year (e.g., "2025")
      const yrMatch = label.match(/(20\d{2})/);
      if (yrMatch) companyShareYear = parseInt(yrMatch[1]);
      // Skip "Company | Market Share..." header row, then read company rows until blank/Total
      let r = i + 2;
      while (r < lines.length) {
        const name = (lines[r]?.[0] ?? "").trim();
        if (!name || name.toLowerCase().startsWith("total")) break;
        const shareRaw = lines[r]?.[1] ?? "";
        const num = parseNumber(shareRaw);
        // If value is 0..1, treat as fraction; else as %
        const sharePct = num <= 1 ? num * 100 : num;
        companyShare.push({ name, share: sharePct });
        r++;
      }
      break;
    }
  }

  console.log("[Traffic Marking parser] Parsed:", {
    years: years.length,
    productType: productType.map(s => s.name),
    region: region.map(s => s.name),
    application: application.map(s => s.name),
    productByRegion: Object.keys(productByRegion),
    applicationByRegion: Object.keys(applicationByRegion),
    countryDataByRegion: Object.keys(countryDataByRegion),
    companyShare: companyShare.map(c => `${c.name}: ${c.share.toFixed(1)}%`),
  });

  return {
    years,
    totalMarket,
    productType,
    region,
    application,
    countryDataByRegion,
    productByRegion,
    applicationByRegion,
    companyShare,
    companyShareYear,
  };
}

// ── Workbook / CSV parsing ────────────────────────────────────

function parseWorkbook(buffer: ArrayBuffer): MarketData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const lines = sheetToLines(sheet);
  return buildMarketData(lines);
}

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

function parseCSVFallback(text: string): MarketData {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map(parseCSVLine);
  return buildMarketData(lines);
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
      const buffer = await response.arrayBuffer();
      const firstBytes = new Uint8Array(buffer.slice(0, 8));
      const isXLS = (firstBytes[0] === 0xD0 && firstBytes[1] === 0xCF) ||
                    (firstBytes[0] === 0x50 && firstBytes[1] === 0x4B);

      if (isXLS) {
        setData(parseWorkbook(buffer));
      } else {
        const text = new TextDecoder().decode(buffer);
        setData(parseCSVFallback(text));
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
