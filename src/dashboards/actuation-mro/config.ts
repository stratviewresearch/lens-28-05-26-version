/**
 * DASHBOARD CONFIGURATION — Actuation MRO Market
 *
 * Slot remapping:
 *   - "aircraft" tab  → Platform Type (data: aircraftType, cross-tab: aircraftTypeByRegion)
 *   - "endUser"  tab  → Application Type (data: endUser, cross-tab: endUserByRegion)
 *   - "region"   tab  → Region (data: region, cross-tab: countryDataByRegion)
 */

import { BarChart3, Wrench, Plane, Globe } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "equipment" | "component";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/49",
  title: "Actuation MRO",
  subtitle: "Global Market Research Dashboard",
  defaultYear: new Date().getFullYear() - 1,
  useMillions: true, // values in US$ Million

  footerText: "Actuation MRO Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/aircraft-mro",
  backLabel: "Back to Aircraft MRO",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "aircraft", label: "Platform Type", icon: Plane },
    { id: "endUser",  label: "Application Type", icon: Wrench },
    { id: "region",   label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Application Type",
    equipment: "",
    application: "",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:  { dataKey: "endUser",      title: "Application Type" },
    aircraft: { dataKey: "aircraftType", title: "Platform Type" },
    region:   { dataKey: "region",       title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/actuation-mro",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "aircraft-mro",
    dashboardId: "actuation-mro",
    dashboardName: "Actuation MRO",
    purchased: true,
    datasetName: "Aircraft MRO",
  },
} as const;
