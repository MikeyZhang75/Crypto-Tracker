"use client";

import {
  IconDots,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface AddressActionsProps {
  address: Doc<"addresses">;
}

export function AddressActions({ address }: AddressActionsProps) {
  const removeAddress = useMutation(api.addresses.remove);
  const toggleListening = useMutation(api.addresses.toggleListening);

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        await removeAddress({ id: address._id });
        toast.success("Address deleted successfully");
      } catch (error) {
        if (error instanceof ConvexError) {
          toast.error(error.data.message || "Failed to delete address");
        } else {
          toast.error(
            error instanceof Error ? error.message : "Failed to delete address",
          );
        }
      }
    }
  };

  const handleToggleMonitoring = async () => {
    try {
      await toggleListening({
        id: address._id,
        isListening: !address.isListening,
      });
      toast.success(
        address.isListening ? "Monitoring stopped" : "Monitoring started",
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
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconDots className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleToggleMonitoring}>
          {address.isListening ? (
            <>
              <IconPlayerPause className="size-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <IconPlayerPlay className="size-4" />
              <span>Start</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <IconTrash className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
