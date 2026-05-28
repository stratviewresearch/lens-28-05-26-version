/**
 * DASHBOARD CONFIGURATION — Global Prepreg Market
 */

import { BarChart3, Globe, Atom, FlaskConical, Box, Layers, Cog } from "lucide-react";

export type TabType = "overview" | "endUse" | "resinType" | "fiberType" | "formType" | "processType" | "region";
export type UnitMode = "value" | "volume";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/32",
  title: "Global Prepreg Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: new Date().getFullYear(),
  useMillions: true,

  footerText: "Prepreg Market Research Report",
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
    { id: "fiberType", label: "Fiber Type", icon: Atom },
    { id: "formType", label: "Form Type", icon: Box },
    { id: "processType", label: "Process Type", icon: Cog },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUse: "End Use Industry",
    resinType: "Resin Type",
    fiberType: "Fiber Type",
    formType: "Form Type",
    processType: "Process Type",
  },

  segmentMapping: {
    endUse:        { dataKey: "endUser",             title: "End Use Industry" },
    resinType:     { dataKey: "materialType",        title: "Resin Type" },
    fiberType:     { dataKey: "furnishedEquipment",  title: "Fiber Type" },
    formType:      { dataKey: "application",         title: "Form Type" },
    processType:   { dataKey: "processType",         title: "Process Type" },
    region:        { dataKey: "region",              title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/global-prepreg-market",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "global-prepreg-market",
    dashboardName: "Global Prepreg Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
