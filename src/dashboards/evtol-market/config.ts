import { BarChart3, Users, Globe, Layers, Box } from "lucide-react";

export type TabType = "overview" | "endUser" | "aircraft" | "region" | "application" | "equipment" | "process" | "material";
export type UnitMode = "value" | "units";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/31",
  title: "Global eVTOL Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "eVTOL Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  backPath: "/dataset/evtols",
  backLabel: "Back to eVTOLs",

  /** Dual-mode support */
  unitModes: {
    value: { label: "US$ Million", suffix: "M", footerUnit: "All values in US$ Million unless otherwise specified" },
    units: { label: "Units", suffix: "", footerUnit: "All values in Units unless otherwise specified" },
  } as Record<UnitMode, { label: string; suffix: string; footerUnit: string }>,

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Configuration Type", icon: Users },
    { id: "region", label: "Region", icon: Globe },
    { id: "application", label: "Application Type", icon: Box },
    { id: "equipment", label: "Seating Capacity", icon: Layers },
  ] as TabConfig[],

  labels: {
    endUser: "Configuration Type",
    equipment: "Seating Capacity",
    application: "Application Type",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",            title: "Configuration Type" },
    region:       { dataKey: "region",             title: "Region" },
    application:  { dataKey: "application",        title: "Application Type" },
    equipment:    { dataKey: "furnishedEquipment", title: "Seating Capacity" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/evtol-market",
  catalog: {
    categoryId: "aerospace-defense",
    datasetId: "evtols",
    dashboardId: "evtol-market",
    dashboardName: "eVTOL Market",
    purchased: true,
    datasetName: "eVTOLs",
  },
} as const;
