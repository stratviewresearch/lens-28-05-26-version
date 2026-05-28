import { Layers, Plane, Car, Building2, MoreHorizontal } from "lucide-react";
import { dashboardRegistry } from "@/dashboards/registry";

/**
 * BACKEND INTEGRATION POINT: Dataset Categories & Purchase Status
 * 
 * Replace this static array with an API call. The API should return the same
 * structure but with `purchased` resolved per authenticated user at the DASHBOARD level.
 * 
 * Expected API: GET /api/datasets?user_id={userId}
 * Expected Response: Same structure as below, with `purchased: true/false` per dashboard
 * 
 * The `purchased` field on each dashboard controls:
 * - Dataset listing (DatasetList.tsx): Shows lock if NO dashboards are purchased
 * - Subscriptions (SubscriptionsSection.tsx): Shows dataset if ANY dashboard is purchased
 * - Detail page (DatasetDetail.tsx): Per-dashboard lock icon and access request
 * 
 * DASHBOARD AUTO-DISCOVERY:
 * Real dashboards are auto-registered from each dashboard's config.ts `catalog` field.
 * Only placeholder/future dashboards need to be listed here manually.
 */

// Icon lookup for auto-created categories
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Layers, Plane, Car, Building2, MoreHorizontal,
};

// ── Base category definitions ─────────────────────────────────
// Placeholder dashboards (no real dashboard folder) stay here.
// Real dashboards are auto-merged from the registry below.

