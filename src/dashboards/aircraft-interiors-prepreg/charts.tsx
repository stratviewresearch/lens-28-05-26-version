/**
 * All chart components: MarketOverviewChart, MarketTrendChart, SegmentPieChart,
 * DistributionDonutsRow, DrillDownModal, StackedBarChart, ComparisonTable.
 * Self-contained — only imports from local data.ts, ui-helpers.tsx, and recharts.
 */

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { TrendingUp, X, MousePointer2, ArrowRight } from "lucide-react";
import {
  ComposedChart, Line, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Sector,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { YearlyData, SegmentData } from "./data";
import { calculateCAGR, useChartDownload } from "./data";
import { ChartDownloadButton, ChartTableViewToggle, DataTable, AnimatedViewSwitch } from "./ui-helpers";
import { config, type TabType } from "./config";

// ── Shared Colors ─────────────────────────────────────────────

export const CHART_COLORS = [
  "hsl(192, 95%, 55%)", "hsl(38, 92%, 55%)", "hsl(262, 83%, 58%)",
  "hsl(142, 71%, 45%)", "hsl(346, 77%, 50%)", "hsl(199, 89%, 48%)",
  "hsl(280, 65%, 60%)", "hsl(60, 70%, 50%)", "hsl(15, 85%, 55%)", "hsl(320, 70%, 50%)",
];

// ── Unit-aware formatting helper ──────────────────────────────
const fmtVal = (v: number, isVol: boolean) => { const n = v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); return isVol ? `${n} M Lbs` : `$${n}M`; };
const fmtAxis = (v: number, isVol: boolean, useM: boolean) => isVol ? (useM ? `${Math.round(v)} M Lbs` : `${(v / 1000).toFixed(1)}B Lbs`) : (useM ? `$${Math.round(v)}M` : `$${(v / 1000).toFixed(1)}B`);
const unitLabel = (isVol: boolean) => isVol ? "Million Lbs" : "US$ M";

// ── MarketOverviewChart ───────────────────────────────────────

interface MarketOverviewChartProps {
  data: YearlyData[];
  title: string;
  subtitle?: string;
  useMillions?: boolean;
  isVolume?: boolean;
}

