/**
 * DASHBOARD CONFIGURATION — Aircraft Water/Waste Water Market
 */

import { BarChart3, Plane, Globe, Package, Layers, Users, Droplets, Settings } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "waterSystem" | "equipment" | "component";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/30",
  title: "Global Aircraft Water/Waste Water Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Water/Waste Water Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "End-User Type", icon: Users },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "waterSystem", label: "Water System Type", icon: Droplets },
    { id: "equipment", label: "Furnished Equipment Type", icon: Package },
    { id: "component", label: "Component Type", icon: Settings },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    aircraft: "Aircraft Type",
    waterSystem: "Water System Type",
    equipment: "Furnished Equipment Type",
    component: "Component Type",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",             title: "End-User Type" },
    aircraft:     { dataKey: "aircraftType",        title: "Aircraft Type" },
    region:       { dataKey: "region",              title: "Region" },
    waterSystem:  { dataKey: "waterSystemType",     title: "Water System Type" },
    equipment:    { dataKey: "furnishedEquipment",  title: "Furnished Equipment Type" },
    component:    { dataKey: "componentType",       title: "Component Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-waste-water",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-waste-water",
    dashboardName: "Aircraft Waste Water Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
