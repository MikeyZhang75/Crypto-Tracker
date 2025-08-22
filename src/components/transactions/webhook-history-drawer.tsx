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
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DrawerPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background shadow-2xl",
            isMobile
              ? "inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl"
              : "inset-y-0 right-0 h-full w-[900px]",
          )}
          // data-vaul-no-drag
        >
          {/* Mobile Handle */}
          {isMobile && (
            <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          )}

          {/* Header */}
          <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
                  <IconWebhook className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <DrawerPrimitive.Title className="text-xl font-semibold tracking-tight">
                    Webhook History
                  </DrawerPrimitive.Title>
                  <DrawerPrimitive.Description className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        {webhookLogs?.length || 0}
                      </span>
                      attempts
                    </span>
                    {webhookLogs && webhookLogs.length > 0 && (
                      <>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-xs">
                          {
                            webhookLogs.filter((l) => l.status === "success")
                              .length
                          }{" "}
                          successful
                        </span>
                      </>
                    )}
                  </DrawerPrimitive.Description>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ResendWebhookButton transactionId={transactionId} />
                <DrawerPrimitive.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-muted"
                  >
                    <IconX className="h-4 w-4" />
                  </Button>
                </DrawerPrimitive.Close>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Log List */}
            <div
              className={cn(
                "bg-muted/5 backdrop-blur-sm",
                isMobile
                  ? selectedLog
                    ? "hidden"
                    : "w-full"
                  : "w-[380px] flex-shrink-0 border-r border-border/50",
              )}
            >
              <ScrollArea className="h-full">
                <div className="p-5 space-y-3">
                  {webhookLogs === undefined ? (
                    <div className="flex h-40 items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Loading logs...
                        </span>
                      </div>
                    </div>
                  ) : webhookLogs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <div className="rounded-2xl bg-muted/50 p-4">
                        <IconWebhook className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-medium">
                          No webhook attempts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Webhook logs will appear here
                        </p>
                      </div>
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
                            "w-full rounded-xl p-4 text-left transition-all duration-200",
                            "hover:bg-background/80 hover:shadow-sm",
                            "focus:outline-none focus:ring-2 focus:ring-primary/20",
                            isSelected
                              ? "bg-background shadow-md ring-2 ring-primary/20"
                              : "bg-card/40 hover:bg-card/60",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2.5">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "h-6 px-2 gap-1.5 border",
                                    getStatusStyle(log.status).color,
                                  )}
                                >
                                  {getStatusStyle(log.status).icon}
                                  <span className="text-xs font-medium">
                                    {log.status.charAt(0).toUpperCase() +
                                      log.status.slice(1)}
                                  </span>
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">
                                  Attempt #{log.attemptNumber}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <IconClock className="h-3.5 w-3.5" />
                                <span>{relativeTime}</span>
                              </div>
                            </div>

                            <IconChevronRight
                              className={cn(
                                "h-4 w-4 text-muted-foreground/50 transition-transform duration-200 mt-1",
                                isSelected && "rotate-90 text-primary",
                              )}
                            />
                          </div>

                          {log.errorMessage && (
                            <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2">
                              <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                                {log.errorMessage}
                              </p>
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

            {/* Log Details */}
            {(!isMobile || selectedLog) && (
              <div className="flex-1 bg-gradient-to-br from-background via-background to-muted/5">
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
                        <div className="p-6 lg:p-8 space-y-6">
                          {/* Mobile back button */}
                          {isMobile && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(null)}
                              className="mb-4 -ml-2"
                            >
                              <IconChevronLeft className="h-4 w-4" />
                              Back to list
                            </Button>
                          )}

                          {/* Status Header */}
                          <div className="rounded-xl bg-muted/30 p-5 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge
                                variant="outline"
                                className="h-7 px-3 gap-2 text-sm"
                              >
                                <span
                                  className={cn(
                                    "size-2 rounded-full animate-pulse",
                                    getStatusStyle(log.status).status_color,
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

                          {/* Webhook URL */}
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
                                  href={log.webhookUrl}
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
                                {log.webhookUrl}
                              </code>
                            </div>
                          </div>

                          {/* Error Message */}
                          {log.errorMessage && (
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold flex items-center gap-2">
                                <IconX className="h-4 w-4 text-red-500" />
                                <span className="text-red-500">
                                  Error Details
                                </span>
                              </h3>
                              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                                <code className="text-xs text-red-600 dark:text-red-400 break-words block leading-relaxed">
                                  {log.errorMessage}
                                </code>
                              </div>
                            </div>
                          )}

                          {/* Request Payload */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold flex items-center gap-2">
                                <IconCode className="h-4 w-4 text-muted-foreground" />
                                Request Payload
                              </h3>
                              {copiedField === "request" ? (
                                <span className="inline-flex items-center h-8 px-3 text-xs gap-1.5 font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 rounded-md">
                                  <IconCheck className="h-3.5 w-3.5" />
                                  Copied!
                                </span>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleCopy(log.requestPayload, "request")
                                  }
                                  className="h-8 px-3 text-xs gap-1.5 transition-all"
                                >
                                  <IconCopy className="h-3.5 w-3.5" />
                                  Copy JSON
                                </Button>
                              )}
                            </div>
                            <div className="relative rounded-lg border bg-muted/10 overflow-hidden">
                              <ScrollArea className="max-h-80">
                                <div className="p-1">
                                  <JsonHighlight content={log.requestPayload} />
                                </div>
                                <ScrollBar orientation="vertical" />
                              </ScrollArea>
                            </div>
                          </div>

                          {/* Response Body */}
                          {log.responseBody && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                  <IconCode className="h-4 w-4 text-muted-foreground" />
                                  Response Body
                                </h3>
                                {copiedField === "response" ? (
                                  <span className="inline-flex items-center h-8 px-3 text-xs gap-1.5 font-medium text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 rounded-md">
                                    <IconCheck className="h-3.5 w-3.5" />
                                    Copied!
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleCopy(
                                        log.responseBody || "",
                                        "response",
                                      )
                                    }
                                    className="h-8 px-3 text-xs gap-1.5 transition-all"
                                  >
                                    <IconCopy className="h-3.5 w-3.5" />
                                    Copy JSON
                                  </Button>
                                )}
                              </div>
                              <div className="relative rounded-lg border bg-muted/10 overflow-hidden">
                                <ScrollArea className="max-h-80">
                                  <div className="p-1">
                                    <JsonHighlight content={log.responseBody} />
                                  </div>
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
                  <div className="flex h-full items-center justify-center p-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="rounded-2xl bg-muted/20 p-5">
                        <IconWebhook className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-medium">No log selected</p>
                        <p className="text-sm text-muted-foreground max-w-[250px]">
                          Select a webhook attempt from the list to view
                          detailed information
                        </p>
                      </div>
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
