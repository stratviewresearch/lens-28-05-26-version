
## Goal
Replace the plain spinner shown while the PDF loads with a progress indicator that shows the actual download % (and a secondary "rendering" stage), so the user gets feedback during long loads.

## Where
Single file: `src/pages/PdfViewer.tsx`.

## What changes

1. **Track download progress** in `loadPdf()`:
   - Instead of `await res.blob()`, read the response via `res.body.getReader()`.
   - Use the `Content-Length` header to compute `loadedBytes / totalBytes` as chunks arrive.
   - Store a new `downloadProgress` state (0–100). Fall back to indeterminate mode if `Content-Length` is missing (some servers omit it for gzipped responses).
   - Assemble chunks into a `Blob` at the end (same as today) so nothing downstream changes.

2. **Track render progress** for the PDF document itself:
   - Add `renderProgress` state.
   - Pass `onLoadProgress={({ loaded, total }) => setRenderProgress(...)}` on `<Document>` so we show progress while react-pdf parses the file.

3. **New loader UI** (replaces the current centered `Loader2` spinner):
   - Centered card with:
     - Title: "Loading report…" (or "Preparing pages…" once download is done and rendering starts).
     - A `<Progress>` bar (`@/components/ui/progress`, already in the project) showing the active stage's %.
     - A small caption: `42% • 1.2 MB / 2.8 MB` during download, `Rendering…` during parse.
   - When `Content-Length` is unknown, show an indeterminate animated bar (small CSS animation on the existing `Progress` track) plus the spinner, with the text "Loading report…".
   - Keep theming via existing semantic tokens (`bg-card`, `text-muted-foreground`, etc.). No new colors.

4. **State lifecycle**:
   - Reset `downloadProgress` and `renderProgress` to 0 at the start of `loadPdf()`.
   - Hide the loader once `onLoadSuccess` fires (existing flow), same as today.
   - Error path is unchanged.

## Out of scope
- No changes to toolbar, navigation, zoom, fit logic, download/upgrade behavior, keyboard/touch handlers, or any other file.
- No new dependencies — `Progress` and `Loader2` already exist.

## Technical notes
- Byte formatting: small inline helper `formatBytes(n)` returning `"1.2 MB"` style.
- `apiService.get` already returns a `Response`, so `res.body` streaming works without changes to `apiService`.
