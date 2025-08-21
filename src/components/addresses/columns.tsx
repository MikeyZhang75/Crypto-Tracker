"use client";

import { IconExternalLink } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@web3icons/react";
import Link from "next/link";
import { CopyableText } from "@/components/custom-ui/copyable-text";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AddressActions } from "./address-actions";

export const columns: ColumnDef<Doc<"addresses">>[] = [
  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => <span>{row.original.label}</span>,
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.original.address;
      return (
        <CopyableText
          text={address}
          label="Click to copy address"
          toastMessages={{
            success: "Address copied to clipboard",
            error: "Failed to copy address",
          }}
        />
      );
    },
  },
  {
    accessorKey: "cryptoType",
    header: "Coin",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          <TokenIcon
            symbol={row.original.cryptoType}
            variant="branded"
            size={16}
          />
          <span>{row.original.cryptoType}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "isListening",
    header: "Monitoring",
    cell: ({ row }) => {
      const isListening = row.original.isListening;
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 ${isListening ? "" : "opacity-50"}`}
        >
          <span
            className={`size-1.5 rounded-full ${
              isListening ? "bg-emerald-500" : "bg-gray-400"
            }`}
            aria-hidden="true"
          />
          {isListening ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "webhookUrl",
    header: "Webhook URL",
    cell: ({ row }) => {
      const webhookUrl = row.original.webhookUrl;
      return (
        <CopyableText
          text={webhookUrl}
          label="Click to copy webhook URL"
          toastMessages={{
            success: "Webhook URL copied to clipboard",
            error: "Failed to copy webhook URL",
          }}
        />
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 justify-end">
        <Link
          href={`/addresses/${encodeURIComponent(row.original.address)}/transactions`}
        >
          <Button variant="outline" size="sm">
            <IconExternalLink className="h-4 w-4" />
            View
          </Button>
        </Link>
        <AddressActions address={row.original} />
      </div>
    ),
  },
];
