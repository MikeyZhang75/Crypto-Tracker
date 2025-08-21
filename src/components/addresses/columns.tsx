"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@web3icons/react";
import type { Doc } from "@/convex/_generated/dataModel";

import { AddressActions } from "./address-actions";
import { EditableLabelCell } from "./editable-label-cell";
import { ListeningToggle } from "./listening-toggle";

export const columns: ColumnDef<Doc<"cryptoAddresses">>[] = [
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
    accessorKey: "label",
    header: () => <div className="ml-3">Label</div>,
    cell: ({ row }) => <EditableLabelCell address={row.original} />,
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
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <AddressActions address={row.original} />
      </div>
    ),
  },
];
