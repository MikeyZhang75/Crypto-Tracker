"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconRefresh, IconRotateClockwise } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect } from "react";
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
import { generateVerificationCode } from "@/lib/generator";

// Form schema for editing address
const formSchema = z
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
          message: "Webhook URL is required when webhook is enabled",
          path: ["webhookUrl"],
        });
      } else if (
        !data.webhookUrl.startsWith("http://") &&
        !data.webhookUrl.startsWith("https://")
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Webhook URL must be a valid URL",
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
  const updateAddress = useMutation(api.addresses.update);

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
      toast.success("Address updated successfully");
      onOpenChange(false);
      // Form will be reset after dialog close animation via handleOpenChange
    } catch (error) {
      if (error instanceof ConvexError) {
        const errorMessage = error.data.message || "Failed to update address";
        form.setError("webhookUrl", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to update address",
        );
      }
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Delay form reset to prevent visual flicker during close animation
      setTimeout(() => {
        form.reset();
      }, 300); // Match dialog animation duration
    }
  };

  // Handle regenerate code button click
  const handleRegenerateCode = () => {
    const newCode = generateVerificationCode();
    form.setValue("webhookVerificationCode", newCode);
    toast.success("New verification code generated");
  };

  // Handle reset header name to default
  const handleResetHeaderName = () => {
    form.setValue("webhookHeaderName", "X-Webhook-Verification");
    toast.success("Header name reset to default");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
              <DialogDescription>
                Update the label and webhook settings for this address
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Main Wallet, Exchange"
                      />
                    </FormControl>
                    {!fieldState.error && (
                      <FormDescription>
                        Optional label to identify this address
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
                      <FormLabel>Enable Webhook Notifications</FormLabel>
                      <FormDescription>
                        Receive transaction notifications via webhook
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
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/webhook"
                            type="url"
                          />
                        </FormControl>
                        {!fieldState.error && (
                          <FormDescription>
                            URL to receive transaction notifications
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
                        <FormLabel>Verification Code</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter verification code"
                              className="font-mono"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleRegenerateCode}
                            title="Generate new verification code"
                          >
                            <IconRefresh className="size-4" />
                          </Button>
                        </div>
                        {!fieldState.error && (
                          <FormDescription>
                            Code used to authenticate webhook requests
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
                        <FormLabel>Verification Header Name</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="X-Webhook-Verification"
                              className="font-mono"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleResetHeaderName}
                            title="Reset to default header name"
                          >
                            <IconRotateClockwise className="size-4" />
                          </Button>
                        </div>
                        {!fieldState.error && (
                          <FormDescription>
                            Custom HTTP header name for the verification code
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
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
