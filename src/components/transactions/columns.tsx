"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Doc } from "@/convex/_generated/dataModel";
import { ResendWebhookButton } from "./resend-webhook-button";
import { WebhookHistoryDrawer } from "./webhook-history-drawer";

export const columns: ColumnDef<Doc<"transactions">>[] = [
  {
    accessorKey: "transactionId",
    header: "Transaction ID",
    cell: ({ row }) => {
      const txId = row.original.transactionId;
      // Show first 8 and last 8 characters
      const shortened = `${txId.slice(0, 8)}...${txId.slice(-8)}`;
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span className="font-mono text-xs cursor-pointer">
                {shortened}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={5}>
              <p className="font-mono text-xs">{txId}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      return (
        <Badge
          variant="outline"
          className={`gap-1.5 ${type === "received" ? "" : "opacity-50"}`}
        >
          <span
            className={`size-1.5 rounded-full ${
              type === "received" ? "bg-emerald-500" : "bg-gray-400"
            }`}
            aria-hidden="true"
          />
          {type === "received" ? "Received" : "Sent"}
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
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span className="font-mono text-xs cursor-pointer">
                {shortened}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={5}>
              <p className="font-mono text-xs">{address}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ row }) => {
      const timestamp = row.original.timestamp;
      const date = new Date(timestamp);
      const formattedDate = date.toLocaleString();
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });

      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground cursor-pointer">
                {relativeTime}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={5}>
              <p>{formattedDate}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "webhookSent",
    header: "Webhook",
    cell: ({ row }) => {
      const sent = row.original.webhookSent;
      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                sent ? "bg-emerald-500" : "bg-gray-400"
              }`}
              aria-hidden="true"
            />
            {sent ? "Sent" : "Pending"}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <WebhookHistoryDrawer transactionId={row.original._id} />
        <ResendWebhookButton transactionId={row.original._id} />
      </div>
    ),
  },
];