export function MarketOverviewChart({ data, title, subtitle, useMillions = false, isVolume = false }: MarketOverviewChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { downloadChart } = useChartDownload();
  const [view, setView] = useState<"chart" | "table">("chart");

  const chartData = data.map((d, index) => {
    const previousValue = index > 0 ? data[index - 1].value : null;
    const yoyGrowth = previousValue !== null ? ((d.value - previousValue) / previousValue) * 100 : null;
    return { year: d.year, value: d.value, yoyGrowth };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const marketSize = payload.find((p: any) => p.dataKey === "value");
      const yoyGrowth = payload.find((p: any) => p.dataKey === "yoyGrowth");
      return (
        <div className="rounded-lg border border-border bg-popover p-4 shadow-lg">
          <p className="mb-2 font-semibold text-foreground">{label}</p>
          {marketSize && (
            <div className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(192, 95%, 55%)" }} />
              <span className="text-muted-foreground">Market Size:</span>
              <span className="font-mono font-medium text-foreground">{fmtVal(marketSize.value, isVolume)}</span>
            </div>
          )}
          {yoyGrowth && yoyGrowth.value !== null && (
            <div className="flex items-center gap-2 text-sm mt-1">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "hsl(38, 92%, 55%)" }} />
              <span className="text-muted-foreground">YoY Growth:</span>
              <span className={`font-mono font-medium ${yoyGrowth.value >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                {yoyGrowth.value >= 0 ? "+" : ""}{yoyGrowth.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => (
    <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-3 sm:gap-6">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0" style={{ backgroundColor: "hsl(192, 95%, 55%)" }} />
        <span className="text-xs sm:text-sm text-muted-foreground">Market Size ({unitLabel(isVolume)})</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0" style={{ backgroundColor: "hsl(38, 92%, 55%)" }} />
        <span className="text-xs sm:text-sm text-muted-foreground">YoY Growth (%)</span>
      </div>
    </div>
  );

  const tableHeaders = ["Year", `Market Size (${unitLabel(isVolume)})`, "YoY Growth (%)"];
  const tableRows = chartData.map((d) => [
    d.year, fmtVal(d.value, isVolume),
    d.yoyGrowth !== null ? `${d.yoyGrowth >= 0 ? "+" : ""}${d.yoyGrowth.toFixed(1)}%` : "—",
  ]);

  return (
    <motion.div ref={chartRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-xl border border-border bg-card p-3 sm:p-6 h-full flex flex-col">
      <div className="mb-4 sm:mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          <ChartTableViewToggle view={view} onViewChange={setView} />
          <ChartDownloadButton onClick={() => downloadChart(chartRef, `market-overview-chart`, `${config.title} — ${title}`)} />
        </div>
      </div>
      <AnimatedViewSwitch view={view}
        chart={
          <div className="h-[300px] sm:h-[350px] w-full -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="aip-gradient-market-size" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(192, 95%, 55%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(192, 95%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
                <XAxis dataKey="year" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} interval={Math.ceil(data.length / 8)} />
                <YAxis yAxisId="left" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} tickFormatter={(value) => fmtAxis(value, isVolume, useMillions)} width={70} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} tickFormatter={(value) => `${value.toFixed(0)}%`} domain={['auto', 'auto']} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={renderLegend} />
                <Line yAxisId="left" type="monotone" dataKey="value" stroke="hsl(192, 95%, 55%)" strokeWidth={3} dot={{ fill: "hsl(192, 95%, 55%)", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Market Size" />
                <Line yAxisId="right" type="monotone" dataKey="yoyGrowth" stroke="hsl(38, 92%, 55%)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: "hsl(38, 92%, 55%)", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, strokeWidth: 0 }} name="YoY Growth" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        }
        table={<DataTable headers={tableHeaders} rows={tableRows} />}
      />
    </motion.div>
  );
}

// ── MarketTrendChart ──────────────────────────────────────────

interface MarketTrendChartProps {
  data: YearlyData[];
  segments?: SegmentData[];
  title: string;
  subtitle?: string;
  showSegments?: boolean;
  onSegmentClick?: (segmentName: string, segmentData: YearlyData[], color: string) => void;
  useMillions?: boolean;
  isVolume?: boolean;
}

export function MarketTrendChart({ data, segments, title, subtitle, showSegments = false, onSegmentClick, useMillions = false, isVolume = false }: MarketTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { downloadChart } = useChartDownload();
  const [view, setView] = useState<"chart" | "table">("chart");

  const chartData = data.map((d) => {
    const point: Record<string, number> = { year: d.year, total: d.value };
    if (showSegments && segments) {
      segments.forEach((seg) => { point[seg.name] = seg.data.find((s) => s.year === d.year)?.value ?? 0; });
    }
    return point;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="rounded-lg border border-border bg-popover p-4 shadow-lg">
          <p className="mb-2 font-semibold text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-mono font-medium text-foreground">{fmtVal(entry.value, isVolume)}</span>
            </div>
          ))}
          {payload.length > 1 && (
            <div className="mt-2 border-t border-border pt-2 flex items-center gap-2 text-sm">
              <div className="h-3 w-3 rounded-full bg-foreground/50" />
              <span className="text-muted-foreground font-medium">Total:</span>
              <span className="font-mono font-bold text-foreground">{fmtVal(total, isVolume)}</span>
            </div>
          )}
          {showSegments && segments && (
            <p className="mt-2 text-xs text-primary flex items-center gap-1"><MousePointer2 className="h-3 w-3" /> Click legend to drill down</p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleLegendClick = (entry: any) => {
    if (!onSegmentClick || !segments) return;
    const segment = segments.find((s) => s.name === entry.value);
    if (segment) {
      const colorIndex = segments.indexOf(segment);
      onSegmentClick(segment.name, segment.data, CHART_COLORS[colorIndex % CHART_COLORS.length]);
    }
  };

  const renderLegend = (props: any) => (
    <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-x-2 gap-y-1 sm:gap-4">
      {props.payload.map((entry: any, index: number) => (
        <div key={index} className="flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-md px-1.5 sm:px-2 py-0.5 sm:py-1 transition-colors hover:bg-secondary/50" onClick={() => handleLegendClick(entry)}>
          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-xs sm:text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );

  const tableHeaders = showSegments && segments ? ["Year", ...segments.map((s) => s.name), "Total"] : ["Year", `Market Size (${unitLabel(isVolume)})`];
  const tableRows = chartData.map((d) => {
    if (showSegments && segments) return [d.year, ...segments.map((s) => fmtVal(d[s.name] ?? 0, isVolume)), fmtVal(d.total, isVolume)];
    return [d.year, fmtVal(d.total, isVolume)];
  });

  return (
    <motion.div ref={chartRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-xl border border-border bg-card p-3 sm:p-6 h-full flex flex-col">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          <ChartTableViewToggle view={view} onViewChange={setView} />
          <ChartDownloadButton onClick={() => downloadChart(chartRef, `market-trend-${title.toLowerCase().replace(/\s+/g, "-")}`, `${config.title} — ${title}`)} />
        </div>
      </div>
      <AnimatedViewSwitch view={view}
        chart={
          <>
            <div className="h-[300px] sm:h-[350px] w-full -mx-2 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                  <defs>
                    {showSegments && segments ? segments.map((seg, idx) => (
                      <linearGradient key={seg.name} id={`aip-gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    )) : (
                      <linearGradient id="aip-gradient-total" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(192, 95%, 55%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(192, 95%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    )}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
                  <XAxis dataKey="year" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} interval={Math.ceil(data.length / 8)} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} tickFormatter={(value) => fmtAxis(value, isVolume, useMillions)} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  {showSegments && segments ? (
                    <>
                      <Legend content={renderLegend} />
                      {segments.map((seg, idx) => (
                        <Area key={seg.name} type="monotone" dataKey={seg.name} stroke={CHART_COLORS[idx % CHART_COLORS.length]} fill={`url(#aip-gradient-${idx})`} strokeWidth={2} style={{ cursor: "pointer" }} />
                      ))}
                    </>
                  ) : (
                    <Area type="monotone" dataKey="total" stroke="hsl(192, 95%, 55%)" fill="url(#aip-gradient-total)" strokeWidth={2} name="Market Size" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {showSegments && segments && (
              <p className="mt-2 text-center text-xs text-muted-foreground">Click any legend item to see detailed analysis</p>
            )}
          </>
        }
        table={<DataTable headers={tableHeaders} rows={tableRows} />}
      />
    </motion.div>
  );
}

// ── SegmentPieChart ───────────────────────────────────────────

interface SegmentPieChartProps {
  data: SegmentData[];
  year: number;
  title: string;
  onSegmentClick?: (segmentName: string, segmentData: YearlyData[], color: string) => void;
  isVolume?: boolean;
}

const renderActivePieShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g><Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} style={{ filter: "drop-shadow(0 0 8px rgba(0,0,0,0.3))", cursor: "pointer" }} /></g>
  );
};

