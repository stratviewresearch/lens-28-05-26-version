/**
 * DASHBOARD CONFIGURATION — Aircraft Stowages Market
 */

import { BarChart3, Plane, Globe, Package, Layers, Users } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "equipment" | "stowageType";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/29",
  title: "Global Aircraft Stowages Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Stowages Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "End-User Type", icon: Users },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "equipment", label: "Furnished Equipment Type", icon: Package },
    { id: "stowageType", label: "Stowage Type", icon: Layers },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    aircraft: "Aircraft Type",
    equipment: "Furnished Equipment Type",
    stowageType: "Stowage Type",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",             title: "End-User Type" },
    aircraft:     { dataKey: "aircraftType",        title: "Aircraft Type" },
    region:       { dataKey: "region",              title: "Region" },
    equipment:    { dataKey: "furnishedEquipment",  title: "Furnished Equipment Type" },
    stowageType:  { dataKey: "stowageType",         title: "Stowage Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-stowages",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-stowages",
    dashboardName: "Aircraft Stowages Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
