/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Global BMI Prepreg Market
 * ============================================================
 */

import { BarChart3, Globe, Layers, Box, Atom, Cog } from "lucide-react";

export type TabType = "overview" | "endUser" | "region" | "application" | "equipment" | "process";
export type UnitMode = "value" | "volume";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/8",
  title: "Global BMI Prepreg Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "BMI Prepreg Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  /** Dual-mode support */
  unitModes: {
    value: { label: "US$ Million", suffix: "M", footerUnit: "All values in US$ Million unless otherwise specified" },
    volume: { label: "Million Lbs", suffix: "M Lbs", footerUnit: "All values in Million Lbs unless otherwise specified" },
  } as Record<UnitMode, { label: string; suffix: string; footerUnit: string }>,

  backPath: "/dataset/prepregs",
  backLabel: "Back to Prepreg",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "End Use Industry", icon: Layers },
    { id: "application", label: "Application Type", icon: Box },
    { id: "equipment", label: "Reinforcement Type", icon: Atom },
    { id: "process", label: "Curing Type", icon: Cog },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "End Use Industry",
    equipment: "Reinforcement Type",
    application: "Application Type",
    processType: "Curing Type",
    materialType: "",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",            title: "End Use Industry" },
    region:       { dataKey: "region",             title: "Region" },
    application:  { dataKey: "application",        title: "Application Type" },
    equipment:    { dataKey: "furnishedEquipment", title: "Reinforcement Type" },
    process:      { dataKey: "processType",        title: "Curing Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/bmi-prepreg",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "bmi-prepreg",
    dashboardName: "BMI Prepreg Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
