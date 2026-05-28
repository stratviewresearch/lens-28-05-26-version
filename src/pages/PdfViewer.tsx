import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { getDashboardTier } from "@/lib/subscriptionTier";
import { apiService } from "@/lib/apiService";

// PDF.js worker — use the matching version from pdfjs-dist via Vite ?url
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const PdfViewer = () => {
  const [params] = useSearchParams();
  const src = params.get("src") || "";
  const dashboardSlug = params.get("dashboardSlug") || "";
  const title = params.get("title") || "Report";

  const subs = useAppSelector((s: any) => s?.subscriptions?.subscriptions);
  const tier = getDashboardTier(subs, dashboardSlug);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [fitWidth, setFitWidth] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Set the title of the new tab
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  // Fetch the PDF as a blob (with auth)
  const loadPdf = useCallback(async () => {
    if (!src) {
      setError("Missing PDF source");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.get(src);
      if (!res.ok) throw new Error(`Failed to load PDF (${res.status})`);
      const b = await res.blob();
      setBlob(b);
      const url = URL.createObjectURL(b);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (e: any) {
      setError(e?.message || "Unable to load PDF");
    } finally {
      setLoading(false);
    }
  }, [src]);

  useEffect(() => {
    loadPdf();
    return () => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Track container width for fit-to-width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fileProp = useMemo(() => (blobUrl ? { url: blobUrl } : null), [blobUrl]);

  const handleDownload = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9-_]+/gi, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const onContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const renderDownloadSlot = () => {
    if (tier === "enterprise") {
      return (
        <Button variant="default" size="sm" onClick={handleDownload} disabled={!blob}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      );
    }
    if (tier === "individual") {
      return (
        <Button variant="outline" size="sm" onClick={() => setShowUpgrade(true)}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 shadow-sm">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{title}</h1>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPageNum((p) => Math.max(1, p - 1))}
            disabled={pageNum <= 1 || !numPages}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[72px] text-center text-xs tabular-nums text-muted-foreground">
            {numPages ? `${pageNum} / ${numPages}` : "—"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPageNum((p) => Math.min(numPages || p, p + 1))}
            disabled={!numPages || pageNum >= numPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-5 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setFitWidth(false);
              setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)));
            }}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[48px] text-center text-xs tabular-nums text-muted-foreground">
            {fitWidth ? "Fit" : `${Math.round(scale * 100)}%`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setFitWidth(false);
              setScale((s) => Math.min(3, +(s + 0.1).toFixed(2)));
            }}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFitWidth((v) => !v)}
            aria-label="Fit to width"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <div className="mx-2 h-5 w-px bg-border" />

          {renderDownloadSlot()}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.close()}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/30"
        onContextMenu={onContextMenu}
      >
        {loading && (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !loading && (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={loadPdf} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {!loading && !error && fileProp && (
          <div className="flex justify-center py-6">
            <Document
              file={fileProp}
              onLoadSuccess={({ numPages: n }) => {
                setNumPages(n);
                setPageNum(1);
              }}
              onLoadError={(e) => setError(e?.message || "Failed to render PDF")}
              loading={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <Page
                pageNumber={pageNum}
                scale={fitWidth ? undefined : scale}
                width={fitWidth && containerWidth ? Math.min(containerWidth - 48, 1100) : undefined}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                className="shadow-lg"
              />
            </Document>
          </div>
        )}
      </div>

      {/* Upgrade modal — minimal inline implementation */}
      {showUpgrade && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowUpgrade(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-semibold">Upgrade to Enterprise</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Downloading the full report is available on the Enterprise tier. Please contact our
              team to upgrade your subscription for this dashboard.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowUpgrade(false)}>
                Close
              </Button>
              <Button size="sm" onClick={() => setShowUpgrade(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;