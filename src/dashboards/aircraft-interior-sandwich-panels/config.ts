/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Aircraft Interior Sandwich Panels Market
 * ============================================================
 */

import { BarChart3, Users, Plane, Globe, Box, Layers, FlaskConical } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/16",
  title: "Global Aircraft Interior Sandwich Panels Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Interior Sandwich Panels Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "End-User Type", icon: Users },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "application", label: "Application Type", icon: Box },
    { id: "material", label: "Core Material", icon: Layers },
    { id: "process", label: "Resin Type", icon: FlaskConical },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    equipment: "",
    application: "Application Type",
    processType: "Resin Type",
    materialType: "Core Material Type",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",        title: "End-User Type" },
    aircraft:     { dataKey: "aircraftType",   title: "Aircraft Type" },
    region:       { dataKey: "region",         title: "Region" },
    application:  { dataKey: "application",    title: "Application Type" },
    material:     { dataKey: "materialType",   title: "Core Material Type" },
    process:      { dataKey: "processType",    title: "Resin Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-interior-sandwich-panels",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-interior-sandwich-panels",
    dashboardName: "Aircraft Interior Sandwich Panels Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
