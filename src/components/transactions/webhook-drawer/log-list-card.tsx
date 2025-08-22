"use client";

import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface LogListCardProps {
  log: Doc<"webhookLogs">;
  isSelected: boolean;
  onClick: () => void;
}

export function LogListCard({ log, isSelected, onClick }: LogListCardProps) {
  const sentDate = new Date(log.sentAt);

  const statusConfig = {
    success: {
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      icon: <IconCheck className="h-4 w-4" />,
      pulse: false,
    },
    failed: {
      color: "text-red-500",
      bg: "bg-red-500/10",
      icon: <IconX className="h-4 w-4" />,
      pulse: false,
    },
    pending: {
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      icon: <IconLoader2 className="h-4 w-4 animate-spin" />,
      pulse: true,
    },
  }[log.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl p-4 text-left transition-all duration-300",
        "backdrop-blur-md bg-background/30 border",
        "hover:bg-background/50 hover:shadow-sm hover:border-primary/20",
        isSelected
          ? "bg-background/60 shadow-sm border-primary/30"
          : "border-border/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "rounded-lg p-2 inline-flex items-center justify-center",
              statusConfig.bg,
              statusConfig.pulse && "animate-pulse",
            )}
          >
            <span className={statusConfig.color}>{statusConfig.icon}</span>
          </div>
          <div>
            <p className="text-sm font-semibold capitalize">{log.status}</p>
            <p className="text-xs text-muted-foreground">
              Attempt #{log.attemptNumber}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium text-muted-foreground">
            {sentDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </button>
  );
}
