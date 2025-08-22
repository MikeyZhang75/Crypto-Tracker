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
    accessorKey: "token",
    header: "Token/Network",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          <TokenIcon
            symbol={row.original.token}
            variant="branded"
            size={16}
          />
          <span>
            {row.original.token} ({row.original.network})
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => <span>{row.original.label}</span>,
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
              isListening ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
            }`}
            aria-hidden="true"
          />
          {isListening ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "webhook",
    header: "Webhook Configuration",
    cell: ({ row }) => {
      const webhook = row.original.webhook;
      if (!webhook) {
        return (
          <Badge variant="outline" className="gap-1.5 opacity-50">
            <span
              className="size-1.5 rounded-full bg-gray-400"
              aria-hidden="true"
            />
            Not Configured
          </Badge>
        );
      }
      return (
        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center">
          <span className="text-xs text-muted-foreground">URL:</span>
          <div className="flex">
            <CopyableText
              text={webhook.url}
              label="Click to copy webhook URL"
              toastMessages={{
                success: "Webhook URL copied to clipboard",
                error: "Failed to copy webhook URL",
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">Header:</span>
          <div className="flex">
            <CopyableText
              text={webhook.headerName}
              label="Click to copy header name"
              toastMessages={{
                success: "Header name copied to clipboard",
                error: "Failed to copy header name",
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground">Code:</span>
          <div className="flex">
            <CopyableText
              text={webhook.verificationCode}
              label="Click to copy verification code"
              toastMessages={{
                success: "Verification code copied to clipboard",
                error: "Failed to copy verification code",
              }}
            />
          </div>
        </div>
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
