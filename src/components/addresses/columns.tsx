"use client";

import { IconExternalLink, IconWebhook } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@web3icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";

import { AddressActions } from "./address-actions";
import { EditableLabelCell } from "./editable-label-cell";
import { ListeningToggle } from "./listening-toggle";

export const columns: ColumnDef<Doc<"addresses">>[] = [
  {
    id: "index",
    header: "ID",
    cell: ({ row }) => row.original._id.toString().slice(-8),
  },
  {
    accessorKey: "cryptoType",
    header: "Coin",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
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
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.getValue("address")}</span>
    ),
  },
  {
    accessorKey: "isListening",
    header: () => <div className="text-center">Monitoring</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <ListeningToggle address={row.original} />
      </div>
    ),
  },
  {
    accessorKey: "label",
    header: () => <div className="ml-3">Label</div>,
    cell: ({ row }) => <EditableLabelCell address={row.original} />,
  },
  {
    accessorKey: "webhookUrl",
    header: () => <div className="text-center">Webhook</div>,
    cell: () => (
      <div className="flex justify-center">
        <div className="flex items-center gap-1">
          <IconWebhook className="h-4 w-4 text-green-500" />
          <span className="text-xs text-muted-foreground">Active</span>
        </div>
      </div>
    ),
  },
  {
    id: "transactions",
    header: "Transactions",
    cell: ({ row }) => (
      <Link href={`/addresses/${row.original._id}/transactions`}>
        <Button variant="ghost" size="sm">
          View
          <IconExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </Link>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <AddressActions address={row.original} />,
  },
];
