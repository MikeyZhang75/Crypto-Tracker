"use client";

import { IconExternalLink } from "@tabler/icons-react";
import type { ColumnDef } from "@tanstack/react-table";
import { TokenIcon } from "@web3icons/react";
import Link from "next/link";
import { CopyableText } from "@/components/custom-ui/copyable-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { useTranslation } from "@/i18n/use-translation";
import { AddressActions } from "./address-actions";

export function useAddressColumns(): ColumnDef<Doc<"addresses">>[] {
  const t = useTranslation();

  return [
    {
      accessorKey: "address",
      header: t.addresses.address,
      cell: ({ row }) => {
        const address = row.original.address;
        return (
          <CopyableText
            text={address}
            label={t.addresses.clickToCopyAddress}
            toastMessages={{
              success: t.addresses.addressCopiedToClipboard,
              error: t.addresses.failedToCopyAddress,
            }}
          />
        );
      },
    },
    {
      accessorKey: "token",
      header: `${t.addresses.token}/${t.addresses.network}`,
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
      header: t.addresses.label,
      cell: ({ row }) => <span>{row.original.label}</span>,
    },
    {
      accessorKey: "isListening",
      header: t.addresses.monitoring,
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
            {isListening ? t.addresses.active : t.addresses.inactive}
          </Badge>
        );
      },
    },
    {
      accessorKey: "webhook",
      header: t.webhook.title,
      cell: ({ row }) => {
        const webhook = row.original.webhook;
        if (!webhook) {
          return (
            <Badge variant="outline" className="gap-1.5 opacity-50">
              <span
                className="size-1.5 rounded-full bg-gray-400"
                aria-hidden="true"
              />
              {t.webhook.notConfigured}
            </Badge>
          );
        }
        return (
          <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 items-center">
            <span className="text-xs text-muted-foreground">
              {t.webhook.url}:
            </span>
            <div className="flex">
              <CopyableText
                text={webhook.url}
                label={t.webhook.clickToCopyWebhookUrl}
                toastMessages={{
                  success: t.webhook.webhookUrlCopiedToClipboard,
                  error: t.webhook.failedToCopyWebhookUrl,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {t.webhook.header}:
            </span>
            <div className="flex">
              <CopyableText
                text={webhook.headerName}
                label={t.webhook.clickToCopyHeaderName}
                toastMessages={{
                  success: t.webhook.headerNameCopiedToClipboard,
                  error: t.webhook.failedToCopyHeaderName,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {t.webhook.code}:
            </span>
            <div className="flex">
              <CopyableText
                text={webhook.verificationCode}
                label={t.webhook.clickToCopyVerificationCode}
                toastMessages={{
                  success: t.webhook.verificationCodeCopiedToClipboard,
                  error: t.webhook.failedToCopyVerificationCode,
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
              {t.addresses.view}
            </Button>
          </Link>
          <AddressActions address={row.original} />
        </div>
      ),
    },
  ];
}