export function SegmentPieChart({ data, year, title, onSegmentClick, isVolume = false }: SegmentPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const { downloadChart } = useChartDownload();
  const [view, setView] = useState<"chart" | "table">("chart");

  const pieData = data.map((segment, index) => ({
    name: segment.name,
    value: segment.data.find((d) => d.year === year)?.value ?? 0,
    fullData: segment.data,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0];
      const percentage = ((d.value / total) * 100).toFixed(1);
      return (
        <div className="rounded-lg border border-border bg-popover p-4 shadow-lg">
          <p className="font-semibold text-foreground">{d.name}</p>
          <div className="mt-1 space-y-1 text-sm">
            <p className="text-muted-foreground">Value: <span className="font-mono font-medium text-foreground">{fmtVal(d.value, isVolume)}</span></p>
            <p className="text-muted-foreground">Share: <span className="font-mono font-medium text-foreground">{percentage}%</span></p>
          </div>
          <p className="mt-2 text-xs text-primary flex items-center gap-1"><MousePointer2 className="h-3 w-3" /> Click to drill down</p>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (_data: any, index: number) => {
    if (onSegmentClick) {
      const segment = pieData[index];
      onSegmentClick(segment.name, segment.fullData, segment.color);
    }
  };

  const tableHeaders = ["Segment", `${unitLabel(isVolume)} (${year})`, "Share (%)"];
  const tableRows = pieData.map((entry) => [entry.name, fmtVal(entry.value, isVolume), `${((entry.value / total) * 100).toFixed(1)}%`]);

  return (
    <motion.div ref={chartRef} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="rounded-xl border border-border bg-card p-3 sm:p-6 h-full flex flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{year} Distribution</p>
        </div>
        <div className="flex items-center gap-1">
          <ChartTableViewToggle view={view} onViewChange={setView} />
          <ChartDownloadButton onClick={() => downloadChart(chartRef, `${title.toLowerCase().replace(/\s+/g, "-")}-${year}`, `${config.title} — ${title} (${year})`)} />
        </div>
      </div>
      <AnimatedViewSwitch view={view}
        chart={
          <>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={85} paddingAngle={2} dataKey="value" stroke="hsl(222, 47%, 6%)" strokeWidth={2}
                    activeIndex={activeIndex ?? undefined} activeShape={renderActivePieShape}
                    onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}
                    onClick={handlePieClick} style={{ cursor: "pointer" }}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {pieData.map((entry, index) => (
                <div key={index} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-secondary/50" onClick={() => handlePieClick(entry, index)}>
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Click any segment to see detailed trends</p>
          </>
        }
        table={<DataTable headers={tableHeaders} rows={tableRows} />}
      />
    </motion.div>
  );
}

// ── DistributionDonutsRow ─────────────────────────────────────

interface MiniDonutProps {
  data: SegmentData[];
  year: number;
  title: string;
  tabType: TabType;
  onClick?: (tabType: TabType) => void;
  onSliceClick?: (segmentName: string, segmentData: YearlyData[], color: string, donutType: TabType) => void;
  delay: number;
  isVolume?: boolean;
}

const renderActiveDonutShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g><Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} style={{ filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))", cursor: "pointer" }} /></g>
  );
};

function MiniDonut({ data, year, title, tabType, onClick, onSliceClick, delay, isVolume = false }: MiniDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const pieData = data.map((segment, index) => ({
    name: segment.name,
    value: segment.data.find((d) => d.year === year)?.value ?? 0,
    color: CHART_COLORS[index % CHART_COLORS.length],
    fullData: segment.data,
  }));
  const total = pieData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="rounded-lg border border-border bg-popover p-2 shadow-lg text-xs">
          <p className="font-semibold text-foreground">{item.name}</p>
          <p className="text-muted-foreground">{fmtVal(item.value, isVolume)} ({percentage}%)</p>
          <p className="text-primary text-[10px] mt-1">Click to drill down</p>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (_data: any, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const segment = pieData[index];
    if (segment && onSliceClick) onSliceClick(segment.name, segment.fullData, segment.color, tabType);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay }} onClick={() => onClick?.(tabType)} className="rounded-xl border border-border bg-card p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg">
      <h4 className="text-sm font-medium text-foreground text-center mb-2">{title}</h4>
      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="hsl(222, 47%, 6%)" strokeWidth={1}
              activeIndex={activeIndex} activeShape={renderActiveDonutShape}
              onMouseEnter={(_, index) => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(undefined)}
              onClick={handlePieClick} style={{ cursor: "pointer" }}>
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-1 mt-2">
        {pieData.slice(0, 3).map((entry, index) => (
          <div key={index} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[10px] text-muted-foreground truncate max-w-[50px]">{entry.name}</span>
          </div>
        ))}
        {pieData.length > 3 && <span className="text-[10px] text-muted-foreground">+{pieData.length - 3}</span>}
      </div>
    </motion.div>
  );
}

