/**
 * DASHBOARD CONFIGURATION — Traffic Marking Solutions Market
 */

import { BarChart3, Layers, Globe, Map, Building2 } from "lucide-react";

export type TabType = "overview" | "productType" | "application" | "region" | "company";

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const config = {
  dataUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/36",
  title: "Global Traffic Marking Solutions Market",
  subtitle: "Global Market Research Dashboard",
  defaultYear: new Date().getFullYear() - 1,
  useMillions: true,

  footerText: "Traffic Marking Solutions Market Research Report",
  footerUnit: "All values in US$ Million unless otherwise specified",

  reportPdfUrl: "https://lens.stratviewresearch.com/reactadmin/web/proxy/38",
  reportFileName: "Traffic-Marking-Solutions-Market-Report.pdf",

  backPath: "/dataset/traffic-marking-solutions",
  backLabel: "Back to Traffic Marking Solutions",

  tabs: [
    { id: "overview", label: "Market Overview", icon: BarChart3 },
    { id: "productType", label: "Product Type", icon: Layers },
    { id: "application", label: "Application Type", icon: Map },
    { id: "region", label: "Region", icon: Globe },
    { id: "company", label: "Company Share", icon: Building2 },
  ] as TabConfig[],

  labels: {
    productType: "Product Type",
    application: "Application Type",
    region: "Region",
    company: "Company Share",
  },

  segmentMapping: {
    productType:  { dataKey: "productType",  title: "Product Type" },
    application:  { dataKey: "application",  title: "Application Type" },
    region:       { dataKey: "region",       title: "Region" },
  } as Record<string, { dataKey: string; title: string }>,

  routePath: "/dashboard/traffic-marking-solutions",
  catalog: {
    categoryId: "automotive-transport",
    datasetId: "traffic-marking-solutions",
    dashboardId: "traffic-marking-solutions",
    dashboardName: "Traffic Marking Solutions Market",
    purchased: true,
    datasetName: "Traffic Marking Solutions",
  },
} as const;
