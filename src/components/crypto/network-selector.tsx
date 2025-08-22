"use client";

import { NetworkIcon } from "@web3icons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_NETWORKS } from "@/lib/constants";

interface NetworkSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

export function NetworkSelector({
  value,
  onValueChange,
  defaultValue = "TRON",
}: NetworkSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      defaultValue={defaultValue}
    >
      <SelectTrigger className="[&>span_svg]:text-muted-foreground/80 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0">
        <SelectValue placeholder="Choose a network" />
      </SelectTrigger>
      <SelectContent className="[&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
        {SUPPORTED_NETWORKS.map((network) => (
          <SelectItem key={network} value={network}>
            <NetworkIcon name={network} variant="branded" size={16} />
            <span className="truncate">{network}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
