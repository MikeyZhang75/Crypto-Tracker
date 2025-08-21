"use client";

import { IconDots, IconTrash } from "@tabler/icons-react";
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
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <IconTrash className="h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
