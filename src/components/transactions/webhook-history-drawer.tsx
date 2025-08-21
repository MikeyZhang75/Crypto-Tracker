"use client";

import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCode,
  IconCopy,
  IconExternalLink,
  IconHistory,
  IconLoader2,
  IconWebhook,
  IconX,
} from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import Prism from "prismjs";
import { useState } from "react";
import "prismjs/components/prism-json";
import { Drawer as DrawerPrimitive } from "vaul";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ResendWebhookButton } from "./resend-webhook-button";

interface WebhookHistoryDrawerProps {
  transactionId: Id<"transactions">;
}

export function WebhookHistoryDrawer({
  transactionId,
}: WebhookHistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Fetch webhook logs when drawer opens
  const webhookLogs = useQuery(
    api.webhooks.getWebhookLogs,
    open ? { transactionId } : "skip",
  );

  const WEBHOOK_STATUS_STYLES: Record<
    Doc<"webhookLogs">["status"],
    { color: string; status_color: string; icon: React.ReactNode }
  > = {
    success: {
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      status_color: "bg-emerald-500",
      icon: <IconCheck className="h-3 w-3" />,
    },
    failed: {
      color: "text-red-500 bg-red-500/10 border-red-500/20",
      status_color: "bg-red-500",
      icon: <IconX className="h-3 w-3" />,
    },
    pending: {
      color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
      status_color: "bg-yellow-500",
      icon: (
        <IconLoader2 className="h-3 w-3 animate-[spin_2s_linear_infinite]" />
      ),
    },
  };

  const getStatusStyle = (status: Doc<"webhookLogs">["status"]) => {
    return WEBHOOK_STATUS_STYLES[status];
  };

  const formatJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(formatJson(text));
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Safe JSON highlighting component
  const JsonHighlight = ({ content }: { content: string }) => {
    const formatted = formatJson(content);
    const tokens = Prism.tokenize(formatted, Prism.languages.json);

    const renderToken = (
      token: string | Prism.Token,
      index: number,
    ): React.ReactNode => {
      if (typeof token === "string") {
        return token;
      }

      const tokenClass = Array.isArray(token.type) ? token.type[0] : token.type;
      const content = Array.isArray(token.content)
        ? token.content.map((t, i) => renderToken(t, i))
        : typeof token.content === "string"
          ? token.content
          : renderToken(token.content as Prism.Token, 0);

      const colorClassMap: Record<string, string> = {
        string: "text-green-700 dark:text-green-400",
        number: "text-blue-700 dark:text-blue-400",
        boolean: "text-amber-700 dark:text-amber-400",
        null: "text-gray-600 dark:text-gray-400",
        property: "text-purple-700 dark:text-purple-400",
        punctuation: "text-gray-600 dark:text-gray-500",
        operator: "text-gray-600 dark:text-gray-500",
      };

      const colorClasses = colorClassMap[tokenClass] || "";

      return (
        <span key={index} className={colorClasses}>
          {content}
        </span>
      );
    };

    return (
      <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-all">
        {tokens.map((token, index) => renderToken(token, index))}
      </pre>
    );
  };

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      direction={isMobile ? "bottom" : "right"}
    >
      <DrawerPrimitive.Trigger asChild>
        <Button variant="outline" size="sm">
          <IconHistory className="size-4" />
          View
        </Button>
      </DrawerPrimitive.Trigger>

      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background",
            isMobile
              ? "inset-x-0 bottom-0 h-[85vh] rounded-t-[10px] border-t"
              : "inset-y-0 right-0 h-full w-full max-w-4xl border-l",
          )}
        >
          {/* Handle bar for mobile */}
          {isMobile && (
            <div className="flex w-full justify-center py-4">
              <div className="h-2 w-[100px] shrink-0 rounded-full bg-muted" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <IconWebhook className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DrawerPrimitive.Title className="text-lg font-semibold">
                  Webhook History
                </DrawerPrimitive.Title>
                <DrawerPrimitive.Description className="text-sm text-muted-foreground">
                  {webhookLogs?.length || 0} total attempts
                </DrawerPrimitive.Description>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ResendWebhookButton transactionId={transactionId} />
              <DrawerPrimitive.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <IconX className="h-4 w-4" />
                </Button>
              </DrawerPrimitive.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden" data-vaul-no-drag>
            {/* Log List - hidden on mobile when a log is selected */}
            <div
              className={cn(
                "bg-muted/30",
                isMobile
                  ? selectedLog
                    ? "hidden"
                    : "w-full"
                  : "w-96 flex-shrink-0 border-r",
              )}
            >
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {webhookLogs === undefined ? (
                    <div className="flex h-32 items-center justify-center">
                      <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : webhookLogs.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <IconWebhook className="h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No webhook attempts yet
                      </p>
                    </div>
                  ) : (
                    webhookLogs.map((log) => {
                      const isSelected = selectedLog === log._id;
                      const sentDate = new Date(log.sentAt);
                      const relativeTime = formatDistanceToNow(sentDate, {
                        addSuffix: true,
                      });

                      return (
                        <button
                          key={log._id}
                          type="button"
                          onClick={() => setSelectedLog(log._id)}
                          className={cn(
                            "w-full rounded-lg border p-3 text-left transition-all hover:bg-background/50",
                            isSelected
                              ? "border-primary bg-background shadow-sm"
                              : "border-transparent bg-card/50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "h-5 px-1.5 text-xs font-medium",
                                    getStatusStyle(log.status).color,
                                  )}
                                >
                                  <span>{getStatusStyle(log.status).icon}</span>
                                  <span className="text-xs font-medium">
                                    {log.status.toUpperCase()}
                                  </span>
                                </Badge>
                                <span className="text-xs font-medium text-muted-foreground">
                                  #{log.attemptNumber}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IconClock className="h-3 w-3" />
                                <span>{relativeTime}</span>
                              </div>
                            </div>

                            {!isMobile && (
                              <IconChevronRight
                                className={cn(
                                  "h-4 w-4 text-muted-foreground transition-transform",
                                  isSelected && "rotate-90",
                                )}
                              />
                            )}
                          </div>

                          {log.errorMessage && (
                            <div className="text-xs text-red-500 line-clamp-2 pt-2">
                              {log.errorMessage}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>

            {/* Log Details - shown when selected on mobile, always visible on desktop */}
            {(!isMobile || selectedLog) && (
              <div className="flex-1 bg-background">
                {selectedLog ? (
                  <ScrollArea className="h-full">
                    {(() => {
                      const log = webhookLogs?.find(
                        (l) => l._id === selectedLog,
                      );
                      if (!log) return null;

                      const sentDate = new Date(log.sentAt);
                      const formattedDate = sentDate.toLocaleString();

                      return (
                        <div className="p-6 space-y-6">
                          {/* Mobile back button */}
                          {isMobile && (
                            <div className="pb-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(null)}
                              >
                                <IconChevronLeft className="h-4 w-4" />
                                Back to list
                              </Button>
                            </div>
                          )}

                          {/* Status Header */}
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Badge variant="outline" className="gap-1.5">
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    getStatusStyle(log.status).status_color,
                                  )}
                                  aria-hidden="true"
                                />
                                {log.statusCode && `${log.statusCode}`}
                              </Badge>
                              <Badge variant="outline" className="font-mono">
                                Attempt #{log.attemptNumber}
                              </Badge>
                            </div>

                            <div className="text-sm text-muted-foreground">
                              Sent on {formattedDate}
                            </div>
                          </div>

                          {/* Webhook URL */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium flex items-center gap-2">
                                <IconExternalLink className="h-4 w-4" />
                                Webhook URL
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                asChild
                              >
                                <a
                                  href={log.webhookUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <IconExternalLink className="h-3 w-3" />
                                  Open
                                </a>
                              </Button>
                            </div>
                            <code className="block rounded-md bg-muted px-3 py-2 text-xs font-mono break-all">
                              {log.webhookUrl}
                            </code>
                          </div>

                          {/* Error Message */}
                          {log.errorMessage && (
                            <div className="space-y-2">
                              <h3 className="text-sm font-medium text-red-500">
                                Error Message
                              </h3>
                              <div className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 overflow-hidden">
                                <code className="text-xs text-red-500 break-words block">
                                  {log.errorMessage}
                                </code>
                              </div>
                            </div>
                          )}

                          {/* Request Payload */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium flex items-center gap-2">
                                <IconCode className="h-4 w-4" />
                                Request Payload
                              </h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleCopy(log.requestPayload, "request")
                                }
                                className="h-7 px-2 text-xs"
                              >
                                {copiedField === "request" ? (
                                  <>
                                    <IconCheck className="h-3 w-3" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <IconCopy className="h-3 w-3" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="relative rounded-md bg-muted/50 border overflow-hidden">
                              <ScrollArea className="max-h-64 w-full">
                                <JsonHighlight content={log.requestPayload} />
                                <ScrollBar orientation="vertical" />
                              </ScrollArea>
                            </div>
                          </div>

                          {/* Response Body */}
                          {log.responseBody && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                  <IconCode className="h-4 w-4" />
                                  Response Body
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCopy(
                                      log.responseBody || "",
                                      "response",
                                    )
                                  }
                                  className="h-7 px-2 text-xs"
                                >
                                  {copiedField === "response" ? (
                                    <>
                                      <IconCheck className="h-3 w-3" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <IconCopy className="h-3 w-3" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="relative rounded-md bg-muted/50 border overflow-hidden">
                                <ScrollArea className="max-h-64 w-full">
                                  <JsonHighlight content={log.responseBody} />
                                  <ScrollBar orientation="vertical" />
                                </ScrollArea>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <IconWebhook className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">
                        Select a webhook attempt to view details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
