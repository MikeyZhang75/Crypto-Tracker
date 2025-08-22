"use client";

import { TokenIcon } from "@web3icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TOKEN_NETWORK_OPTIONS } from "@/lib/constants";

interface CryptoSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export function CryptoSelector({
  value,
  onValueChange,
  defaultValue = "USDT_TRON",
}: CryptoSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
    >
      <SelectTrigger className="[&>span_svg]:text-muted-foreground/80 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 **:data-desc:hidden">
        <SelectValue placeholder="Choose a cryptocurrency" />
      </SelectTrigger>
      <SelectContent className="[&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
        {TOKEN_NETWORK_OPTIONS.map((tokenNetwork) => (
          <SelectItem key={tokenNetwork.value} value={tokenNetwork.value}>
            <TokenIcon
              symbol={tokenNetwork.token}
              variant="branded"
              size={16}
            />
            <span className="truncate">{tokenNetwork.name}</span>
            <span
              className="text-muted-foreground mt-1 block text-xs"
              data-desc
            >
              {tokenNetwork.token} ({tokenNetwork.network})
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
