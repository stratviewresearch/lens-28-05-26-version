/**
 * DASHBOARD CONFIGURATION — Line MRO Market
 */

import { BarChart3, ClipboardCheck, Handshake, Plane, Globe } from "lucide-react";

export type TabType = "overview" | "endUser" | "equipment" | "aircraft" | "region" | "component";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/45",
  title: "Line MRO Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2025,
  useMillions: false,

  footerText: "Line MRO Market Research Report",
  footerUnit: "All values in US$ Billion unless otherwise specified",

  backPath: "/dataset/aircraft-mro",
  backLabel: "Back to Aircraft MRO",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Check Type", icon: ClipboardCheck },
    { id: "equipment", label: "Sourcing Mode", icon: Handshake },
    { id: "aircraft", label: "Platform Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Check Type",
    equipment: "Sourcing Mode",
    application: "",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:    { dataKey: "endUser",            title: "Check Type" },
    equipment:  { dataKey: "furnishedEquipment", title: "Sourcing Mode" },
    aircraft:   { dataKey: "aircraftType",       title: "Platform Type" },
    region:     { dataKey: "region",             title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/line-mro",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-mro",
    dashboardId: "line-mro",
    dashboardName: "Line MRO Market",
    purchased: true,
    datasetName: "Aircraft MRO",
  },
} as const;
