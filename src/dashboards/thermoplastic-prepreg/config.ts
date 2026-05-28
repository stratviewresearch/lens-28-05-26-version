/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Global Thermoplastic Prepreg Market
 * ============================================================
 */

import { BarChart3, Globe, Layers, FlaskConical, Box, Cog, Atom } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";
export type UnitMode = "value" | "volume";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/7",
  title: "Global Thermoplastic Prepreg Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Thermoplastic Prepreg Market Research Report",
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
    { id: "material", label: "Resin Type", icon: FlaskConical },
    { id: "application", label: "Product Form", icon: Box },
    { id: "equipment", label: "Fiber Type", icon: Atom },
    { id: "process", label: "Process Type", icon: Cog },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "End Use Industry",
    equipment: "Fiber Type",
    application: "Product Form",
    processType: "Process Type",
    materialType: "Resin Type",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",            title: "End Use Industry" },
    region:       { dataKey: "region",             title: "Region" },
    application:  { dataKey: "application",        title: "Product Form" },
    equipment:    { dataKey: "furnishedEquipment", title: "Fiber Type" },
    material:     { dataKey: "materialType",       title: "Resin Type" },
    process:      { dataKey: "processType",        title: "Process Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/thermoplastic-prepreg",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "thermoplastic-prepreg",
    dashboardName: "Global Thermoplastic Prepreg Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
