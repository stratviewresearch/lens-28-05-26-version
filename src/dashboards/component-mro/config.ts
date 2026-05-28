/**
 * DASHBOARD CONFIGURATION — Component MRO Market
 */

import { BarChart3, Cpu, Plane, Globe } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "equipment" | "component";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/44",
  title: "Component MRO Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2025,
  useMillions: false,

  footerText: "Component MRO Market Research Report",
  footerUnit: "All values in US$ Billion unless otherwise specified",

  backPath: "/dataset/aircraft-mro",
  backLabel: "Back to Aircraft MRO",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Component Type", icon: Cpu },
    { id: "aircraft", label: "Platform Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Component Type",
    equipment: "",
    application: "",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:    { dataKey: "endUser",      title: "Component Type" },
    aircraft:   { dataKey: "aircraftType", title: "Platform Type" },
    region:     { dataKey: "region",       title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/component-mro",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-mro",
    dashboardId: "component-mro",
    dashboardName: "Component MRO Market",
    purchased: true,
    datasetName: "Aircraft MRO",
  },
} as const;
