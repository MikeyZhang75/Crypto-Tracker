"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface EditAddressDialogProps {
  address: Doc<"addresses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAddressDialog({
  address,
  open,
  onOpenChange,
}: EditAddressDialogProps) {
  const [label, setLabel] = useState(address.label || "");
  const [webhookUrl, setWebhookUrl] = useState(address.webhookUrl);
  const [webhookError, setWebhookError] = useState("");
  const [verificationCode, setVerificationCode] = useState(
    address.webhookVerificationCode,
  );
  const [regenerateCode, setRegenerateCode] = useState(false);
  const updateAddress = useMutation(api.addresses.update);

  // Update local state when address prop changes
  useEffect(() => {
    setLabel(address.label || "");
    setWebhookUrl(address.webhookUrl);
    setWebhookError("");
    setVerificationCode(address.webhookVerificationCode);
    setRegenerateCode(false);
  }, [address.label, address.webhookUrl, address.webhookVerificationCode]);

  const handleUpdate = async () => {
    // Validate webhook URL
    if (!webhookUrl) {
      setWebhookError("Webhook URL is required");
      return;
    }

    try {
      const url = new URL(webhookUrl);
      if (!url.protocol.startsWith("http")) {
        setWebhookError("Invalid URL format");
        return;
      }
    } catch {
      setWebhookError("Invalid URL format");
      return;
    }

    try {
      await updateAddress({
        id: address._id,
        label: label || undefined,
        webhookUrl: webhookUrl,
        webhookVerificationCode: regenerateCode
          ? ""
          : verificationCode !== address.webhookVerificationCode
            ? verificationCode
            : undefined,
      });
      toast.success("Address updated successfully");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error(error.data.message || "Failed to update address");
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to update address",
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Address</DialogTitle>
          <DialogDescription>
            Update the label and webhook URL for this address
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-label">Label</Label>
            <Input
              id="edit-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Main Wallet, Exchange"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-webhook">Webhook URL (Required)</Label>
            <Input
              id="edit-webhook"
              type="url"
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                setWebhookError("");
              }}
              placeholder="https://example.com/webhook"
              required
            />
            {webhookError ? (
              <p className="text-sm text-destructive">{webhookError}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Webhook URL to receive transaction notifications
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-verification">Verification Code</Label>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="regenerate-code"
                checked={regenerateCode}
                onCheckedChange={(checked) =>
                  setRegenerateCode(checked as boolean)
                }
              />
              <Label htmlFor="regenerate-code" className="text-sm font-normal">
                Generate new verification code
              </Label>
            </div>
            {!regenerateCode && (
              <Input
                id="edit-verification"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Verification code"
                className="font-mono"
              />
            )}
            <p className="text-sm text-muted-foreground">
              {regenerateCode
                ? "A new verification code will be generated"
                : "Code used to authenticate webhook requests"}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleUpdate}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
