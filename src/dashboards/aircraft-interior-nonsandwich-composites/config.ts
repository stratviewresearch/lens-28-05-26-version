/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Aircraft Interior Non-Sandwich Panel Composites Market
 * ============================================================
 */

import { BarChart3, Users, Plane, Globe, Box } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/18",
  title: "Global Aircraft Interior Non-Sandwich Panel Composites Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Interior Non-Sandwich Panel Composites Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "application", label: "Application Type", icon: Box },
    { id: "endUser", label: "Sales Channel", icon: Users },
  ] as TabConfig[],

  labels: {
    endUser: "Sales Channel",
    equipment: "",
    application: "Application Type",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    aircraft:     { dataKey: "aircraftType",   title: "Aircraft Type" },
    region:       { dataKey: "region",         title: "Region" },
    application:  { dataKey: "application",    title: "Application Type" },
    endUser:      { dataKey: "endUser",        title: "Sales Channel" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-interior-nonsandwich-composites",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-interior-nonsandwich-composites",
    dashboardName: "Aircraft Interior Non-Sandwich Panel Composites Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
