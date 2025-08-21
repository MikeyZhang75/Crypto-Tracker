"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CopyableTextProps {
  text: string;
  data?: string;
  label?: string;
  toastMessages?: {
    success?: string;
    error?: string;
  };
  className?: string;
}

export function CopyableText({
  text,
  data,
  label = "Click to copy",
  toastMessages = {
    success: "Copied to clipboard",
    error: "Failed to copy",
  },
  className,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data || text);
      setCopied(true);
      toast.success(toastMessages.success);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(toastMessages.error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            className={
              className ||
              "group flex items-center gap-1 font-mono text-xs hover:bg-primary/10 hover:text-primary rounded px-1 py-0.5 transition-colors"
            }
          >
            <span className="select-text">{text}</span>
            {copied ? (
              <IconCheck className="h-3 w-3 text-green-500 flex-shrink-0" />
            ) : (
              <IconCopy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
