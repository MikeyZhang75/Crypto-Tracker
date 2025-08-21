"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Doc } from "@/convex/_generated/dataModel";
import { ResendWebhookButton } from "./resend-webhook-button";

export const columns: ColumnDef<Doc<"transactions">>[] = [
  {
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => {
      const txId = row.original.transactionId;
      // Show first 8 and last 8 characters
      const shortened = `${txId.slice(0, 8)}...${txId.slice(-8)}`;
      return (
        <span className="font-mono text-xs" title={txId}>
          {shortened}
        </span>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge variant={type === "received" ? "default" : "secondary"}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = row.original.amount;
      const cryptoType = row.original.cryptoType;
      // Convert from smallest unit (for USDT, it's in 6 decimals)
      const displayAmount = (Number.parseInt(amount, 10) / 1000000).toFixed(2);
      return (
        <span className="font-medium">
          {displayAmount} {cryptoType}
        </span>
      );
    },
  },
  {
    accessorKey: "from",
    header: "From",
    cell: ({ row }) => {
      const address = row.original.from;
      const shortened = `${address.slice(0, 6)}...${address.slice(-6)}`;
      return (
        <span className="font-mono text-xs" title={address}>
          {shortened}
        </span>
      );
    },
  },
  {
    accessorKey: "to",
    header: "To",
    cell: ({ row }) => {
      const address = row.original.to;
      const shortened = `${address.slice(0, 6)}...${address.slice(-6)}`;
      return (
        <span className="font-mono text-xs" title={address}>
          {shortened}
        </span>
      );
    },
  },
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ row }) => {
      const timestamp = row.original.timestamp;
      return (
        <span className="text-muted-foreground">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      );
    },
  },
  {
    accessorKey: "webhookSent",
    header: "Webhook",
    cell: ({ row }) => {
      const sent = row.original.webhookSent;
      if (sent) {
        return <Badge variant="default">Sent</Badge>;
      }
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Pending</Badge>
          <ResendWebhookButton transactionId={row.original._id} />
        </div>
      );
    },
  },
];
