/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Global High Temperature Prepreg Market
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
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/17",
  title: "Global High Temperature Prepreg Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "High Temperature Prepreg Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  unitModes: {
    value: { label: "US$ Million", suffix: "M", footerUnit: "All values in US$ Million unless otherwise specified" },
    volume: { label: "Million Lbs", suffix: "M Lbs", footerUnit: "All values in Million Lbs unless otherwise specified" },
  } as Record<UnitMode, { label: string; suffix: string; footerUnit: string }>,

  backPath: "/dataset/prepregs",
  backLabel: "Back to Prepreg",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "application", label: "Resin Type", icon: Atom },
    { id: "endUser", label: "End Use Industry", icon: Layers },
    { id: "equipment", label: "Prepreg Type", icon: Box },
    { id: "process", label: "Curing Process", icon: Cog },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "End Use Industry",
    equipment: "Prepreg Type",
    application: "Resin Type",
    processType: "Curing Process",
    materialType: "",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",            title: "End Use Industry" },
    region:       { dataKey: "region",             title: "Region" },
    application:  { dataKey: "application",        title: "Resin Type" },
    equipment:    { dataKey: "furnishedEquipment", title: "Prepreg Type" },
    process:      { dataKey: "processType",        title: "Curing Process" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/high-temperature-prepreg",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "high-temperature-prepreg",
    dashboardName: "High Temperature Prepreg Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
