# Plan — In-app PDF viewer + "View Full Report" button (with future per-dashboard tier gating)

## Goal
Add an opt-in **View Full Report** button to selected dashboards. Clicking it opens a new tab in our own PDF viewer (not the browser's native viewer). Other dashboards remain untouched. First rollout: **Traffic Marking Solutions** with proxy `https://lens.stratviewresearch.com/reactadmin/web/proxy/57`.

The viewer is built so that **later**, when the backend starts returning a per-dashboard `tier` (`enterprise` | `individual` | nothing), it can flip on a Download button for enterprise users only — with zero structural changes.

## Tier gating model (designed now, enforced later)

Source of truth: the existing subscription/access object the backend already returns per dashboard for the logged-in user. Your dev will add an optional field, e.g.:

```jsonc
// existing subscription entry per dashboard
{ "dashboardId": "traffic-marking-solutions", "purchased": true, "tier": "enterprise" }
```

Rules inside `PdfViewer.tsx`:
- `tier === "enterprise"` → show **Download** button (saves the already-fetched blob).
- `tier === "individual"` → show **Download (Upgrade)** button that opens an upgrade CTA/inquiry dialog.
- `tier` missing / unknown / not yet implemented → **view-only**, no download UI. (Safe default — current state of the world.)

Frontend reads `tier` from the Redux subscription slice (already loaded on app start via `fetchSubscriptions`). No new API call required now. When backend ships the field, the UI lights up automatically.

## Answer: yes, future enterprise download is possible
Because:
1. The PDF is streamed through our viewer as a `Blob` via `apiService` (auth headers attached).
2. We fully own the toolbar — no browser-native download/print.
3. Adding a Download button is a one-line conditional based on the tier lookup that already lives in Redux.
4. The proxy URL itself is never exposed to the user (we hand them an internal viewer route), so there's no "right-click → save" leak via the URL.

## Scope (this iteration)
1. New page `src/pages/PdfViewer.tsx` (view-only toolbar; tier-aware download slot prewired but inactive until backend ships `tier`).
2. New route `/viewer/pdf?src=<proxyUrl>&dashboardId=<id>&title=<...>` (behind `AuthGuard`).
3. New shared component `src/components/ViewFullReportButton.tsx`.
4. Config-driven: dashboards that set `reportPdfUrl` in their `config.ts` get the button; others don't.
5. Wire into **Traffic Marking Solutions** in the same row as the existing "Back to Traffic Marking Solutions" button.

## Technical details

### PDF viewer page (`src/pages/PdfViewer.tsx`)
- Library: `react-pdf` (PDF.js under the hood). Standard, themable, lets us hide the browser toolbar entirely.
- Flow:
  1. Read `src`, `dashboardId`, `title` from query string.
  2. `apiService` GET `src` with `responseType: 'blob'` so the existing auth token is sent.
  3. Convert blob → object URL → `<Document file={objectUrl}>`.
  4. Revoke object URL on unmount.
- Custom top toolbar (themed with our semantic tokens):
  - Title (left), page nav (Prev / `n of N` / Next), zoom (− / % / +), fit-to-width, close-tab (right).
  - **Download slot** (right edge): rendered based on tier lookup:
    - `enterprise` → enabled "Download PDF" button (saves blob via anchor + `revokeObjectURL`).
    - `individual` → "Download" button that opens upgrade dialog.
    - unknown/missing → slot renders nothing.
- Disable right-click context menu on the canvas (discourages casual "Save image as").
- Loading skeleton, error state with Retry, mobile-responsive.

Realistic caveat: no web viewer can stop a determined user from grabbing a fetched blob via devtools. The product intent here is "no visible download affordance", which this delivers.

### Tier lookup helper (`src/lib/subscriptionTier.ts`)
Tiny pure function used by the viewer:
```ts
export type Tier = "enterprise" | "individual" | "unknown";
export const getDashboardTier = (subs: any[], dashboardId: string): Tier => {
  const s = subs?.find(x => x.dashboardId === dashboardId);
  if (s?.tier === "enterprise") return "enterprise";
  if (s?.tier === "individual") return "individual";
  return "unknown";
};
```
Reads from `state.subscriptions` Redux slice already populated on login.

### Button component (`src/components/ViewFullReportButton.tsx`)
- Props: `pdfUrl: string`, `dashboardId: string`, `title?: string`.
- Renders a themed `Button` (matching the row's existing style) with a `FileText` lucide icon and label "View Full Report".
- On click: opens
  `/viewer/pdf?src=<enc>&dashboardId=<enc>&title=<enc>` in a new tab via `window.open(..., '_blank', 'noopener,noreferrer')`.

### Config opt-in pattern
Per dashboard (optional fields):
```ts
reportPdfUrl?: string;   // proxy URL returning a PDF
reportTitle?: string;     // optional viewer tab title (defaults to config.title)
```
For Traffic Marking Solutions: set/confirm `reportPdfUrl = "https://lens.stratviewresearch.com/reactadmin/web/proxy/57"`.

In `traffic-marking-solutions/Dashboard.tsx`, replace the current single-button row with:
```tsx
<div className="mb-4 flex items-center justify-between gap-2">
  <Button variant="ghost" onClick={() => navigate(config.backPath)}>
    <ArrowLeft className="mr-2 h-4 w-4" /> {config.backLabel}
  </Button>
  {config.reportPdfUrl && (
    <ViewFullReportButton
      pdfUrl={config.reportPdfUrl}
      dashboardId={config.catalog.dashboardId}
      title={config.title}
    />
  )}
</div>
```
Other dashboards untouched — they continue to work exactly as today. To enable on any future dashboard, set `reportPdfUrl` in its config and add the same 5-line button block.

### Route registration (`src/App.tsx`)
Add above the catch-all:
```tsx
<Route path="/viewer/pdf" element={<AuthGuard><PdfViewer /></AuthGuard>} />
```

### Dependency
Add `react-pdf` via `bun add react-pdf` (pulls `pdfjs-dist`).

## Files changed
- **New** `src/pages/PdfViewer.tsx`
- **New** `src/components/ViewFullReportButton.tsx`
- **New** `src/lib/subscriptionTier.ts`
- **Edit** `src/App.tsx` — register `/viewer/pdf` route
- **Edit** `src/dashboards/traffic-marking-solutions/config.ts` — set `reportPdfUrl` to proxy/57
- **Edit** `src/dashboards/traffic-marking-solutions/Dashboard.tsx` — render button in the back-button row
- **Edit** `package.json` — add `react-pdf`

## Out of scope (handled cleanly later, no rework)
- Backend adds `tier` field on subscriptions and admin-panel UI to set it.
- Enabling the Download button for enterprise + Upgrade dialog for individual — both already wired as dormant code paths in `PdfViewer.tsx`.

Ready to implement on approval.
