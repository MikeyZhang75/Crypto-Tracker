"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconRefresh } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
const formSchema = z.object({
  label: z.string().optional(),
  webhookUrl: z
    .string()
    .min(1, "Webhook URL is required")
    .url("Invalid URL format"),
  webhookVerificationCode: z.string().optional(),
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
      webhookUrl: address.webhookUrl,
      webhookVerificationCode: address.webhookVerificationCode || "",
    },
  });

  // Reset form when address prop changes
  useEffect(() => {
    form.reset({
      label: address.label || "",
      webhookUrl: address.webhookUrl,
      webhookVerificationCode: address.webhookVerificationCode || "",
    });
  }, [address, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateAddress({
        id: address._id,
        label: values.label || undefined,
        webhookUrl: values.webhookUrl,
        webhookVerificationCode:
          values.webhookVerificationCode !== address.webhookVerificationCode
            ? values.webhookVerificationCode
            : undefined,
      });
      toast.success("Address updated successfully");
      form.reset();
      onOpenChange(false);
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
      form.reset();
    }
  };

  // Handle regenerate code button click
  const handleRegenerateCode = () => {
    const newCode = generateVerificationCode();
    form.setValue("webhookVerificationCode", newCode);
    toast.success("New verification code generated");
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
                        Webhook URL to receive transaction notifications
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
