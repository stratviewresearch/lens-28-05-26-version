# Stratview Lens — Backend Integration Guide

## Overview

This is a static React SPA (Vite + React + TypeScript + Tailwind CSS).  
All data is currently served from static JSON files. Authentication and form submissions are simulated with `setTimeout`.

Search the codebase for `BACKEND INTEGRATION POINT` to find every placeholder that needs wiring up.

---

## 1. Authentication

### Login — `src/components/LoginForm.tsx`

```
POST /api/auth/login
Body: { email, password, rememberMe }
Response: { token, user }
```

Currently navigates to `/dashboard` after a simulated delay.

### Registration — `src/pages/SignUp.tsx`

```
POST /api/auth/register
Body: { name, company, designation, phone, email, password, industries[] }
Response: { token, user }
```

### Forgot Password — `src/pages/ForgotPassword.tsx`

```
POST /api/auth/forgot-password
Body: { email }
Response: { success: true }
```

---

## 2. Dataset Catalog — `src/data/datasets.ts`

Replace the static `categories` array with an API call.  
The `purchased` field should be resolved per authenticated user.

```
GET /api/datasets?user_id={userId}
Response: Same structure as categories[]
```

---

## 3. Access Request Form — `src/components/AccessRequestDialog.tsx`

```
POST /api/access-requests
Body: { name, designation, company, email, mobile, datasetName }
Response: { success: true }
```

---

## 4. Market Data (Dashboards) — `src/hooks/useMarketData.ts`

Each dashboard fetches its data from a static JSON file in `/public/data/`.  
Replace `fetch(dataUrl)` with your API endpoint.

```
GET /api/market-data/{market-slug}
Response: Same compact JSON structure (see any file in public/data/)
```

### Data files → Dashboard mapping:

| JSON File                                                     | Dashboard Route                                   | Page Component                        |
| ------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| `global-aircraft-interiors-market.json`                       | `/dashboard/aircraft-interiors`                   | `AircraftInteriorsDashboard`          |
| `aircraft-cabin-interior-composites-market.json`              | `/dashboard/cabin-composites`                     | `CabinCompositesDashboard`            |
| `aircraft-soft-goods-market.json`                             | `/dashboard/soft-goods`                           | `SoftGoodsDashboard`                  |
| `aircraft-water-waste-water-market.json`                      | `/dashboard/water-waste-water`                    | `WaterWasteWaterDashboard`            |
| `aircraft-galley-market.json`                                 | `/dashboard/galley-market`                        | `GalleyMarketDashboard`               |
| `aircraft-psu-market.json`                                    | `/dashboard/psu-market`                           | `PSUMarketDashboard`                  |
| `aircraft-lavatory-market.json`                               | `/dashboard/lavatory-market`                      | `LavatoryMarketDashboard`             |
| `aircraft-ohsb-market.json`                                   | `/dashboard/ohsb-market`                          | `OHSBMarketDashboard`                 |
| `aircraft-stowages-market.json`                               | `/dashboard/stowages-market`                      | `StowagesMarketDashboard`             |
| `aircraft-floor-panels-market.json`                           | `/dashboard/floor-panels-market`                  | `FloorPanelsMarketDashboard`          |
| `aircraft-cargo-liner-market.json`                            | `/dashboard/cargo-liner-market`                   | `CargoLinerMarketDashboard`           |
| `aircraft-cabin-lining-market.json`                           | `/dashboard/cabin-lining-market`                  | `CabinLiningMarketDashboard`          |
| `aircraft-cabin-interiors-market.json`                        | `/dashboard/cabin-interiors-market`               | `CabinInteriorsDashboard`             |
| `aircraft-interior-sandwich-panels-market.json`               | `/dashboard/sandwich-panels-market`               | `SandwichPanelsMarketDashboard`       |
| `aircraft-potted-inserts-market.json`                         | `/dashboard/potted-inserts-market`                | `PottedInsertsMarketDashboard`        |
| `aircraft-interior-non-sandwich-panel-composites-market.json` | `/dashboard/non-sandwich-panel-composites-market` | `NonSandwichPanelCompositesDashboard` |
| `aircraft-interiors-extrusion-market.json`                    | `/dashboard/extrusion-market`                     | `ExtrusionMarketDashboard`            |
| `aircraft-thermoformed-parts-market.json`                     | `/dashboard/thermoformed-parts-market`            | `ThermoformedPartsMarketDashboard`    |
| `aircraft-interiors-plastic-market.json`                      | `/dashboard/plastic-market`                       | `PlasticMarketDashboard`              |
| `aircraft-interiors-injection-molding-others-market.json`     | `/dashboard/injection-molding-market`             | `InjectionMoldingMarketDashboard`     |
| `aircraft-thermoformed-sheets-market.json`                    | `/dashboard/thermoformed-sheets-market`           | `ThermoformedSheetsMarketDashboard`   |
| `aircraft-seats-market.json`                                  | `/dashboard/seats-market`                         | `SeatsMarketDashboard`                |
| `aircraft-interior-lighting-market.json`                      | `/dashboard/lighting-market`                      | `LightingMarketDashboard`             |
| `aircraft-ifec-market.json`                                   | `/dashboard/ifec-market`                          | `IFECMarketDashboard`                 |

