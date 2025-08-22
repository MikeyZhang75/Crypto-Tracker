"use client";

import { IconLoader2, IconWebhook } from "@tabler/icons-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { LogListCard } from "./log-list-card";

interface LogListProps {
  webhookLogs: Doc<"webhookLogs">[] | undefined;
  selectedLog: string | null;
  onSelectLog: (logId: string) => void;
  isMobile: boolean;
}

export function LogList({ 
  webhookLogs, 
  selectedLog, 
  onSelectLog, 
  isMobile 
}: LogListProps) {
  return (
    <div
      className={cn(
        "bg-muted/50 backdrop-blur-sm",
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
            <LoadingState />
          ) : webhookLogs.length === 0 ? (
            <EmptyState />
          ) : (
            webhookLogs.map((log) => (
              <LogListCard
                key={log._id}
                log={log}
                isSelected={selectedLog === log._id}
                onClick={() => onSelectLog(log._id)}
              />
            ))
          )}
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <IconLoader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading logs...
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
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
  );
}