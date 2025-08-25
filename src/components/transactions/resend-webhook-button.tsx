"use client";

import { IconRefresh } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useTranslation } from "@/i18n/use-translation";

interface ResendWebhookButtonProps {
  transactionId: Id<"transactions">;
}

export function ResendWebhookButton({
  transactionId,
}: ResendWebhookButtonProps) {
  const t = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const resendWebhook = useMutation(api.webhooks.resend);

  const handleResend = async () => {
    setIsLoading(true);
    try {
      await resendWebhook({ transactionId });
      toast.success(t.transactions.webhookResentSuccessfully);
    } catch (error) {
      toast.error(t.transactions.failedToResendWebhook);
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
      title={t.transactions.resendWebhook}
      type="button"
    >
      <IconRefresh className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
      {t.transactions.resendWebhook}
    </Button>
  );
}
