/**
 * DASHBOARD CONFIGURATION — Global Aerospace Prepreg Market
 */

import { BarChart3, Globe, Atom, FlaskConical, Layers, Box, Cog } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";
export type UnitMode = "value" | "volume";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/11",
  title: "Global Aerospace Prepreg Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aerospace Prepreg Market Research Report",
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
    { id: "equipment", label: "Fiber Type", icon: Atom },
    { id: "material", label: "Resin Type", icon: FlaskConical },
    { id: "endUser", label: "Resin Sub-Type", icon: Layers },
    { id: "application", label: "Form Type", icon: Box },
    { id: "process", label: "Curing Type", icon: Cog },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Resin Sub-Type",
    equipment: "Fiber Type",
    application: "Form Type",
    processType: "Curing Type",
    materialType: "Resin Type",
  },

  segmentMapping: {
    equipment:    { dataKey: "furnishedEquipment", title: "Fiber Type" },
    material:     { dataKey: "materialType",       title: "Resin Type" },
    endUser:      { dataKey: "endUser",            title: "Resin Sub-Type" },
    application:  { dataKey: "application",        title: "Form Type" },
    process:      { dataKey: "processType",        title: "Curing Type" },
    region:       { dataKey: "region",             title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aerospace-prepreg",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "aerospace-prepreg",
    dashboardName: "Global Aerospace Prepreg Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
