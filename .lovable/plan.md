## Problem
In `src/components/ViewFullReportButton.tsx`, the `FileText` icon has `mr-2` class, but the parent `<Button>` already applies `gap-2` via its `buttonVariants` CVA. This creates double spacing (8px gap + 8px margin-right = 16px) between the icon and the "View Full Report" text, making the text appear shifted to the right.

## Fix
Remove the redundant `mr-2` class from the icon in `ViewFullReportButton.tsx`.

### File: `src/components/ViewFullReportButton.tsx`
Change:
```
<FileText className="mr-2 h-4 w-4" />
```
To:
```
<FileText className="h-4 w-4" />
```

This leaves `gap-2` on the Button as the single source of spacing between icon and text.