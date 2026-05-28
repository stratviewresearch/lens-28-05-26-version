/**
 * Types, data fetching hook, and utility hooks for Carbon Fiber Prepreg Market dashboard.
 * Fetches XLS from remote proxy and parses into DualMarketData (value + volume).
 *
 * Data segments:
 *   - End Use Industries: A&D, Wind Energy, Sporting Goods, Automotive, Civil Engineering, Marine, Others
 *     (each with region cross-tabs: NA, Europe, AP, RoW)
 *   - Resin Type: Thermoplastic, Thermoset (top-level)
 *     Thermoset Bifurcation: Epoxy, BMI, Cyanate Ester, Polyimide, Phenolic (each with region cross-tabs)
 *     Thermoplastic Bifurcation: PPS, PEEK, Others (each with region cross-tabs)
 *   - Prepreg Type: Unidirectional, Fabric (each with region cross-tabs)
 *   - Process Type: Autoclave, Out of Autoclave, Others (each with region cross-tabs)
 *   - Region: NA, Europe, AP, RoW (with country sub-breakdowns)
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
  region: SegmentData[];
  application: SegmentData[];        // Prepreg Type (Fabric, Unidirectional)
  furnishedEquipment: SegmentData[]; // unused
  processType: SegmentData[];
  materialType: SegmentData[];       // Resin Type top-level (Thermoplastic, Thermoset)
  aircraftType: SegmentData[];
  countryDataByRegion: Record<string, SegmentData[]>;
  endUserByRegion: Record<string, SegmentData[]>;
  endUserByAircraftType: Record<string, SegmentData[]>;
  aircraftTypeByRegion: Record<string, SegmentData[]>;
  applicationByRegion: Record<string, SegmentData[]>;
  equipmentByRegion: Record<string, SegmentData[]>;
  processTypeByRegion: Record<string, SegmentData[]>;
  materialTypeByRegion: Record<string, SegmentData[]>;
  thermosetSubResins: SegmentData[];
  thermoplasticSubResins: SegmentData[];
  thermosetByRegion: Record<string, SegmentData[]>;
  thermoplasticByRegion: Record<string, SegmentData[]>;
  resinTopByRegion: Record<string, SegmentData[]>;
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

// ── Known regions and countries ──────────────────────────────

const REGIONS = ["North America", "Europe", "Asia Pacific", "Rest of the World"];
const COUNTRY_MAP: Record<string, string[]> = {
  "North America": ["USA", "Canada", "Mexico"],
  "Europe": ["Germany", "France", "UK", "Russia", "Others"],
  "Asia Pacific": ["China", "Japan", "India", "Others"],
  "Rest of the World": ["Brazil", "Saudi Arabia", "Others"],
};

// ── Zero-data filter ─────────────────────────────────────────

function isNonZeroSegment(seg: SegmentData): boolean {
  return seg.data.some(d => d.value > 0);
}

function filterZeroSegments(segments: SegmentData[]): SegmentData[] {
  return segments.filter(isNonZeroSegment);
}

function filterZeroCrossTab(map: Record<string, SegmentData[]>): Record<string, SegmentData[]> {
  const filtered: Record<string, SegmentData[]> = {};
  for (const [key, segs] of Object.entries(map)) {
    const nonZero = filterZeroSegments(segs);
    if (nonZero.length > 0) filtered[key] = nonZero;
  }
  return filtered;
}

// ── Positional parser ────────────────────────────────────────

function buildMarketData(lines: string[][]): MarketData {
  const headerRow = lines[0] || [];
  const years: number[] = [];
  for (let c = 1; c < headerRow.length; c++) {
    const yr = parseInt(headerRow[c]);
    if (yr >= 2000 && yr <= 2100) years.push(yr);
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

  const findRow = (keyword: string, startFrom = 0): number => {
    for (let i = startFrom; i < lines.length; i++) {
      const label = (lines[i]?.[0] ?? "").trim().toLowerCase();
      if (label.includes(keyword.toLowerCase())) return i;
    }
    return -1;
  };

  // Row 1: total
  const totalMarket = toYearlyData(getValues(lines[1] || []));

  // ── Generic section parser with region cross-tabs ──────────
  function parseSegmentSection(startRow: number, stopKeyword = "Total"): {
    segments: SegmentData[];
    byRegion: Record<string, SegmentData[]>;
  } {
    const segments: SegmentData[] = [];
    const byRegion: Record<string, SegmentData[]> = {};
    let r = startRow;
    while (r < lines.length) {
      const label = (lines[r]?.[0] ?? "").trim();
      if (!label || label.startsWith(stopKeyword) || label.startsWith("Total")) break;
      if (REGIONS.includes(label)) { r++; continue; }

      const segName = label.replace(/\s*Prepreg\s*/g, " ").trim();
      const segValues = getValues(lines[r]);
      segments.push(toSegmentData(segName, segValues));

      const regionSegs: SegmentData[] = [];
      for (let ri = 1; ri <= 4; ri++) {
        const rLabel = (lines[r + ri]?.[0] ?? "").trim();
        if (REGIONS.includes(rLabel)) {
          regionSegs.push(toSegmentData(rLabel, getValues(lines[r + ri])));
        }
      }
      if (regionSegs.length > 0) {
        byRegion[segName] = regionSegs;
      }
      r += 1 + regionSegs.length;
    }
    return { segments, byRegion };
  }

  // ── End Use Industry ──────────────────────────────────────
  const endUseStartRow = findRow("End Use Industr");
  let endUser: SegmentData[] = [];
  let endUserByRegion: Record<string, SegmentData[]> = {};
  if (endUseStartRow >= 0) {
    const result = parseSegmentSection(endUseStartRow + 1);
    endUser = result.segments;
    endUserByRegion = result.byRegion;
  }

  // ── Resin Type (top-level) with region breakdown ──────────
  const resinStartRow = findRow("Resin Type", endUseStartRow + 1);
  let materialType: SegmentData[] = [];
  let resinTopByRegion: Record<string, SegmentData[]> = {};
  if (resinStartRow >= 0) {
    const result = parseSegmentSection(resinStartRow + 1);
    materialType = result.segments;
    resinTopByRegion = result.byRegion;
  }

  // ── Thermoset Bifurcation ─────────────────────────────────
  const thermosetBifRow = findRow("Thermoset Bifurcation", resinStartRow >= 0 ? resinStartRow + 1 : 0);
  let thermosetSubResins: SegmentData[] = [];
  let thermosetByRegion: Record<string, SegmentData[]> = {};
  if (thermosetBifRow >= 0) {
    const result = parseSegmentSection(thermosetBifRow + 1, "Total Thermoset");
    thermosetSubResins = result.segments;
    thermosetByRegion = result.byRegion;
  }

  // ── Thermoplastic Bifurcation ─────────────────────────────
  const thermoplasticBifRow = findRow("Thermoplastic Bifurcation", thermosetBifRow >= 0 ? thermosetBifRow + 1 : (resinStartRow >= 0 ? resinStartRow + 1 : 0));
  let thermoplasticSubResins: SegmentData[] = [];
  let thermoplasticByRegion: Record<string, SegmentData[]> = {};
  if (thermoplasticBifRow >= 0) {
    const result = parseSegmentSection(thermoplasticBifRow + 1, "Total Thermoplastic");
    thermoplasticSubResins = result.segments;
    thermoplasticByRegion = result.byRegion;
  }

  // Combined resin sub-type map for cross-tab display
  const materialTypeByRegion: Record<string, SegmentData[]> = {};
  if (thermosetSubResins.length > 0) {
    materialTypeByRegion["Thermoset"] = thermosetSubResins;
  }
  if (thermoplasticSubResins.length > 0) {
    materialTypeByRegion["Thermoplastic"] = thermoplasticSubResins;
  }

  // ── Process Type ──────────────────────────────────────────
  const processStartRow = findRow("Process Type", thermoplasticBifRow >= 0 ? thermoplasticBifRow + 1 : 0);
  let processType: SegmentData[] = [];
  let processTypeByRegion: Record<string, SegmentData[]> = {};
  if (processStartRow >= 0) {
    const result = parseSegmentSection(processStartRow + 1);
    processType = result.segments;
    processTypeByRegion = result.byRegion;
  }

  // ── Prepreg Type (Unidirectional, Fabric) ─────────────────
  // In this dataset the section header is "Global" rather than "Prepreg Type"
  let prepregTypeStartRow = findRow("Prepreg Type", processStartRow >= 0 ? processStartRow : 0);
  if (prepregTypeStartRow < 0) {
    prepregTypeStartRow = findRow("Global", processStartRow >= 0 ? processStartRow : 0);
  }
  let application: SegmentData[] = [];
  let applicationByRegion: Record<string, SegmentData[]> = {};
  if (prepregTypeStartRow >= 0) {
    const result = parseSegmentSection(prepregTypeStartRow + 1);
    application = result.segments;
    applicationByRegion = result.byRegion;
  }

  // ── Region with country breakdowns ────────────────────────
  const regionStartRow = findRow("By Region", prepregTypeStartRow >= 0 ? prepregTypeStartRow : 0);
  const region: SegmentData[] = [];
  const countryDataByRegion: Record<string, SegmentData[]> = {};

  if (regionStartRow >= 0) {
    let r = regionStartRow + 1;
    while (r < lines.length) {
      const label = (lines[r]?.[0] ?? "").trim();
      if (!label || label.startsWith("Total")) break;

      if (REGIONS.includes(label)) {
        const regName = label;
        region.push(toSegmentData(regName, getValues(lines[r])));

        const expectedCountries = COUNTRY_MAP[regName] || [];
        const countrySegs: SegmentData[] = [];
        let ci = r + 1;
        while (ci < lines.length && countrySegs.length < expectedCountries.length) {
          const cLabel = (lines[ci]?.[0] ?? "").trim();
          if (!cLabel || REGIONS.includes(cLabel) || cLabel.startsWith("Total")) break;
          countrySegs.push(toSegmentData(cLabel, getValues(lines[ci])));
          ci++;
        }
        if (countrySegs.length > 0) {
          countryDataByRegion[regName] = countrySegs;
        }
        r = ci;
      } else {
        r++;
      }
    }
  }

  console.log("[Carbon Fiber Prepreg parser] Parsed:", {
    years: years.length,
    endUse: endUser.map(s => s.name),
    resinType: materialType.map(s => s.name),
    thermosetSubs: thermosetSubResins.map(s => s.name),
    thermoplasticSubs: thermoplasticSubResins.map(s => s.name),
    prepregType: application.map(s => s.name),
    processType: processType.map(s => s.name),
    region: region.map(s => s.name),
    countries: Object.keys(countryDataByRegion),
  });

  return {
    years,
    totalMarket,
    endUser: filterZeroSegments(endUser),
    aircraftType: [],
    region: filterZeroSegments(region),
    application: filterZeroSegments(application),
    furnishedEquipment: [],
    processType: filterZeroSegments(processType),
    materialType: filterZeroSegments(materialType),
    countryDataByRegion: filterZeroCrossTab(countryDataByRegion),
    endUserByAircraftType: {},
    endUserByRegion: filterZeroCrossTab(endUserByRegion),
    aircraftTypeByRegion: {},
    applicationByRegion: filterZeroCrossTab(applicationByRegion),
    equipmentByRegion: {},
    processTypeByRegion: filterZeroCrossTab(processTypeByRegion),
    materialTypeByRegion: filterZeroCrossTab(materialTypeByRegion),
    thermosetSubResins: filterZeroSegments(thermosetSubResins),
    thermoplasticSubResins: filterZeroSegments(thermoplasticSubResins),
    thermosetByRegion: filterZeroCrossTab(thermosetByRegion),
    thermoplasticByRegion: filterZeroCrossTab(thermoplasticByRegion),
    resinTopByRegion: filterZeroCrossTab(resinTopByRegion),
  };
}

