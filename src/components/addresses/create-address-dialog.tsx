"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconPlus,
  IconRefresh,
  IconRotateClockwise,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { NetworkSelector } from "@/components/crypto/network-selector";
import { TokenSelector } from "@/components/crypto/token-selector";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  getTokenNetworkInfo,
  getValidNetworksForToken,
  isValidTokenNetworkCombination,
  type NetworkType,
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
  type TokenType,
} from "@/lib/constants";
import { generateVerificationCode } from "@/lib/generator";
import { validateTokenNetworkAddress } from "@/lib/validator";

// Form schema with dynamic validation based on selected token and network
const formSchema = z
  .object({
    token: z.enum(SUPPORTED_TOKENS, {
      message: "Invalid token",
    }),
    network: z.enum(SUPPORTED_NETWORKS, {
      message: "Invalid network",
    }),
    address: z.string().min(1, "Address is required"),
    label: z.string().optional(),
    webhookEnabled: z.boolean().optional(),
    webhookUrl: z.string().optional(),
    webhookVerificationCode: z.string().optional(),
    webhookHeaderName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate address based on selected token and network
    const { token, network, address, webhookEnabled, webhookUrl } = data;

    // First check if the combination is valid
    if (token && network && !isValidTokenNetworkCombination(token, network)) {
      ctx.addIssue({
        code: "custom",
        message: `${token} is not supported on ${network} network`,
        path: ["network"],
      });
    }

    if (address && token && network) {
      const isValid = validateTokenNetworkAddress(token, network, address);

      if (!isValid) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid ${token} address format for ${network} network`,
          path: ["address"],
        });
      }
    }

    // Validate webhook fields when enabled
    if (webhookEnabled) {
      if (!webhookUrl) {
        ctx.addIssue({
          code: "custom",
          message: "Webhook URL is required when webhook is enabled",
          path: ["webhookUrl"],
        });
      } else if (
        !webhookUrl.startsWith("http://") &&
        !webhookUrl.startsWith("https://")
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Webhook URL must be a valid URL",
          path: ["webhookUrl"],
        });
      }
    }
  });

export function CreateAddressDialog() {
  const [open, setOpen] = useState(false);
  const addAddress = useMutation(api.addresses.add);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "USDT",
      network: "TRON", // This will be automatically updated if token changes
      address: "",
      label: "",
      webhookEnabled: false,
      webhookUrl: "",
      webhookVerificationCode: "",
      webhookHeaderName: "X-Webhook-Verification",
    },
  });

  // Watch the token and network fields to update validation schema
  const watchedToken = form.watch("token");
  const watchedNetwork = form.watch("network");
  const watchWebhookEnabled = form.watch("webhookEnabled");

  // Handle token/network changes
  const handleTokenChange = (value: string) => {
    const newToken = value as TokenType;
    form.setValue("token", newToken);

    // Check if current network is still valid for new token
    const currentNetwork = form.getValues("network");
    const validNetworks = getValidNetworksForToken(newToken);

    // If current network is not valid for new token, select the first valid network
    if (!validNetworks.includes(currentNetwork)) {
      form.setValue("network", validNetworks[0]);
    }

    // Clear address field when selection changes
    form.setValue("address", "");
    form.clearErrors("address");
    form.clearErrors("network");
  };

  const handleNetworkChange = (value: string) => {
    const newNetwork = value as NetworkType;
    form.setValue("network", newNetwork);

    // Clear address field when selection changes
    form.setValue("address", "");
    form.clearErrors("address");
    form.clearErrors("network");
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const webhook =
        values.webhookEnabled && values.webhookUrl
          ? {
              url: values.webhookUrl,
              verificationCode:
                values.webhookVerificationCode || generateVerificationCode(),
              headerName: values.webhookHeaderName || "X-Webhook-Verification",
            }
          : undefined;

      await addAddress({
        token: values.token,
        network: values.network,
        address: values.address,
        label: values.label || undefined,
        webhook,
      });
      toast.success("Address added successfully");
      form.reset();
      setOpen(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const errorMessage = error.data.message || "Failed to add address";
        form.setError("address", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to add address",
        );
      }
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
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

  // Handle reset header name to default
  const handleResetHeaderName = () => {
    form.setValue("webhookHeaderName", "X-Webhook-Verification");
    toast.success("Header name reset to default");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="size-4" />
          Add Address
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
              <DialogDescription>
                Add a new cryptocurrency address to your collection
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token</FormLabel>
                      <FormControl>
                        <TokenSelector
                          value={field.value}
                          onValueChange={handleTokenChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network</FormLabel>
                      <FormControl>
                        <NetworkSelector
                          value={field.value}
                          onValueChange={handleNetworkChange}
                          selectedToken={watchedToken}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={
                          getTokenNetworkInfo(watchedToken, watchedNetwork)
                            ?.placeholder
                        }
                        className="font-mono text-sm"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                            (default: X-Webhook-Verification)
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
                {form.formState.isSubmitting ? "Adding..." : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