interface DistributionDonutsRowProps {
  panelTypeData: SegmentData[];
  regionData: SegmentData[];
  fiberTypeData: SegmentData[];
  resinTypeData: SegmentData[];
  formTypeData: SegmentData[];
  oemData: SegmentData[];
  salesChannelData: SegmentData[];
  year: number;
  onDonutClick?: (tabType: TabType) => void;
  onSliceClick?: (segmentName: string, segmentData: YearlyData[], color: string, donutType: TabType) => void;
  panelTypeLabel?: string;
  fiberTypeLabel?: string;
  resinTypeLabel?: string;
  formTypeLabel?: string;
  oemLabel?: string;
  salesChannelLabel?: string;
  isVolume?: boolean;
}

export function DistributionDonutsRow({ panelTypeData, regionData, fiberTypeData, resinTypeData, formTypeData, oemData, salesChannelData, year, onDonutClick, onSliceClick, panelTypeLabel = "Panel Type", fiberTypeLabel = "Fiber Type", resinTypeLabel = "Resin Type", formTypeLabel = "Form Type", oemLabel = "OEM", salesChannelLabel = "Sales Channel", isVolume = false }: DistributionDonutsRowProps) {
  const hasPanelType = panelTypeData && panelTypeData.length > 0;
  const hasFiberType = fiberTypeData && fiberTypeData.length > 0;
  const hasResinType = resinTypeData && resinTypeData.length > 0;
  const hasFormType = formTypeData && formTypeData.length > 0;
  const hasOem = oemData && oemData.length > 0;
  const hasSalesChannel = salesChannelData && salesChannelData.length > 0;

  const donutCount = (hasPanelType ? 1 : 0) + (hasResinType ? 1 : 0) + (hasFiberType ? 1 : 0) + (hasFormType ? 1 : 0) + 1 + (hasOem ? 1 : 0) + (hasSalesChannel ? 1 : 0);
  const gridCols = donutCount >= 7 ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" : donutCount >= 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {hasPanelType && <MiniDonut data={panelTypeData} year={year} title={panelTypeLabel} tabType="panelType" onClick={onDonutClick} onSliceClick={onSliceClick} delay={0.1} isVolume={isVolume} />}
      {hasResinType && <MiniDonut data={resinTypeData} year={year} title={resinTypeLabel} tabType="resinType" onClick={onDonutClick} onSliceClick={onSliceClick} delay={0.15} isVolume={isVolume} />}
      {hasFiberType && <MiniDonut data={fiberTypeData} year={year} title={fiberTypeLabel} tabType="fiberType" onClick={onDonutClick} onSliceClick={onSliceClick} delay={0.2} isVolume={isVolume} />}
      {hasFormType && <MiniDonut data={formTypeData} year={year} title={formTypeLabel} tabType="formType" onClick={onDonutClick} onSliceClick={onSliceClick} delay={0.25} isVolume={isVolume} />}
      <MiniDonut data={regionData} year={year} title="Region" tabType="region" onClick={onDonutClick} onSliceClick={onSliceClick} delay={0.3} isVolume={isVolume} />
      {hasOem && <MiniDonut data={oemData} year={year} title={oemLabel} tabType="oem" onClick={onDonutClick} onSliceClick={onSliceClick} delay={0.35} isVolume={isVolume} />}
      {hasSalesChannel && <MiniDonut data={salesChannelData} year={year} title={salesChannelLabel} tabType="salesChannel" onClick={onDonutClick} onSliceClick={onSliceClick} delay={0.4} isVolume={isVolume} />}
    </div>
  );
}

