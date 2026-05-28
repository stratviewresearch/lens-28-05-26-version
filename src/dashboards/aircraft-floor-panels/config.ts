/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Aircraft Floor Panels Market
 * ============================================================
 */

import { BarChart3, Users, Plane, Globe, Layers, Cog } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/14",
  title: "Global Aircraft Floor Panels Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Floor Panels Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "End-User Type", icon: Users },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "equipment", label: "Equipment Type", icon: Layers },
    { id: "process", label: "Core Type", icon: Cog },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    equipment: "Equipment Type",
    application: "",
    processType: "Core Type",
    materialType: "",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",            title: "End-User Type" },
    aircraft:     { dataKey: "aircraftType",       title: "Aircraft Type" },
    region:       { dataKey: "region",             title: "Region" },
    equipment:    { dataKey: "furnishedEquipment", title: "Equipment Type" },
    process:      { dataKey: "processType",        title: "Core Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-floor-panels",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-floor-panels",
    dashboardName: "Aircraft Floor Panels Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
