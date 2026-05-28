/**
 * DASHBOARD CONFIGURATION — Aircraft Soft Goods Market
 */

import { BarChart3, Plane, Globe, Package, Layers, Users } from "lucide-react";

export type TabType = "overview" | "aircraft" | "region" | "productType" | "materialType" | "endUser";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/4",
  title: "Global Aircraft Soft Goods Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Aircraft Soft Goods Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-interiors",
  backLabel: "Back to Aircraft Interiors",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "aircraft", label: "Aircraft Type", icon: Plane },
    { id: "region", label: "Region", icon: Globe },
    { id: "productType", label: "Product Type", icon: Package },
    { id: "materialType", label: "Material Type", icon: Layers },
    { id: "endUser", label: "End-User Type", icon: Users },
  ] as TabConfig[],

  labels: {
    endUser: "End-User Type",
    aircraft: "Aircraft Type",
    productType: "Product Type",
    materialType: "Material Type",
  },

  segmentMapping: {
    aircraft:     { dataKey: "aircraftType",  title: "Aircraft Type" },
    region:       { dataKey: "region",        title: "Region" },
    productType:  { dataKey: "productType",   title: "Product Type" },
    materialType: { dataKey: "materialType",  title: "Material Type" },
    endUser:      { dataKey: "endUser",       title: "End-User Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-soft-goods",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-interiors",
    dashboardId: "aircraft-soft-goods",
    dashboardName: "Aircraft Soft Goods Market",
    purchased: true,
    datasetName: "Aircraft Interiors",
  },
} as const;
