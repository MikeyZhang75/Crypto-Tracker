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
  // Required content
  text: string;

  // Optional content
  data?: string;

  // UI configuration
  className?: string;
  showTooltip?: boolean;

  // Tooltip configuration
  label?: string;

  // Toast configuration
  toastMessages?: {
    success?: string;
    error?: string;
  };
}

export function CopyableText({
  // Required
  text,

  // Optional content
  data,

  // UI configuration
  className,
  showTooltip = false,

  // Tooltip configuration
  label = "Click to copy",

  // Toast configuration
  toastMessages = {
    success: "Copied to clipboard",
    error: "Failed to copy",
  },
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

  const button = (
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
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
