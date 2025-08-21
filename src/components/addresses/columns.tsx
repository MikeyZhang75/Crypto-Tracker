"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@web3icons/react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { Doc } from "@/convex/_generated/dataModel";
import { Badge } from "../ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { AddressActions } from "./address-actions";
import { EditableLabelCell } from "./editable-label-cell";

function CopyableWebhookUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Webhook URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            className="group flex items-center gap-1 font-mono text-xs hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
          >
            <span className="select-text">{url}</span>
            {copied ? (
              <IconCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
            ) : (
              <IconCopy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to copy webhook URL</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const columns: ColumnDef<Doc<"addresses">>[] = [
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.original.address;
      return (
        <Link
          href={`/addresses/${encodeURIComponent(address)}/transactions`}
          className="font-mono text-sm hover:underline inline-block"
        >
          {address}
        </Link>
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
    accessorKey: "label",
    header: () => <div className="ml-3">Label</div>,
    cell: ({ row }) => <EditableLabelCell address={row.original} />,
  },
  {
    accessorKey: "webhookUrl",
    header: "Webhook",
    cell: ({ row }) => {
      const webhookUrl = row.original.webhookUrl;
      return <CopyableWebhookUrl url={webhookUrl} />;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <AddressActions address={row.original} />,
  },
];