// ── XLS/XLSX Workbook Parsing ─────────────────────────────────

function parseWorkbook(buffer: ArrayBuffer): DualMarketData {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetNames = workbook.SheetNames;

  console.log("[Carbon Fiber Prepreg parser] Sheets found:", sheetNames);

  const valueSheet = workbook.Sheets[sheetNames[0]];
  const valueLines = sheetToLines(valueSheet);
  const valueData = buildMarketData(valueLines);

  let volumeData: MarketData;
  if (sheetNames.length >= 2) {
    const volumeSheet = workbook.Sheets[sheetNames[1]];
    const volumeLines = sheetToLines(volumeSheet);
    volumeData = buildMarketData(volumeLines);
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
  const data = buildMarketData(lines);
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

export function useChartDownload() {
  const downloadChart = useCallback(async (
    chartRef: React.RefObject<HTMLDivElement>,
    fileNamePrefix: string,
    headerTitle?: string,
  ) => {
    if (!chartRef.current) return;
    const node = chartRef.current;

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "width:1920px;background:hsl(220,15%,5%);position:fixed;left:-9999px;top:0;z-index:-1;padding:0";

    const header = document.createElement("div");
    header.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:24px 40px;border-bottom:1px solid hsl(220,10%,17%)";
    const logo = document.createElement("img");
    logo.src = stratviewLogoWhite;
    logo.style.cssText = "height:48px;width:auto";
    header.appendChild(logo);
    if (headerTitle) {
      const titleEl = document.createElement("div");
      titleEl.textContent = headerTitle;
      titleEl.style.cssText = "color:hsl(210,25%,93%);font-size:20px;font-weight:700;font-family:Poppins,system-ui,sans-serif";
      header.appendChild(titleEl);
    }
    wrapper.appendChild(header);

    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.cssText = "padding:32px 40px";
    clone.querySelectorAll("[data-download-exclude]").forEach(el => el.remove());
    wrapper.appendChild(clone);

    const footer = document.createElement("div");
    footer.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:16px 40px;border-top:1px solid hsl(220,10%,17%);color:hsl(215,12%,55%);font-size:12px;font-family:Poppins,system-ui,sans-serif";
    footer.innerHTML = `<span>© ${new Date().getFullYear()} Stratview Research. All rights reserved.</span><span>www.stratviewresearch.com</span>`;
    wrapper.appendChild(footer);

    document.body.appendChild(wrapper);
    try {
      const dataUrl = await toPng(wrapper, { width: 1920, height: wrapper.offsetHeight, pixelRatio: 1, cacheBust: true, backgroundColor: "hsl(220,15%,5%)" });
      const link = document.createElement("a");
      link.download = `${fileNamePrefix}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } finally {
      document.body.removeChild(wrapper);
    }
  }, []);

  return { downloadChart };
}
