"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  address: Doc<"cryptoAddresses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAddressDialog({
  address,
  open,
  onOpenChange,
}: EditAddressDialogProps) {
  const [label, setLabel] = useState(address.label || "");
  const updateAddress = useMutation(api.cryptoAddresses.update);

  // Update local state when address prop changes
  useEffect(() => {
    setLabel(address.label || "");
  }, [address.label]);

  const handleUpdate = async () => {
    try {
      await updateAddress({
        id: address._id,
        label: label || undefined,
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
            Update the label for this address
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
