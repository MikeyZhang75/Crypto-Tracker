"use client";

import {
  IconChevronLeft,
  IconExternalLink,
  IconWebhook,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { JsonViewer } from "./json-viewer";

interface LogDetailsProps {
  webhookLogs: Doc<"webhookLogs">[] | undefined;
  selectedLog: string | null;
  onBack: () => void;
  isMobile: boolean;
}

export function LogDetails({
  webhookLogs,
  selectedLog,
  onBack,
  isMobile,
}: LogDetailsProps) {
  const getStatusColor = (status: Doc<"webhookLogs">["status"]) => {
    const colors = {
      success: "bg-emerald-500",
      failed: "bg-red-500",
      pending: "bg-yellow-500",
    };
    return colors[status];
  };

  if (!isMobile && !selectedLog) {
    return <NoSelectionState />;
  }

  if (!selectedLog) {
    return null;
  }

  const log = webhookLogs?.find((l) => l._id === selectedLog);
  if (!log) return null;

  const sentDate = new Date(log.sentAt);
  const formattedDate = sentDate.toLocaleString();

  return (
    <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/5">
      <ScrollArea className="h-full">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Mobile back button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-4 -ml-2"
            >
              <IconChevronLeft className="h-4 w-4" />
              Back to list
            </Button>
          )}

          {/* Status Header */}
          <StatusHeader 
            log={log} 
            formattedDate={formattedDate} 
            getStatusColor={getStatusColor}
          />

          {/* Webhook URL */}
          <WebhookUrlSection webhookUrl={log.webhookUrl} />

          {/* Error Message */}
          {log.errorMessage && <ErrorSection errorMessage={log.errorMessage} />}

          {/* Request Payload */}
          <JsonViewer
            title="Request Payload"
            content={log.requestPayload}
          />

          {/* Response Body */}
          {log.responseBody && (
            <JsonViewer
              title="Response Body"
              content={log.responseBody}
            />
          )}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}

function NoSelectionState() {
  return (
    <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/5">
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl bg-muted/20 p-5">
            <IconWebhook className="h-12 w-12 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <p className="text-base font-medium">No log selected</p>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Select a webhook attempt from the list to view detailed information
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusHeader({ 
  log, 
  formattedDate, 
  getStatusColor 
}: { 
  log: Doc<"webhookLogs">; 
  formattedDate: string;
  getStatusColor: (status: Doc<"webhookLogs">["status"]) => string;
}) {
  return (
    <div className="rounded-xl bg-muted/30 p-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant="outline"
          className="h-7 px-3 gap-2 text-sm"
        >
          <span
            className={cn(
              "size-2 rounded-full",
              getStatusColor(log.status),
            )}
            aria-hidden="true"
          />
          {log.statusCode
            ? `HTTP ${log.statusCode}`
            : log.status.toUpperCase()}
        </Badge>
        <Badge
          variant="secondary"
          className="h-7 px-3 font-mono text-sm"
        >
          Attempt #{log.attemptNumber}
        </Badge>
        <span className="text-sm text-muted-foreground ml-auto">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}

function WebhookUrlSection({ webhookUrl }: { webhookUrl: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <IconExternalLink className="h-4 w-4 text-muted-foreground" />
          Endpoint
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
          asChild
        >
          <a
            href={webhookUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconExternalLink className="h-3.5 w-3.5" />
            Open URL
          </a>
        </Button>
      </div>
      <div className="rounded-lg border bg-muted/20 px-4 py-3">
        <code className="text-xs font-mono text-foreground/80 break-all">
          {webhookUrl}
        </code>
      </div>
    </div>
  );
}

function ErrorSection({ errorMessage }: { errorMessage: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <IconX className="h-4 w-4 text-destructive" />
        <span className="text-destructive">
          Error Details
        </span>
      </h3>
      <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
        <code className="text-xs text-destructive break-words block leading-relaxed">
          {errorMessage}
        </code>
      </div>
    </div>
  );
}