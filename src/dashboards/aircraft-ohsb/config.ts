/**
 * DASHBOARD CONFIGURATION — Aircraft OHSB Market
 */

import { BarChart3, Users, Plane, Globe, Box, Package } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/25",
  title: "Global Aircraft OHSB Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft OHSB Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "End-User Type", icon: Users },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "application", label: "Stowage Bin Type", icon: Box },
    { id: "equipment", label: "Furnished Equipment", icon: Package },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    equipment: "Furnished Equipment",
    application: "Stowage Bin Type",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",              title: "End-User Type" },
    aircraft:     { dataKey: "aircraftType",         title: "Aircraft Type" },
    region:       { dataKey: "region",               title: "Region" },
    application:  { dataKey: "application",          title: "Stowage Bin Type" },
    equipment:    { dataKey: "furnishedEquipment",   title: "Furnished Equipment" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-ohsb",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-ohsb",
    dashboardName: "Aircraft OHSB Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
