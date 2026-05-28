/**
 * Small UI helper components: AnimatedCounter, KPICard, ChartDownloadButton,
 * ChartTableViewToggle, DataTable, AnimatedViewSwitch.
 * Self-contained — only imports from shadcn UI primitives.
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, MousePointer2, Download, BarChart3, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── AnimatedCounter ───────────────────────────────────────────

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, prefix = "", suffix = "", decimals = 1, duration = 1.5, className = "" }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();
    const durationMs = duration * 1000;
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / durationMs, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      setDisplayValue(startValue + (endValue - startValue) * eased);
      if (progress < 1) requestAnimationFrame(animate);
      else { setDisplayValue(endValue); previousValue.current = endValue; }
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <motion.span className={`font-mono tabular-nums ${className}`} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
      {prefix}{(typeof displayValue === "number" && isFinite(displayValue) ? displayValue : 0).toFixed(decimals)}{suffix}
    </motion.span>
  );
}

// ── KPICard ───────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  delay?: number;
  accentColor?: "primary" | "accent" | "chart-3" | "chart-4";
  onClick?: () => void;
}

const accentColors = {
  primary: "from-primary/20 to-transparent border-primary/30",
  accent: "from-accent/20 to-transparent border-accent/30",
  "chart-3": "from-chart-3/20 to-transparent border-chart-3/30",
  "chart-4": "from-chart-4/20 to-transparent border-chart-4/30",
};

const iconColors = {
  primary: "text-primary",
  accent: "text-accent",
  "chart-3": "text-chart-3",
  "chart-4": "text-chart-4",
};

export function KPICard({ title, value, prefix = "$", suffix = "B", decimals = 1, change, changeLabel, icon: Icon, delay = 0, accentColor = "primary", onClick }: KPICardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay }}
      whileHover={onClick ? { scale: 1.02 } : undefined} onClick={onClick}
      className={`stat-card rounded-xl bg-gradient-to-br ${accentColors[accentColor]} border p-6 backdrop-blur-sm ${onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {onClick && <MousePointer2 className="h-3 w-3 text-muted-foreground/50" />}
          </div>
          <div className="flex items-baseline gap-1">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} className="text-3xl font-bold text-foreground" />
          </div>
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${change >= 0 ? "text-chart-4" : "text-destructive"}`}>
                {change >= 0 ? "+" : ""}{change.toFixed(1)}%
              </span>
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={`rounded-lg bg-secondary/50 p-3 ${iconColors[accentColor]}`}><Icon className="h-6 w-6" /></div>
      </div>
    </motion.div>
  );
}

// ── ChartDownloadButton ───────────────────────────────────────

export function ChartDownloadButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <Button variant="ghost" size="icon" onClick={onClick} data-download-exclude
      className={`h-8 w-8 text-muted-foreground hover:text-foreground ${className}`} title="Download chart as PNG">
      <Download className="h-4 w-4" />
    </Button>
  );
}

// ── ChartTableViewToggle ──────────────────────────────────────

export function ChartTableViewToggle({ view, onViewChange }: { view: "chart" | "table"; onViewChange: (view: "chart" | "table") => void }) {
  return (
    <div className="flex items-center rounded-lg border border-border bg-secondary/50 p-0.5" data-download-exclude>
      <Button variant="ghost" size="icon" onClick={() => onViewChange("chart")}
        className={`h-7 w-7 ${view === "chart" ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} title="Chart view">
        <BarChart3 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onViewChange("table")}
        className={`h-7 w-7 ${view === "table" ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} title="Table view">
        <Table2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── AnimatedViewSwitch ────────────────────────────────────────

export function AnimatedViewSwitch({ view, chart, table }: { view: "chart" | "table"; chart: React.ReactNode; table: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {view === "chart" ? (
        <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{chart}</motion.div>
      ) : (
        <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{table}</motion.div>
      )}
    </AnimatePresence>
  );
}

// ── DataTable ─────────────────────────────────────────────────

export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/30">
            {headers.map((header, i) => (
              <th key={i} className={`px-4 sm:px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground ${i === 0 ? "text-left" : "text-right"}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-secondary/20 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className={`px-4 sm:px-6 py-3 text-sm ${cellIdx === 0 ? "text-left font-medium text-foreground" : "text-right font-mono text-muted-foreground"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
