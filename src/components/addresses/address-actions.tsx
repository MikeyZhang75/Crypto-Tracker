"use client";

import {
  IconDots,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useTranslation } from "@/i18n/use-translation";
import { EditAddressDialog } from "./edit-address-dialog";

interface AddressActionsProps {
  address: Doc<"addresses">;
}

export function AddressActions({ address }: AddressActionsProps) {
  const t = useTranslation();
  const removeAddress = useMutation(api.addresses.remove);
  const toggleListening = useMutation(api.addresses.toggleListening);
  const [editAddressDialogOpen, setEditAddressDialogOpen] = useState(false);
  const handleDelete = async () => {
    if (confirm(t.addresses.deleteConfirm)) {
      try {
        await removeAddress({ id: address._id });
        toast.success(t.addresses.addressDeleted);
      } catch (error) {
        if (error instanceof ConvexError) {
          toast.error(error.data.message || t.addresses.failedToDelete);
        } else {
          toast.error(
            error instanceof Error ? error.message : t.addresses.failedToDelete,
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
        address.isListening
          ? t.addresses.monitoringStopped
          : t.addresses.monitoringStarted,
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error(error.data.message || t.addresses.failedToToggleMonitoring);
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : t.addresses.failedToToggleMonitoring,
        );
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconDots className="h-4 w-4" />
          <span className="sr-only">{t.addresses.openMenu}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>{t.addresses.actions}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setEditAddressDialogOpen(true)}>
            <IconPencil className="size-4" />
            {t.addresses.edit}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleMonitoring}>
            {address.isListening ? (
              <>
                <IconPlayerPause className="size-4" />
                <span>{t.addresses.stop}</span>
              </>
            ) : (
              <>
                <IconPlayerPlay className="size-4" />
                <span>{t.addresses.start}</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <IconTrash className="h-4 w-4" />
          {t.addresses.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
      <EditAddressDialog
        address={address}
        open={editAddressDialogOpen}
        onOpenChange={setEditAddressDialogOpen}
      />
    </DropdownMenu>
  );
}