### Compact JSON format (required):

```json
{
  "years": [2016, 2017, ...],
  "totalMarket": [100, 110, ...],
  "endUser": { "OE": [...], "Aftermarket": [...] },
  "aircraftType": { "Narrow-Body Aircraft": [...], ... },
  "region": { "North America": [...], ... },
  "application": { "Segment A": [...], ... },
  "furnishedEquipment": { "BFE": [...], "SFE": [...] },
  "countryDataByRegion": { "North America": { "USA": [...], ... }, ... },
  "endUserByAircraftType": { "OE": { "Narrow-Body Aircraft": [...], ... }, ... },
  "endUserByRegion": { "OE": { "North America": [...], ... }, ... },
  "aircraftTypeByRegion": { "Narrow-Body Aircraft": { "North America": [...], ... }, ... },
  "applicationByRegion": { "Segment A": { "North America": [...], ... }, ... },
  "equipmentByRegion": { "BFE": { "North America": [...], ... }, ... }
}
```

All number arrays must have the same length as the `years` array.

---

## 5. SPA Routing (Server Config)

The app uses client-side routing. Your server must serve `index.html` for all non-file requests.

| Server                      | Config File                                         |
| --------------------------- | --------------------------------------------------- |
| Apache / cPanel             | `public/.htaccess`                                  |
| Netlify / Cloudflare        | `public/_redirects`                                 |
| IIS                         | `public/web.config`                                 |
| Static hosts (GitHub Pages) | `public/404.html` + `src/main.tsx` redirect handler |

---

## 6. Route Protection

Currently all routes are public. To add auth guards:

1. Create an `AuthProvider` context wrapping the app in `src/App.tsx`
2. Create a `ProtectedRoute` wrapper component
3. Wrap dashboard routes with `<ProtectedRoute>` to redirect unauthenticated users to `/`

---

## 7. Key Files

| File                                     | Purpose                                |
| ---------------------------------------- | -------------------------------------- |
| `src/App.tsx`                            | All route definitions                  |
| `src/data/datasets.ts`                   | Dataset catalog (replace with API)     |
| `src/hooks/useMarketData.ts`             | Data fetching hook (replace fetch URL) |
| `src/pages/DatasetDetail.tsx`            | Dashboard ID → route mapping           |
| `src/components/LoginForm.tsx`           | Login handler                          |
| `src/pages/SignUp.tsx`                   | Registration handler                   |
| `src/pages/ForgotPassword.tsx`           | Password reset handler                 |
| `src/components/AccessRequestDialog.tsx` | Access request form                    |
