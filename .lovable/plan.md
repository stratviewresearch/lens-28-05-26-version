## Plan

Update `src/pages/PdfViewer.tsx` only.

### What will change
- Remove all byte-based text like `0 B`, `KB`, or `MB` from the loading UI.
- Show percentage-only loading text, e.g. `18% loaded` and `72% rendered`.
- If the browser/API does not provide real-time download progress, use a smooth simulated loading percentage so the UI never appears stuck at 0.
- Cap simulated loading below completion while the PDF is still loading, then move to rendering/preparing once the blob is ready.
- Keep the existing real progress path when `Content-Length` and stream chunks are available.
- Keep the current rendering stage, but ensure the loader feels active even if render progress completes immediately.

### Technical details
- Add a small state value for fallback/perceived loading progress.
- Drive that fallback with a timed effect while `loading` is true and real `downloadPct` is unavailable or stuck.
- Use the displayed percentage as:
  - real download percentage when it is available and moving,
  - otherwise perceived fallback percentage,
  - render percentage during the render stage.
- Remove `formatBytes()` and all byte captions from the loader.
- No backend/API changes and no other files changed.