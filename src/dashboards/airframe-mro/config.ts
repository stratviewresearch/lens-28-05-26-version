/**
 * DASHBOARD CONFIGURATION — Airframe MRO Market
 */

import { BarChart3, Handshake, Plane, Globe } from "lucide-react";

export type TabType = "overview" | "endUser" | "equipment" | "aircraft" | "region" | "component";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/47",
  title: "Airframe MRO Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2025,
  useMillions: false,

  footerText: "Airframe MRO Market Research Report",
  footerUnit: "All values in US$ Billion unless otherwise specified",

  backPath: "/dataset/aircraft-mro",
  backLabel: "Back to Aircraft MRO",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Provider Type", icon: Handshake },
    { id: "aircraft", label: "Platform Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Provider Type",
    equipment: "",
    application: "",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:  { dataKey: "endUser",      title: "Provider Type" },
    aircraft: { dataKey: "aircraftType", title: "Platform Type" },
    region:   { dataKey: "region",       title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/airframe-mro",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-mro",
    dashboardId: "airframe-mro",
    dashboardName: "Airframe MRO Market",
    purchased: true,
    datasetName: "Aircraft MRO",
  },
} as const;
