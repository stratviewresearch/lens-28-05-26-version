/**
 * DASHBOARD CONFIGURATION — Engine MRO Market
 */

import { BarChart3, Gauge, Factory, Cog, Plane, Globe } from "lucide-react";

export type TabType = "overview" | "endUser" | "equipment" | "aircraft" | "component" | "region";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/46",
  title: "Engine MRO Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2025,
  useMillions: false,

  footerText: "Engine MRO Market Research Report",
  footerUnit: "All values in US$ Billion unless otherwise specified",

  backPath: "/dataset/aircraft-mro",
  backLabel: "Back to Aircraft MRO",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Consumption Type", icon: Gauge },
    { id: "equipment", label: "Certificate Holder", icon: Factory },
    { id: "aircraft", label: "Engine Model", icon: Cog },
    { id: "component", label: "Platform Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Consumption Type",
    equipment: "Certificate Holder",
    application: "Platform Type",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:    { dataKey: "endUser",            title: "Consumption Type" },
    equipment:  { dataKey: "furnishedEquipment", title: "Certificate Holder" },
    aircraft:   { dataKey: "aircraftType",       title: "Engine Model" },
    component:  { dataKey: "application",        title: "Platform Type" },
    region:     { dataKey: "region",             title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/engine-mro",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-mro",
    dashboardId: "engine-mro",
    dashboardName: "Engine MRO Market",
    purchased: true,
    datasetName: "Aircraft MRO",
  },
} as const;
