/**
 * DASHBOARD CONFIGURATION — Aircraft Thermoformed Sheets Market
 */

import { BarChart3, Plane, Globe, Layers, Users, Package } from "lucide-react";

export type TabType = "overview" | "application" | "aircraft" | "region" | "materialType" | "endUser";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/10",
  title: "Global Aircraft Thermoformed Sheets Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Thermoformed Sheets Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "application", label: "Application Type", icon: Package },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "materialType", label: "Material Type", icon: Layers },
    { id: "endUser", label: "End-User Type", icon: Users },
  ] as TabConfig[],

  labels: {
    application: "Application Type",
    aircraft: "Aircraft Type",
    materialType: "Material Type",
    endUser: "End-User Type",
  },

  segmentMapping: {
    application:  { dataKey: "application",   title: "Application Type" },
    aircraft:     { dataKey: "aircraftType",  title: "Aircraft Type" },
    region:       { dataKey: "region",        title: "Region" },
    materialType: { dataKey: "materialType",  title: "Material Type" },
    endUser:      { dataKey: "endUser",       title: "End-User Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-thermoformed-sheets",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-thermoformed-sheets",
    dashboardName: "Aircraft Thermoformed Sheets Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
