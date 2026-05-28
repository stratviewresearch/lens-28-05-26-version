/**
 * DASHBOARD CONFIGURATION — Aircraft Interiors Plastic Market
 */

import { BarChart3, Users, Plane, Globe, Box, Layers } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/6",
  title: "Global Aircraft Interiors Plastic Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Interiors Plastic Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "application", label: "Application Type", icon: Box },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "material", label: "Plastic Type", icon: Layers },
    { id: "endUser", label: "End-User Type", icon: Users },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    equipment: "Plastic Type",
    application: "Application Type",
    processType: "",
    materialType: "Plastic Type",
  },

  segmentMapping: {
    application:  { dataKey: "application",    title: "Application Type" },
    aircraft:     { dataKey: "aircraftType",   title: "Aircraft Type" },
    region:       { dataKey: "region",         title: "Region" },
    material:     { dataKey: "materialType",   title: "Plastic Type" },
    endUser:      { dataKey: "endUser",        title: "End-User Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-interiors-plastic",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-interiors-plastic",
    dashboardName: "Aircraft Interiors Plastic Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
