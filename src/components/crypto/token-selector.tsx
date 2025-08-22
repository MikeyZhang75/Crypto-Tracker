"use client";

import { TokenIcon } from "@web3icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_TOKENS } from "@/lib/constants";

interface TokenSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export function TokenSelector({
  value,
  onValueChange,
  defaultValue = "USDT",
}: TokenSelectorProps) {
  // Show all supported tokens - let the user select any token
  // The network selector will update based on the token selection
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
    >
      <SelectTrigger className="[&>span_svg]:text-muted-foreground/80 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0">
        <SelectValue placeholder="Choose a token" />
      </SelectTrigger>
      <SelectContent className="[&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
        {SUPPORTED_TOKENS.map((token) => (
          <SelectItem key={token} value={token}>
            <TokenIcon symbol={token} variant="branded" size={16} />
            <span className="truncate">{token}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
