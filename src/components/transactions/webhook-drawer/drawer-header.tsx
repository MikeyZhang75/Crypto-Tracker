"use client";

import { IconWebhook, IconX } from "@tabler/icons-react";
import { Drawer as DrawerPrimitive } from "vaul";
import { Button } from "@/components/ui/button";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ResendWebhookButton } from "../resend-webhook-button";

interface DrawerHeaderProps {
  webhookLogs: Doc<"webhookLogs">[] | undefined;
  transactionId: Id<"transactions">;
}

export function DrawerHeader({ webhookLogs, transactionId }: DrawerHeaderProps) {
  return (
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
            <DrawerPrimitive.Description className="text-sm text-muted-foreground">
              {webhookLogs && webhookLogs.length > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium">
                    {webhookLogs.filter((l) => l.status === "success").length}
                  </span>
                  <span>successful</span>
                </span>
              ) : (
                "No webhook attempts"
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
  );
}