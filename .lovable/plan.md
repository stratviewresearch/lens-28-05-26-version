In `src/pages/PdfViewer.tsx`, replace the fit-width calculation on the `<Page>` component:

```tsx
width={fitWidth && containerWidth ? containerWidth - 32 : undefined}
```

This removes the 1100px cap so "Fit" actually fits the available container width on laptop screens, and uses a small 32px horizontal margin for breathing room. Manual zoom is unchanged.

Single-file edit, no other changes.