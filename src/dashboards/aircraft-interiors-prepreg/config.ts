/**
 * DASHBOARD CONFIGURATION — Aircraft Interiors Prepreg Market
 */

import { BarChart3, Globe, FlaskConical, Layers, Factory, ShoppingCart, Atom, Box } from "lucide-react";

export type TabType = "overview" | "panelType" | "resinType" | "fiberType" | "formType" | "region" | "oem" | "salesChannel";
export type UnitMode = "value" | "volume";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/15",
  title: "Global Aircraft Interiors Prepreg Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: new Date().getFullYear(),
  useMillions: true,

  footerText: "Aircraft Interiors Prepreg Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  unitModes: {
    value: { label: "US$ Million", suffix: "M", footerUnit: "All values in US$ Million unless otherwise specified" },
    volume: { label: "Million Lbs", suffix: "M Lbs", footerUnit: "All values in Million Lbs unless otherwise specified" },
  } as Record<UnitMode, { label: string; suffix: string; footerUnit: string }>,

  backPath: "/dataset/prepregs",
  backLabel: "Back to Prepreg",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "panelType", label: "Panel Type", icon: Layers },
    { id: "resinType", label: "Resin Type", icon: FlaskConical },
    { id: "fiberType", label: "Fiber Type", icon: Atom },
    { id: "formType", label: "Form Type", icon: Box },
    { id: "region", label: "Region", icon: Globe },
    { id: "oem", label: "OEM", icon: Factory },
    { id: "salesChannel", label: "Sales Channel", icon: ShoppingCart },
  ] as TabConfig[],

  labels: {
    panelType: "Panel Type",
    resinType: "Resin Type",
    fiberType: "Fiber Type",
    formType: "Form Type",
    oem: "OEM",
    salesChannel: "Sales Channel",
  },

  segmentMapping: {
    panelType:     { dataKey: "endUser",             title: "Panel Type" },
    resinType:     { dataKey: "materialType",        title: "Resin Type" },
    fiberType:     { dataKey: "furnishedEquipment",  title: "Fiber Type" },
    formType:      { dataKey: "application",         title: "Form Type" },
    region:        { dataKey: "region",              title: "Region" },
    oem:           { dataKey: "processType",         title: "OEM" },
    salesChannel:  { dataKey: "aircraftType",        title: "Sales Channel" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/aircraft-interiors-prepreg",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "aircraft-interiors-prepreg",
    dashboardName: "Aircraft Interiors Prepreg Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
