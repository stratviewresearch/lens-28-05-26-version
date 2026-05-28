/**
 * DASHBOARD CONFIGURATION — Aircraft Seats Market
 */

import { BarChart3, Users, Plane, Globe, Package, Layers, Armchair } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "seatClass" | "component" | "equipment";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/28",
  title: "Global Aircraft Seats Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Seats Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Sales Type", icon: Users },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "seatClass", label: "Seat Class Type", icon: Armchair },
    { id: "component", label: "Component", icon: Layers },
    { id: "equipment", label: "Sales Channel Type", icon: Package },
  ] as TabConfig[],

  labels: {
    endUser: "Sales Type",
    equipment: "Sales Channel Type",
    application: "Seat Class Type",
    processType: "Component",
    materialType: "",
  },

  segmentMapping: {
    endUser:    { dataKey: "endUser",            title: "Sales Type" },
    aircraft:   { dataKey: "aircraftType",       title: "Aircraft Type" },
    region:     { dataKey: "region",             title: "Region" },
    seatClass:  { dataKey: "seatClass",          title: "Seat Class Type" },
    component:  { dataKey: "component",          title: "Component" },
    equipment:  { dataKey: "furnishedEquipment", title: "Sales Channel Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-seats",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-seats",
    dashboardName: "Aircraft Seats Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
