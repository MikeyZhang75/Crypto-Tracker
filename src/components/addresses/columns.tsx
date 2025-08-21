"use client";

import { IconExternalLink } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@web3icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import { AddressActions } from "./address-actions";
import { EditableLabelCell } from "./editable-label-cell";

export const columns: ColumnDef<Doc<"addresses">>[] = [
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
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.original.address;
      return <span className="font-mono text-sm">{address}</span>;
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
    accessorKey: "label",
    header: () => <div className="ml-3">Label</div>,
    cell: ({ row }) => <EditableLabelCell address={row.original} />,
  },
  {
    accessorKey: "webhookUrl",
    header: "Webhook",
    cell: ({ row }) => {
      const webhookUrl = row.original.webhookUrl;
      return <span className="font-mono text-xs">{webhookUrl}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/addresses/${encodeURIComponent(row.original.address)}/transactions`}
        >
          <Button variant="outline" size="sm">
            <IconExternalLink className="size-4" />
            View
          </Button>
        </Link>
        <AddressActions address={row.original} />
      </div>
    ),
  },
];
