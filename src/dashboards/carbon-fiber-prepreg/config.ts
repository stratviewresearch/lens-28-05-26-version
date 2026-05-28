/**
 * DASHBOARD CONFIGURATION — Carbon Fiber Prepreg Market
 */

import { BarChart3, Globe, FlaskConical, Box, Cog, Layers } from "lucide-react";

export type TabType = "overview" | "endUse" | "resinType" | "prepregType" | "processType" | "region";
export type UnitMode = "value" | "volume";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/35",
  title: "Carbon Fiber Prepreg Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: new Date().getFullYear(),
  useMillions: true,

  footerText: "Carbon Fiber Prepreg Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  unitModes: {
    value: { label: "US$ Million", suffix: "M", footerUnit: "All values in US$ Million unless otherwise specified" },
    volume: { label: "Million Lbs", suffix: "M Lbs", footerUnit: "All values in Million Lbs unless otherwise specified" },
  } as Record<UnitMode, { label: string; suffix: string; footerUnit: string }>,

  backPath: "/dataset/prepregs",
  backLabel: "Back to Prepreg",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUse", label: "End Use Industry", icon: Layers },
    { id: "resinType", label: "Resin Type", icon: FlaskConical },
    { id: "prepregType", label: "Prepreg Type", icon: Box },
    { id: "processType", label: "Process Type", icon: Cog },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUse: "End Use Industry",
    resinType: "Resin Type",
    prepregType: "Prepreg Type",
    processType: "Process Type",
  },

  segmentMapping: {
    endUse:        { dataKey: "endUser",        title: "End Use Industry" },
    resinType:     { dataKey: "materialType",   title: "Resin Type" },
    prepregType:   { dataKey: "application",    title: "Prepreg Type" },
    processType:   { dataKey: "processType",    title: "Process Type" },
    region:        { dataKey: "region",          title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/carbon-fiber-prepreg",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "carbon-fiber-prepreg",
    dashboardName: "Carbon Fiber Prepreg Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
