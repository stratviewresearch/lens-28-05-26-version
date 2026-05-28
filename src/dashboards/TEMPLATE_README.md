# How to Create a New Dashboard

## Steps

1. **Copy an existing dashboard folder**
   ```
   cp -r src/dashboards/thermoplastic-prepreg src/dashboards/your-new-dashboard
   ```

2. **Edit `config.ts`** — This is the ONLY file you need to change:
   - `dataUrl` → path to your JSON file in `/public/data/`
   - `title`, `subtitle` → dashboard header text
   - `defaultYear` → initial year selected in the picker
   - `useMillions` → `true` for US$ M, `false` for US$ B
   - `tabs` → which tabs to show (add/remove as needed)
   - `labels` → custom names for segment categories
   - `segmentMapping` → maps each tab to a `MarketData` field
   - `backPath`, `backLabel` → back button navigation
   - `footerText`, `footerUnit` → footer content
    - **`routePath`** → URL path (e.g., `/dashboard/your-market`)
    - **`catalog`** → auto-registers into the dataset catalog. Can be a **single object** or an **array** (to appear in multiple datasets):
      - `categoryId` → which category it belongs to (e.g., `"aerospace-defense"`)
      - `datasetId` → which dataset within the category (e.g., `"aircraft-interiors"`)
      - `dashboardId` → unique ID for this dashboard (e.g., `"ai-your-market"`)
      - `dashboardName` → display name (optional, defaults to `title`)
      - `purchased` → access status (optional, defaults to `true`)

    **Multi-dataset example** (dashboard appears in two datasets):
    ```ts
    catalog: [
      { categoryId: "aerospace-defense", datasetId: "aircraft-interiors", dashboardId: "ai-cabin-composites" },
      { categoryId: "composites", datasetId: "composites-main", dashboardId: "comp-cabin-composites",
        datasetName: "Composites Main" },
    ],
    ```

3. **Add your JSON data file** to `/public/data/your-market.json`
   - Must follow the compact schema (see `data.ts` types)

4. **Done!** No other files need editing. The dashboard is auto-discovered via:
   - `registry.ts` → scans all dashboard folders at build time
   - `App.tsx` → routes are auto-registered
   - `dashboardRoutes.ts` → route map is auto-generated
   - `datasets.ts` → catalog entries are auto-merged

## For a NEW Category or Dataset

If your dashboard belongs to a category/dataset that doesn't exist yet,
add these optional fields to the `catalog` object in `config.ts`:

```ts
catalog: {
  categoryId: "new-category",
  categoryTitle: "New Category",       // Display title
  categoryColor: "teal",               // "teal" | "navy" | "mint" | "teal-dark"
  categoryDescription: "Description",  // Shown on category card
  datasetId: "new-dataset",
  datasetName: "New Dataset",          // Display name
  dashboardId: "nc-main",
},
```

## File Structure

```
src/dashboards/your-new-dashboard/
  config.ts              ← EDIT THIS (all settings + routing + catalog)
  Dashboard.tsx           ← Main page (reads config, no changes needed)
  data.ts                 ← Types + hooks (no changes needed)
  layout.tsx              ← Header, nav, skeleton (no changes needed)
  ui-helpers.tsx           ← KPI cards, counters (no changes needed)
  charts.tsx              ← All chart components (no changes needed)
  MarketOverviewTab.tsx   ← Overview tab (no changes needed)
  SegmentDetailTab.tsx    ← Segment tabs (no changes needed)
```

## Available Tab Types

`overview`, `endUser`, `aircraft`, `region`, `application`, `equipment`, `process`, `material`

## Available Segment Data Keys

`endUser`, `aircraftType`, `region`, `application`, `furnishedEquipment`, `processType`, `materialType`
