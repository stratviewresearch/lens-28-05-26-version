## Cause
I wrapped the `<Document>` container with `key={flipKey}` to add a fade on page change. Changing that key on every flip **remounts `<Document>`**, which reloads the PDF and fires `onLoadSuccess` again — that handler runs `setPageNum(1)`, snapping back to page 1. Arrow keys and spacebar trigger this same path, which is why both behave the same.

## Fix (single file: `src/pages/PdfViewer.tsx`)

1. Remove `key={flipKey}` from the Document wrapper, and drop the `flipKey` state plus the `setFlipKey` calls inside `goNext` / `goPrev`. No remount → no reload → no reset.
2. Keep a subtle page-change animation by putting `key={pageNum}` on the `<Page>` instead. Remounting just the Page is cheap and does not reload the PDF.
3. Make `onLoadSuccess` safe against any future re-renders: only reset `pageNum` to 1 when the document actually changes. Easiest path — move the `setPageNum(1)` out of `onLoadSuccess` and into the existing `useEffect([src])` that fetches the PDF.

## Acceptance
- Arrow keys, Space, PageUp/PageDown, swipe, and toolbar buttons all change the page and stay on the new page.
- PDF is fetched/loaded once per `src`.
- Page-change still has a light fade.
