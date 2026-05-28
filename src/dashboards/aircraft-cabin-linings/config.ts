/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Aircraft Cabin Linings Market
 * ============================================================
 */

import { BarChart3, Users, Plane, Globe, Layers, Box } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/13",
  title: "Global Aircraft Cabin Lining Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Cabin Lining Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "End-User Type", icon: Users },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "application", label: "Application Type", icon: Box },
    { id: "equipment", label: "Equipment Type", icon: Layers },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    equipment: "Equipment Type",
    application: "Application Type",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",            title: "End-User Type" },
    aircraft:     { dataKey: "aircraftType",       title: "Aircraft Type" },
    region:       { dataKey: "region",             title: "Region" },
    application:  { dataKey: "application",        title: "Application Type" },
    equipment:    { dataKey: "furnishedEquipment", title: "Equipment Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-cabin-linings",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-cabin-linings",
    dashboardName: "Aircraft Cabin Lining Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
