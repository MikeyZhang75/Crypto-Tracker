"use client";

import { IconHistory } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DrawerHeader } from "./webhook-drawer/drawer-header";
import { LogDetails } from "./webhook-drawer/log-details";
import { LogList } from "./webhook-drawer/log-list";

interface WebhookHistoryDrawerProps {
  transactionId: Id<"transactions">;
}

export function WebhookHistoryDrawer({
  transactionId,
}: WebhookHistoryDrawerProps) {
  const [open, setOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Fetch webhook logs when drawer opens
  const webhookLogs = useQuery(
    api.webhooks.getWebhookLogs,
    open ? { transactionId } : "skip",
  );

  const handleSelectLog = (logId: string) => {
    setSelectedLog(logId);
  };

  const handleBack = () => {
    setSelectedLog(null);
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
        >
          {/* Mobile Handle */}
          {isMobile && (
            <div className="mx-auto my-3 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
          )}

          {/* Header */}
          <DrawerHeader
            webhookLogs={webhookLogs}
            transactionId={transactionId}
          />

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Log List */}
            <LogList
              webhookLogs={webhookLogs}
              selectedLog={selectedLog}
              onSelectLog={handleSelectLog}
              isMobile={isMobile}
            />

            {/* Log Details */}
            {(!isMobile || selectedLog) && (
              <LogDetails
                webhookLogs={webhookLogs}
                selectedLog={selectedLog}
                onBack={handleBack}
                isMobile={isMobile}
              />
            )}
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}
