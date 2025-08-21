"use client";

import { Badge } from "@/components/ui/badge";
import type { Doc } from "@/convex/_generated/dataModel";

interface ListeningToggleProps {
  address: Doc<"addresses">;
}

export function ListeningToggle({ address }: ListeningToggleProps) {
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 ${address.isListening ? "" : "opacity-50"}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          address.isListening ? "bg-emerald-500" : "bg-gray-400"
        }`}
        aria-hidden="true"
      />
      {address.isListening ? "Active" : "Inactive"}
    </Badge>
  );
}
