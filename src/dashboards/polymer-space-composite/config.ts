/**
 * ============================================================
 * DASHBOARD CONFIGURATION — Polymer Space Composite Matrix Market
 * ============================================================
 */

import { BarChart3, Globe, Layers, Atom, Box, Rocket } from "lucide-react";
import sourceDataUrl from "./source-data.xlsx?url";

export type TabType = "overview" | "endUser" | "region" | "application" | "equipment" | "process";
export type UnitMode = "value" | "volume";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: sourceDataUrl,

  title: "Polymer Space Composite Matrix Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: 2026,
  useMillions: true,

  footerText: "Polymer Space Composite Matrix Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  unitModes: {
    value: { label: "US$ Million", suffix: "M", footerUnit: "All values in US$ Million unless otherwise specified" },
    volume: { label: "Million Lbs", suffix: "M Lbs", footerUnit: "All values in Million Lbs unless otherwise specified" },
  } as Record<UnitMode, { label: string; suffix: string; footerUnit: string }>,

  backPath: "/dataset/prepregs",
  backLabel: "Back to Prepreg",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "endUser", label: "Application Type", icon: Rocket },
    { id: "application", label: "Resin Type", icon: Atom },
    { id: "equipment", label: "Fiber Type", icon: Box },
    { id: "region", label: "Region", icon: Globe },
  ] as TabConfig[],

  labels: {
    endUser: "Application Type",
    equipment: "Fiber Type",
    application: "Resin Type",
    processType: "",
    materialType: "",
  },

  segmentMapping: {
    endUser:      { dataKey: "endUser",            title: "Application Type" },
    region:       { dataKey: "region",             title: "Region" },
    application:  { dataKey: "application",        title: "Resin Type" },
    equipment:    { dataKey: "furnishedEquipment", title: "Fiber Type" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/polymer-space-composite",
  catalog: {
    categoryId: "composites",
    datasetId: "prepregs",
    dashboardId: "polymer-space-composite",
    dashboardName: "Polymer Space Composite Matrix Market",
    purchased: true,
    datasetName: "Prepreg",
  },
} as const;
