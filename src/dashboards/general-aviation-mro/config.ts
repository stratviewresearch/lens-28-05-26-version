/**
 * DASHBOARD CONFIGURATION — General Aviation MRO Market
 */

import { BarChart3, Wrench, Plane, Globe } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "equipment" | "component";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/41",
  title: "General Aviation MRO Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2025,
  useMillions: false, // values are in US$ Billion

  footerText: "General Aviation MRO Market Research Report",
  footerUnit: "All values in US$ Billion unless otherwise specified",

  backPath: "/dataset/aircraft-mro",
  backLabel: "Back to Aircraft MRO",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "endUser", label: "MRO Type", icon: Wrench },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "MRO Type",
    equipment: "",
    application: "",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:    { dataKey: "endUser",      title: "MRO Type" },
    aircraft:   { dataKey: "aircraftType", title: "Aircraft Type" },
    region:     { dataKey: "region",       title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/general-aviation-mro",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-mro",
    dashboardId: "general-aviation-mro",
    dashboardName: "General Aviation MRO Market",
    purchased: true,
    datasetName: "Aircraft MRO",
  },
} as const;