const baseCategories = [
  {
    id: "composites",
    title: "Composites",
    icon: Layers,
    color: "teal" as const,
    description: "Advanced composite materials market research including carbon fiber, glass fiber, and polymer matrix composites.",
    datasets: [
      {
        id: "carbon-fiber",
        name: "Carbon Fiber Market",
        dashboards: [
          { id: "cf-global", name: "Global Carbon Fiber Market Overview", purchased: false },
          { id: "cf-aerospace", name: "Aerospace Carbon Fiber Applications", purchased: false },
          { id: "cf-automotive", name: "Automotive Carbon Fiber Trends", purchased: false },
        ],
      },
      {
        id: "glass-fiber",
        name: "Glass Fiber Composites",
        dashboards: [
          { id: "gf-market", name: "Glass Fiber Market Analysis", purchased: false },
          { id: "gf-construction", name: "Construction Applications", purchased: false },
        ],
      },
      {
        id: "polymer-matrix",
        name: "Polymer Matrix Composites",
        dashboards: [
          { id: "pmc-overview", name: "PMC Market Overview", purchased: false },
          { id: "pmc-industrial", name: "Industrial Applications", purchased: false },
          { id: "pmc-forecast", name: "Market Forecast 2025-2030", purchased: false },
        ],
      },
    ],
  },
  {
    id: "aerospace-defense",
    title: "Aerospace & Defense",
    icon: Plane,
    color: "navy" as const,
    description: "Comprehensive aerospace and defense market intelligence covering aircraft, satellites, defense systems, and more.",
    datasets: [
      {
        id: "aircraft-interiors",
        name: "Aircraft Interiors",
        dashboards: [] as { id: string; name: string; purchased: boolean }[],
      },
      {
        id: "commercial-aircraft",
        name: "Commercial Aircraft",
        dashboards: [
          { id: "ca-fleet", name: "Global Fleet Analysis", purchased: false },
          { id: "ca-deliveries", name: "Aircraft Deliveries Forecast", purchased: false },
          { id: "ca-oem", name: "OEM Market Share", purchased: false },
        ],
      },
      {
        id: "defense-systems",
        name: "Defense Systems",
        dashboards: [
          { id: "ds-spending", name: "Global Defense Spending", purchased: false },
          { id: "ds-uav", name: "UAV/Drone Market", purchased: false },
        ],
      },
    ],
  },
  {
    id: "automotive-transport",
    title: "Automotive & Transport",
    icon: Car,
    color: "mint" as const,
    description: "Automotive industry insights including electric vehicles, autonomous driving, and transportation trends.",
    datasets: [
      {
        id: "electric-vehicles",
        name: "Electric Vehicles",
        dashboards: [
          { id: "ev-global", name: "Global EV Market Overview", purchased: false },
          { id: "ev-battery", name: "EV Battery Market", purchased: false },
          { id: "ev-charging", name: "Charging Infrastructure", purchased: false },
        ],
      },
      {
        id: "autonomous-driving",
        name: "Autonomous Driving",
        dashboards: [
          { id: "ad-tech", name: "AD Technology Landscape", purchased: false },
          { id: "ad-sensors", name: "Sensor Market Analysis", purchased: false },
        ],
      },
      {
        id: "lightweighting",
        name: "Automotive Lightweighting",
        dashboards: [
          { id: "lw-materials", name: "Lightweight Materials Market", purchased: false },
          { id: "lw-trends", name: "OEM Lightweighting Strategies", purchased: false },
        ],
      },
    ],
  },
  {
    id: "building-construction",
    title: "Building & Construction",
    icon: Building2,
    color: "teal-dark" as const,
    description: "Construction industry market research covering materials, infrastructure, and building technologies.",
    datasets: [
      {
        id: "construction-composites",
        name: "Construction Composites",
        dashboards: [
          { id: "cc-rebar", name: "Composite Rebar Market", purchased: false },
          { id: "cc-panels", name: "FRP Panels Analysis", purchased: false },
        ],
      },
      {
        id: "smart-buildings",
        name: "Smart Buildings",
        dashboards: [
          { id: "sb-market", name: "Smart Building Market", purchased: false },
          { id: "sb-hvac", name: "Smart HVAC Systems", purchased: false },
          { id: "sb-lighting", name: "Smart Lighting Solutions", purchased: false },
        ],
      },
    ],
  },
  {
    id: "prepregs",
    title: "Prepregs",
    icon: Layers,
    color: "teal" as const,
    description: "Prepreg materials market research covering thermoplastic and thermoset prepregs across industries.",
    datasets: [
      {
        id: "prepregs",
        name: "Prepregs",
        dashboards: [] as { id: string; name: string; purchased: boolean }[],
      },
    ],
  },
  {
    id: "others",
    title: "Others",
    icon: MoreHorizontal,
    color: "teal" as const,
    description: "Additional market research datasets covering emerging industries and specialized sectors.",
    datasets: [
      {
        id: "wind-energy",
        name: "Wind Energy",
        dashboards: [
          { id: "we-turbines", name: "Wind Turbine Market", purchased: false },
          { id: "we-blades", name: "Blade Materials Analysis", purchased: false },
        ],
      },
      {
        id: "marine",
        name: "Marine & Offshore",
        dashboards: [
          { id: "mo-vessels", name: "Marine Vessels Market", purchased: false },
          { id: "mo-composites", name: "Marine Composites", purchased: false },
        ],
      },
      {
        id: "sports-leisure",
        name: "Sports & Leisure",
        dashboards: [
          { id: "sl-equipment", name: "Sports Equipment Market", purchased: false },
        ],
      },
    ],
  },
];

// ── Auto-merge discovered dashboards ──────────────────────────

function mergeRegisteredDashboards() {
  // Deep clone base categories
  const result = baseCategories.map(cat => ({
    ...cat,
    datasets: cat.datasets.map(ds => ({
      ...ds,
      dashboards: [...ds.dashboards],
    })),
  }));

  for (const entry of dashboardRegistry) {
    for (const cat of entry.catalogs) {
      const { categoryId, datasetId, dashboardId, dashboardName, purchased,
        categoryTitle, categoryColor, categoryDescription, datasetName } = cat;
      const name = dashboardName || entry.title;
      const isPurchased = purchased !== false;

      let category = result.find(c => c.id === categoryId);
      if (!category) {
        category = {
          id: categoryId,
          title: categoryTitle || categoryId,
          icon: MoreHorizontal,
          color: (categoryColor || "teal") as any,
          description: categoryDescription || "",
          datasets: [],
        };
        result.push(category);
      }

      let ds = category.datasets.find(d => d.id === datasetId);
      if (!ds) {
        ds = { id: datasetId, name: datasetName || datasetId, dashboards: [] };
        category.datasets.push(ds);
      }

      if (!ds.dashboards.find(d => d.id === dashboardId)) {
        ds.dashboards.push({ id: dashboardId, name, purchased: isPurchased });
      }
    }
  }

  return result;
}

export const categories = mergeRegisteredDashboards();
