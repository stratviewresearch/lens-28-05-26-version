/**
 * Layout components: Header, Skeleton, ScrollToTop, Navigation, YearSelector
 * Self-contained — only imports from shadcn UI primitives.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import stratviewLogoWhite from "@/assets/stratview-logo-white.png";
import type { TabType, TabConfig } from "./config";

// ── DashboardHeader ───────────────────────────────────────────

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

export function DashboardHeader({ title = "Market Dashboard", subtitle = "Global Market Research Dashboard" }: DashboardHeaderProps) {
  return (
    <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
      <div className="container relative mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start md:items-center gap-3 md:gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="shrink-0">
              <img src={stratviewLogoWhite} alt="Stratview Research" className="h-12 md:h-20 w-auto object-contain" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-foreground break-words">{title}</h1>
              <p className="text-xs md:text-sm lg:text-base text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-2 border border-border">
            <div className="h-2 w-2 rounded-full bg-chart-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Data updated: Q1 2026</span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}

// ── DashboardSkeleton ─────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-24" />)}
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.1 }} className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-8 w-8 rounded-lg" /></div>
              <Skeleton className="mt-4 h-10 w-32" />
              <Skeleton className="mt-2 h-4 w-16" />
            </motion.div>
          ))}
        </div>
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2"><div className="rounded-xl border border-border bg-card p-6"><Skeleton className="mb-4 h-6 w-48" /><Skeleton className="mb-2 h-4 w-64" /><Skeleton className="h-[350px] w-full" /></div></div>
          <div className="rounded-xl border border-border bg-card p-6"><Skeleton className="mb-4 h-6 w-32" /><Skeleton className="h-[300px] w-full rounded-full" /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-64" />
          <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        </div>
      </main>
    </div>
  );
}

// ── ScrollToTop ───────────────────────────────────────────────

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-colors hover:bg-primary/90"
          aria-label="Scroll to top">
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

// ── YearSelector ──────────────────────────────────────────────

interface YearSelectorProps {
  value: number;
  onChange: (year: number) => void;
  label?: string;
  years?: number[];
}

export function YearSelector({ value, onChange, label = "Select Year", years = [] }: YearSelectorProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <Select value={value.toString()} onValueChange={(v) => onChange(parseInt(v))}>
        <SelectTrigger className="w-[120px] border-[hsl(217,33%,18%)] bg-[hsl(217,33%,14%)] text-[hsl(210,40%,96%)] [&>svg]:text-[hsl(210,40%,96%)]">
          <SelectValue placeholder="Year" className="text-[hsl(210,40%,96%)]" />
        </SelectTrigger>
        <SelectContent className="bg-[hsl(222,47%,11%)] border-[hsl(217,33%,18%)] text-[hsl(210,40%,96%)]">
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()} className="text-[hsl(210,40%,96%)] focus:bg-[hsl(217,33%,18%)] focus:text-[hsl(210,40%,96%)]">{year}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );
}

// ── MainNavigation ────────────────────────────────────────────

interface MainNavigationProps {
  value: TabType;
  onChange: (value: TabType) => void;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
  showYearSelector?: boolean;
  tabs: TabConfig[];
  years?: number[];
}

export function MainNavigation({ value, onChange, selectedYear, onYearChange, showYearSelector = false, tabs, years }: MainNavigationProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={value} onValueChange={(v) => onChange(v as TabType)} className="flex-1">
          <TabsList className="bg-secondary/50 border border-border p-1 flex flex-wrap justify-start gap-1 h-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-3 sm:px-4 py-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        {showYearSelector && selectedYear && onYearChange && (
          <YearSelector value={selectedYear} onChange={onYearChange} years={years} />
        )}
      </div>
    </motion.div>
  );
}
