"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconRefresh, IconRotateClockwise } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useTranslation } from "@/i18n/use-translation";
import { DIALOG_ANIMATION_DURATION } from "@/lib/constants";
import { generateVerificationCode } from "@/lib/generator";
import type { Translations } from "@/provider/language-provider";

// Form schema for editing address
const editFormSchema = (t: Translations) =>
  z
    .object({
      label: z.string().optional(),
      webhookEnabled: z.boolean(),
      webhookUrl: z.string().optional(),
      webhookVerificationCode: z.string().optional(),
      webhookHeaderName: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      // Validate webhook fields when enabled
      if (data.webhookEnabled) {
        if (!data.webhookUrl) {
          ctx.addIssue({
            code: "custom",
            message: t.webhook.webhookUrlRequired,
            path: ["webhookUrl"],
          });
        } else if (
          !data.webhookUrl.startsWith("http://") &&
          !data.webhookUrl.startsWith("https://")
        ) {
          ctx.addIssue({
            code: "custom",
            message: t.webhook.webhookUrlInvalid,
            path: ["webhookUrl"],
          });
        }
      }
    });

interface EditAddressDialogProps {
  address: Doc<"addresses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAddressDialog({
  address,
  open,
  onOpenChange,
}: EditAddressDialogProps) {
  const t = useTranslation();
  const updateAddress = useMutation(api.addresses.update);
  const resetTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const formSchema = useMemo(() => editFormSchema(t), [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: address.label || "",
      webhookEnabled: !!address.webhook,
      webhookUrl: address.webhook?.url || "",
      webhookVerificationCode: address.webhook?.verificationCode || "",
      webhookHeaderName:
        address.webhook?.headerName || "X-Webhook-Verification",
    },
  });

  // Reset form when address prop changes
  useEffect(() => {
    form.reset({
      label: address.label || "",
      webhookEnabled: !!address.webhook,
      webhookUrl: address.webhook?.url || "",
      webhookVerificationCode: address.webhook?.verificationCode || "",
      webhookHeaderName:
        address.webhook?.headerName || "X-Webhook-Verification",
    });
  }, [address, form.reset]);

  const watchWebhookEnabled = form.watch("webhookEnabled");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const webhook =
        values.webhookEnabled && values.webhookUrl
          ? {
              url: values.webhookUrl,
              verificationCode:
                values.webhookVerificationCode ||
                address.webhook?.verificationCode ||
                generateVerificationCode(),
              headerName:
                values.webhookHeaderName ||
                address.webhook?.headerName ||
                "X-Webhook-Verification",
            }
          : null; // null to clear webhook if disabled

      await updateAddress({
        id: address._id,
        label: values.label || undefined,
        webhook,
      });
      toast.success(t.addresses.addressUpdated);
      onOpenChange(false);
      // Form will be reset after dialog close animation via handleOpenChange
    } catch (error) {
      if (error instanceof ConvexError) {
        const errorMessage = error.data.message || t.addresses.failedToUpdate;
        form.setError("webhookUrl", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        toast.error(
          error instanceof Error ? error.message : t.addresses.failedToUpdate,
        );
      }
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Clear any existing timeout
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      // Delay form reset to prevent visual flicker during close animation
      resetTimeoutRef.current = setTimeout(() => {
        form.reset();
      }, DIALOG_ANIMATION_DURATION);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  // Handle regenerate code button click
  const handleRegenerateCode = () => {
    const newCode = generateVerificationCode();
    form.setValue("webhookVerificationCode", newCode);
    toast.success(t.webhook.verificationCodeGenerated);
  };

  // Handle reset header name to default
  const handleResetHeaderName = () => {
    form.setValue("webhookHeaderName", "X-Webhook-Verification");
    toast.success(t.webhook.headerNameReset);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{t.addresses.editAddress}</DialogTitle>
              <DialogDescription>
                {t.addresses.editAddressDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{t.addresses.label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Main Wallet, Exchange"
                      />
                    </FormControl>
                    {!fieldState.error && (
                      <FormDescription>
                        {t.addresses.labelDescription}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhookEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-1">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t.webhook.enableWebhook}</FormLabel>
                      <FormDescription>
                        {t.webhook.enableWebhookDescription}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchWebhookEnabled && (
                <>
                  <FormField
                    control={form.control}
                    name="webhookUrl"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>{t.webhook.webhookUrl}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/webhook"
                            type="url"
                          />
                        </FormControl>
                        {!fieldState.error && (
                          <FormDescription>
                            {t.webhook.webhookUrlDescription}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookVerificationCode"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>{t.webhook.verificationCode}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={
                                t.webhook.verificationCodePlaceholder
                              }
                              className="font-mono"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleRegenerateCode}
                            title={t.webhook.generateVerificationCode}
                          >
                            <IconRefresh className="size-4" />
                          </Button>
                        </div>
                        {!fieldState.error && (
                          <FormDescription>
                            {t.webhook.verificationCodeDescription}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webhookHeaderName"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>{t.webhook.header}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.webhook.headerNamePlaceholder}
                              className="font-mono"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleResetHeaderName}
                            title={t.webhook.headerNameReset}
                          >
                            <IconRotateClockwise className="size-4" />
                          </Button>
                        </div>
                        {!fieldState.error && (
                          <FormDescription>
                            {t.webhook.headerNameDescription}
                          </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t.common.saving : t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
