"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { templateLabel } from "@/components/students/template-selector";

export interface StudentRecordItem {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  periodType: string;
  periodLabel: string;
  recordType: string;
  source: string;
  generatedAt: string;
}

interface ReportPreviewProps {
  loading: boolean;
  selectedStudentName: string;
  grouped: Record<string, StudentRecordItem[]>;
  onRegenerate: (record: StudentRecordItem) => void;
  regeneratingId: string | null;
  previewRecordId?: string | null;
  onPreviewRecordHandled?: () => void;
}

function isDataPdfUrl(value: string) {
  return /^data:application\/pdf;base64,/i.test(value);
}

function isSupportedUrl(value: string) {
  return /^(https?:\/\/|\/|blob:)/i.test(value);
}

function toBlobUrl(value: string): string | null {
  if (!isDataPdfUrl(value)) return value;

  try {
    const [meta, base64] = value.split(",", 2);
    if (!meta || !base64) return null;

    const mime = meta.match(/^data:([^;]+);base64$/i)?.[1] ?? "application/pdf";
    const binary = window.atob(base64);
    const arrayBuffer = new ArrayBuffer(binary.length);
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([arrayBuffer], { type: mime });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export function ReportPreview({
  loading,
  selectedStudentName,
  grouped,
  onRegenerate,
  regeneratingId,
  previewRecordId = null,
  onPreviewRecordHandled,
}: ReportPreviewProps) {
  const [manualPreviewId, setManualPreviewId] = useState<string | null>(null);
  const groups = Object.entries(grouped);
  const recordById = useMemo(
    () =>
      Object.fromEntries(
        Object.values(grouped)
          .flat()
          .map((record) => [record.id, record]),
      ) as Record<string, StudentRecordItem>,
    [grouped],
  );

  const activePreviewId = manualPreviewId ?? previewRecordId ?? null;
  const previewRecord = activePreviewId ? recordById[activePreviewId] ?? null : null;
  const previewUrl = useMemo(() => {
    if (!previewRecord) return null;
    if (isDataPdfUrl(previewRecord.fileUrl)) {
      return toBlobUrl(previewRecord.fileUrl);
    }
    return isSupportedUrl(previewRecord.fileUrl) ? previewRecord.fileUrl : null;
  }, [previewRecord]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function openInNewTab(record: StudentRecordItem) {
    const resolved = isDataPdfUrl(record.fileUrl)
      ? toBlobUrl(record.fileUrl)
      : isSupportedUrl(record.fileUrl)
        ? record.fileUrl
        : null;
    if (!resolved) return;

    window.open(resolved, "_blank", "noopener,noreferrer");
    if (resolved.startsWith("blob:")) {
      window.setTimeout(() => URL.revokeObjectURL(resolved), 60_000);
    }
  }

  function downloadRecord(record: StudentRecordItem) {
    const resolved = isDataPdfUrl(record.fileUrl)
      ? toBlobUrl(record.fileUrl)
      : isSupportedUrl(record.fileUrl)
        ? record.fileUrl
        : null;
    if (!resolved) return;

    const link = document.createElement("a");
    link.href = resolved;
    link.download = record.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (resolved.startsWith("blob:")) {
      window.setTimeout(() => URL.revokeObjectURL(resolved), 5_000);
    }
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Generated Records</h2>
        {selectedStudentName ? <p className="text-sm text-muted-foreground">{selectedStudentName}</p> : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading records...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No records generated yet.</p>
      ) : (
        <div className="space-y-4">
          {groups.map(([groupKey, items]) => (
            <div key={groupKey} className="rounded-xl border border-border/80 bg-muted/10 p-3">
              <p className="mb-3 text-sm font-semibold">{groupKey.replace(":", " - ")}</p>
              <div className="space-y-2">
                {items.map((record) => (
                  <div key={record.id} className="flex flex-col gap-2 rounded-lg border border-border/70 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{record.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {templateLabel(record.recordType)} · {new Date(record.generatedAt).toLocaleString()}
                      </p>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {record.source}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setManualPreviewId(record.id);
                          onPreviewRecordHandled?.();
                        }}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> Preview
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => downloadRecord(record)}
                        disabled={!isDataPdfUrl(record.fileUrl) && !isSupportedUrl(record.fileUrl)}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> Download
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onRegenerate(record)}
                        disabled={regeneratingId === record.id}
                      >
                        <RefreshCw className={`mr-1 h-3.5 w-3.5 ${regeneratingId === record.id ? "animate-spin" : ""}`} />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(previewRecord)}
        onOpenChange={(open) => {
          if (open) return;
          if (manualPreviewId) {
            setManualPreviewId(null);
            return;
          }
          onPreviewRecordHandled?.();
        }}
      >
        <DialogContent className="w-[min(96vw,74rem)] max-w-6xl p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>{previewRecord?.title ?? "Record Preview"}</DialogTitle>
            <DialogDescription>
              {previewRecord ? `${templateLabel(previewRecord.recordType)} · ${new Date(previewRecord.generatedAt).toLocaleString()}` : ""}
            </DialogDescription>
          </DialogHeader>

          {previewRecord ? (
            <div className="space-y-3">
              <div className="h-[72svh] overflow-hidden rounded-xl border border-border bg-muted/15">
                {previewUrl ? (
                  <object
                    data={previewUrl}
                    type="application/pdf"
                    className="h-full w-full"
                  >
                    <iframe
                      title={`${previewRecord.title} Preview`}
                      src={previewUrl}
                      className="h-full w-full"
                    />
                  </object>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                    Unable to render preview. Use open/download below.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openInNewTab(previewRecord)}
                  className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  Open in new tab
                </button>
                <Button type="button" size="sm" onClick={() => downloadRecord(previewRecord)}>
                  <Download className="mr-1 h-3.5 w-3.5" /> Download
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
