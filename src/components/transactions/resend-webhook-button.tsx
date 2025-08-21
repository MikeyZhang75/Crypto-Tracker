"use client";

import { IconRefresh } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ResendWebhookButtonProps {
  transactionId: Id<"transactions">;
}

export function ResendWebhookButton({
  transactionId,
}: ResendWebhookButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const resendWebhook = useMutation(api.transactions.resendWebhook);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendWebhook({ transactionId });
      toast.success("Webhook resent successfully");
    } catch (error) {
      toast.error("Failed to resend webhook");
      console.error("Error resending webhook:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleResend}
      disabled={isLoading}
      title="Resend webhook"
    >
      <IconRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      Resend
    </Button>
  );
}
