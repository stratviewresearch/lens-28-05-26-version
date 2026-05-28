/**
 * DASHBOARD CONFIGURATION — Landing Gear MRO
 */

import { BarChart3, Plane, Cog, Globe } from "lucide-react";

export type TabType = "overview" | "endUser" | "equipment" | "aircraft" | "region" | "component";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/48",
  title: "Landing Gear MRO",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2025,
  useMillions: true,

  footerText: "Landing Gear MRO Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-mro",
  backLabel: "Back to Aircraft MRO",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Platform Type", icon: Plane },
    { id: "aircraft", label: "Application", icon: Cog },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Platform Type",
    equipment: "",
    application: "",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:  { dataKey: "endUser",      title: "Platform Type" },
    aircraft: { dataKey: "aircraftType", title: "Application" },
    region:   { dataKey: "region",       title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/landing-gear-mro",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-mro",
    dashboardId: "landing-gear-mro",
    dashboardName: "Landing Gear MRO",
    purchased: true,
    datasetName: "Aircraft MRO",
  },
} as const;