// ── DrillDownModal ────────────────────────────────────────────

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentName: string;
  segmentData: YearlyData[];
  color: string;
  useMillions?: boolean;
  isVolume?: boolean;
}

export function DrillDownModal({ isOpen, onClose, segmentName, segmentData, color, useMillions = false, isVolume = false }: DrillDownModalProps) {
  const trendChartRef = useRef<HTMLDivElement>(null);
  const { downloadChart } = useChartDownload();
  const gradientId = `aip-drillGradient-${segmentName.replace(/[^a-zA-Z0-9]/g, "-")}`;

  const currentRunningYear = new Date().getFullYear();
  const allYears = segmentData?.map(d => d.year) ?? [];
  const lastYear = allYears[allYears.length - 1] ?? 0;
  const cagrStartYear = allYears.includes(currentRunningYear) ? currentRunningYear : (allYears[0] ?? 0);
  const currentValue = segmentData?.find(d => d.year === cagrStartYear)?.value ?? 0;
  const forecastValue = segmentData?.[segmentData.length - 1]?.value ?? 0;
  const cagr = calculateCAGR(currentValue, forecastValue, lastYear - cagrStartYear);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-popover p-3 shadow-lg">
          <p className="mb-1 font-semibold text-foreground">{payload[0].payload?.year}</p>
          <p className="text-sm text-muted-foreground">Value: <span className="font-mono font-medium text-foreground">{fmtVal(payload[0].value, isVolume)}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="composites-carbon-theme max-w-4xl w-[95vw] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-[hsl(222,47%,9%)] border-[hsl(217,33%,18%)] text-[hsl(210,40%,96%)] top-[50%] left-[50%] p-4 sm:p-6 [&>button:last-child]:hidden">
        <DialogHeader className="pb-4 mb-2 border-b border-[hsl(217,33%,18%)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="h-5 w-5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <DialogTitle className="text-base sm:text-xl font-bold text-[hsl(210,40%,96%)]">{segmentName} - Deep Dive</DialogTitle>
            </div>
            <button onClick={onClose} className="flex-shrink-0 rounded-full bg-[hsl(217,33%,22%)] p-2 text-[hsl(210,40%,96%)] hover:bg-[hsl(217,33%,28%)] transition-colors" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground">{cagrStartYear} Market Size</p>
              <p className="text-xl font-bold text-foreground">{fmtVal(currentValue, isVolume)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground">{lastYear} Forecast</p>
              <p className="text-xl font-bold text-foreground">{fmtVal(forecastValue, isVolume)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-xs text-muted-foreground">CAGR ({cagrStartYear}-{lastYear})</p>
              <div className="flex items-center gap-1">
                <p className="text-xl font-bold text-emerald-400">{cagr.toFixed(1)}%</p>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </motion.div>
          </div>
          <motion.div ref={trendChartRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg border border-border bg-secondary/20 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Historical & Forecast Trend</h4>
              <ChartDownloadButton onClick={() => downloadChart(trendChartRef, `${segmentName}-trend`.toLowerCase().replace(/\s+/g, "-"), `${config.title} — ${segmentName} Trend`)} />
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={segmentData} margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 18%)" />
                  <XAxis dataKey="year" stroke="hsl(215, 20%, 55%)" fontSize={10} tickLine={false} interval={Math.ceil(segmentData.length / 8)} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} tickLine={false} tickFormatter={(value) => fmtAxis(value, isVolume, useMillions)} width={useMillions ? 70 : 50} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradientId})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-lg border border-border bg-secondary/20 p-4">
            <h4 className="mb-4 text-sm font-semibold text-foreground">Year-over-Year Data</h4>
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-secondary">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left text-muted-foreground">Year</th>
                    <th className="px-3 py-2 text-right text-muted-foreground">Value</th>
                    <th className="px-3 py-2 text-right text-muted-foreground">YoY Change</th>
                  </tr>
                </thead>
                <tbody>
                  {(segmentData ?? []).map((item, idx, arr) => {
                    const prevValue = idx > 0 ? arr[idx - 1].value : null;
                    const change = prevValue ? ((item.value - prevValue) / prevValue) * 100 : null;
                    return (
                      <tr key={item.year} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="px-3 py-2 font-medium text-foreground">{item.year}</td>
                        <td className="px-3 py-2 text-right font-mono text-foreground">{fmtVal(item.value, isVolume)}</td>
                        <td className={`px-3 py-2 text-right font-mono ${change === null ? "text-muted-foreground" : change >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                          {change === null ? "—" : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── StackedBarChart ───────────────────────────────────────────

interface SegmentBreakdown { name: string; value: number; fullData?: YearlyData[]; }
interface StackedBarData { name: string; segments: SegmentBreakdown[]; total: number; }

interface StackedBarChartProps {
  data: StackedBarData[];
  year: number;
  title: string;
  subtitle?: string;
  segmentColors: string[];
  segmentNames: string[];
  onSegmentClick?: (endUserType: string, segmentName: string, value: number, color: string, fullData?: YearlyData[]) => void;
  useMillions?: boolean;
  isVolume?: boolean;
}

export function StackedBarChart({ data, year, title, subtitle, segmentColors, segmentNames, onSegmentClick, useMillions = false, isVolume = false }: StackedBarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { downloadChart } = useChartDownload();
  const [activeSegment, setActiveSegment] = useState<{ barIndex: number; segmentIndex: number; segmentName: string } | null>(null);
  const [view, setView] = useState<"chart" | "table">("chart");

  const chartData = data.map((bar) => {
    const result: Record<string, any> = { name: bar.name, total: bar.total };
    bar.segments.forEach((seg) => { result[seg.name] = seg.value; result[`${seg.name}_fullData`] = seg.fullData; });
    return result;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && activeSegment) {
      const hoveredEntry = payload.find((p: any) => p.name === activeSegment.segmentName);
      if (!hoveredEntry) return null;
      const dataEntry = chartData.find((d) => d.name === label);
      const barTotal = dataEntry?.total ?? payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
      const percent = barTotal > 0 ? ((hoveredEntry.value / barTotal) * 100).toFixed(1) : "0";
      return (
        <div className="max-w-[280px] sm:max-w-xs rounded-lg border border-border bg-popover p-3 sm:p-4 shadow-lg">
          <p className="font-semibold text-foreground text-sm sm:text-base break-words">{label} - {activeSegment.segmentName} ({year})</p>
          <div className="mt-2 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: hoveredEntry.fill }} />
              <span className="font-mono font-medium text-foreground">{fmtVal(hoveredEntry.value ?? 0, isVolume)}</span>
              <span className="text-muted-foreground">({percent}% of {label})</span>
            </div>
            <div className="mt-1 pt-1 border-t border-border flex items-center gap-2 text-muted-foreground">
              <span>Bar Total:</span>
              <span className="font-mono font-medium text-foreground">{fmtVal(barTotal, isVolume)}</span>
            </div>
          </div>
          {onSegmentClick && <p className="mt-2 text-xs text-primary">Click to drill down</p>}
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (segmentName: string, segmentIndex: number, entry: any) => {
    if (onSegmentClick) {
      const value = entry[segmentName];
      const fullData = entry[`${segmentName}_fullData`];
      onSegmentClick(entry.name, segmentName, value, segmentColors[segmentIndex % segmentColors.length], fullData);
    }
  };

  const renderLegend = () => (
    <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1.5 sm:gap-4">
      {segmentNames.map((name, index) => (
        <div key={name} className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: segmentColors[index % segmentColors.length] }} />
          <span className="text-xs sm:text-sm text-muted-foreground">{name}</span>
        </div>
      ))}
    </div>
  );

  const tableHeaders = ["Category", ...segmentNames, "Total"];
  const tableRows = data.map((bar) => [
    bar.name,
    ...segmentNames.map((segName) => { const seg = bar.segments.find((s) => s.name === segName); return fmtVal(seg?.value ?? 0, isVolume); }),
    fmtVal(bar.total, isVolume),
  ]);

  return (
    <motion.div ref={chartRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-xl border border-border bg-card p-4 sm:p-6 overflow-hidden">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          <ChartTableViewToggle view={view} onViewChange={setView} />
          <ChartDownloadButton onClick={() => downloadChart(chartRef, `${title.toLowerCase().replace(/\s+/g, "-")}-${year}`, `${config.title} — ${title} (${year})`)} />
        </div>
      </div>
      <AnimatedViewSwitch view={view}
        chart={
          <>
            <div style={{ height: `${Math.max(200, chartData.length * 50)}px` }} className="w-full -mx-4 sm:mx-0 overflow-x-auto overflow-y-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(value) => fmtAxis(value, isVolume, useMillions)} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={{ stroke: "hsl(var(--border))" }} width={140} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/0.1)" }} wrapperStyle={{ zIndex: 50, maxWidth: "90vw", pointerEvents: "none" }} />
                  {segmentNames.map((segmentName, index) => (
                    <Bar key={segmentName} dataKey={segmentName} stackId="stack" fill={segmentColors[index % segmentColors.length]}
                      radius={index === segmentNames.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                      onClick={(entry) => handleBarClick(segmentName, index, entry)} style={{ cursor: onSegmentClick ? "pointer" : "default" }}>
                      {chartData.map((_, barIndex) => (
                        <Cell key={`${segmentName}-${barIndex}`} fill={segmentColors[index % segmentColors.length]}
                          opacity={activeSegment === null ? 1 : activeSegment.barIndex === barIndex && activeSegment.segmentIndex === index ? 1 : 0.6}
                          onMouseEnter={() => setActiveSegment({ barIndex, segmentIndex: index, segmentName })} onMouseLeave={() => setActiveSegment(null)} />
                      ))}
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            {renderLegend()}
          </>
        }
        table={<DataTable headers={tableHeaders} rows={tableRows} />}
      />
    </motion.div>
  );
}

// ── ComparisonTable ───────────────────────────────────────────

interface ComparisonTableProps {
  data: SegmentData[];
  startYear: number;
  endYear: number;
  title: string;
  onRowClick?: (segmentName: string, segmentData: YearlyData[], color: string) => void;
  isVolume?: boolean;
}

export function ComparisonTable({ data, startYear, endYear, title, onRowClick, isVolume = false }: ComparisonTableProps) {
  const tableData = data.map((segment, index) => {
    const startValue = segment.data.find((d) => d.year === startYear)?.value ?? 0;
    const endValue = segment.data.find((d) => d.year === endYear)?.value ?? 0;
    const cagr = startValue > 0 ? (Math.pow(endValue / startValue, 1 / (endYear - startYear)) - 1) * 100 : 0;
    const growth = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
    return { name: segment.name, startValue, endValue, cagr, growth, fullData: segment.data, color: CHART_COLORS[index % CHART_COLORS.length] };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }} className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-3 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{startYear} vs {endYear} Comparison</p>
          </div>
          {onRowClick && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><MousePointer2 className="h-3 w-3" /><span>Click rows to drill down</span></div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Segment</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{startYear}</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">{endYear}</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">CAGR</th>
              <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Growth</th>
              {onRowClick && <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tableData.map((row, idx) => (
              <motion.tr key={row.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + idx * 0.05 }}
                onClick={() => onRowClick?.(row.name, row.fullData, row.color)}
                className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-secondary/40" : "hover:bg-secondary/20"}`}>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-foreground">
                  <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: row.color }} /><span className="whitespace-nowrap">{row.name}</span></div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-mono text-sm text-muted-foreground whitespace-nowrap">{fmtVal(row.startValue, isVolume)}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right font-mono text-sm text-foreground whitespace-nowrap">{fmtVal(row.endValue, isVolume)}</td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                  <span className={`font-mono text-sm font-medium ${row.cagr >= 0 ? "text-emerald-400" : "text-destructive"}`}>{row.cagr >= 0 ? "+" : ""}{row.cagr.toFixed(1)}%</span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                  <span className={`font-mono text-sm font-medium ${row.growth >= 0 ? "text-emerald-400" : "text-destructive"}`}>{row.growth >= 0 ? "+" : ""}{row.growth.toFixed(0)}%</span>
                </td>
                {onRowClick && <td className="px-3 sm:px-6 py-3 sm:py-4 text-right"><ArrowRight className="h-4 w-4 text-muted-foreground inline-block" /></td>}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
