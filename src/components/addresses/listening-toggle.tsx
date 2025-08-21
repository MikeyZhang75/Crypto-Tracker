"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface ListeningToggleProps {
  address: Doc<"cryptoAddresses">;
}

export function ListeningToggle({ address }: ListeningToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toggleListening = useMutation(api.cryptoAddresses.toggleListening);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await toggleListening({
        id: address._id,
        isListening: checked,
      });
      toast.success(
        checked
          ? "Monitoring started - checking for new transactions every 5 seconds"
          : "Monitoring stopped",
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error(error.data.message || "Failed to toggle monitoring");
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to toggle monitoring",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Switch
      checked={address.isListening}
      onCheckedChange={handleToggle}
      disabled={isLoading}
      aria-label={`Toggle monitoring for ${address.address}`}
    />
  );
}
