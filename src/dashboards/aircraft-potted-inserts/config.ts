/**
 * DASHBOARD CONFIGURATION — Aircraft Potted Inserts Market
 */

import { BarChart3, Plane, Globe, Box, Wrench, Layers, Database, Users } from "lucide-react";

export type TabType = "overview" | "aircraft" | "region" | "application" | "fastener" | "material" | "coreMaterial" | "salesChannel";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/26",
  title: "Global Aircraft Potted Inserts Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Potted Inserts Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "application", label: "Application Type", icon: Box },
    { id: "fastener", label: "Fastener Type", icon: Wrench },
    { id: "material", label: "Material Type", icon: Layers },
    { id: "coreMaterial", label: "Core Material Type", icon: Database },
    { id: "salesChannel", label: "Sales Channel", icon: Users },
  ] as TabConfig[],

  labels: {
    endUser: "Sales Channel",
    equipment: "",
    application: "Application Type",
    processType: "Fastener Type",
    materialType: "Material Type",
  },

  segmentMapping: {
    aircraft:      { dataKey: "aircraftType",    title: "Aircraft Type" },
    region:        { dataKey: "region",           title: "Region" },
    application:   { dataKey: "application",      title: "Application Type" },
    fastener:      { dataKey: "fastenerType",     title: "Fastener Type" },
    material:      { dataKey: "materialType",     title: "Material Type" },
    coreMaterial:  { dataKey: "coreMaterialType", title: "Core Material Type" },
    salesChannel:  { dataKey: "salesChannel",     title: "Sales Channel" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-potted-inserts",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-potted-inserts",
    dashboardName: "Aircraft Potted Inserts Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
