"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconPlus,
  IconRefresh,
  IconRotateClockwise,
} from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { useTranslation } from "@/i18n/use-translation";
import {
  DIALOG_ANIMATION_DURATION,
  getTokenNetworkInfo,
  getValidNetworksForToken,
  isValidTokenNetworkCombination,
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
} from "@/lib/constants";
import { generateVerificationCode } from "@/lib/generator";
import { validateTokenNetworkAddress } from "@/lib/validator";
import type { Translations } from "@/provider/language-provider";

// Form schema will be created inside the component to use translations
const createFormSchema = (t: Translations) =>
  z
    .object({
      token: z.enum(SUPPORTED_TOKENS, {
        message: t.addresses.invalidAddress,
      }),
      network: z.enum(SUPPORTED_NETWORKS, {
        message: t.addresses.invalidAddress,
      }),
      address: z.string().min(1, t.common.required),
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
          message: t.addresses.invalidTokenNetworkCombination
            .replace("{token}", token)
            .replace("{network}", network),
          path: ["network"],
        });
      }

      if (address && token && network) {
        const isValid = validateTokenNetworkAddress(token, network, address);

        if (!isValid) {
          ctx.addIssue({
            code: "custom",
            message: t.addresses.invalidAddressFormat
              .replace("{token}", token)
              .replace("{network}", network),
            path: ["address"],
          });
        }
      }

      // Validate webhook fields when enabled
      if (webhookEnabled) {
        if (!webhookUrl) {
          ctx.addIssue({
            code: "custom",
            message: t.webhook.webhookUrlRequired,
            path: ["webhookUrl"],
          });
        } else if (
          !webhookUrl.startsWith("http://") &&
          !webhookUrl.startsWith("https://")
        ) {
          ctx.addIssue({
            code: "custom",
            message: t.webhook.webhookUrlInvalid,
            path: ["webhookUrl"],
          });
        }
      }
    });

export function CreateAddressDialog() {
  const [open, setOpen] = useState(false);
  const addAddress = useMutation(api.addresses.add);
  const resetTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const t = useTranslation();

  const formSchema = useMemo(() => createFormSchema(t), [t]);

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

  // Effect to handle token/network dependency
  useEffect(() => {
    if (watchedToken) {
      const validNetworks = getValidNetworksForToken(watchedToken);
      const currentNetwork = form.getValues("network");

      // If current network is not valid for the selected token, update it
      if (!validNetworks.includes(currentNetwork)) {
        form.setValue("network", validNetworks[0], {
          shouldValidate: true,
        });
        // Clear address when network changes
        form.setValue("address", "");
      }
    }
  }, [watchedToken, form]);

  // Memoize placeholder text to avoid repeated function calls
  const addressPlaceholder = useMemo(
    () =>
      getTokenNetworkInfo(watchedToken, watchedNetwork)?.placeholder ||
      t.addresses.enterAddress,
    [watchedToken, watchedNetwork, t],
  );

  // Handle network change to clear address
  const handleNetworkChange = () => {
    // Clear address when network changes
    form.setValue("address", "");
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
      toast.success(t.addresses.addressAdded);
      setOpen(false);
      // Form will be reset after dialog close animation via handleOpenChange
    } catch (error) {
      if (error instanceof ConvexError) {
        const errorMessage = error.data.message || t.addresses.failedToAdd;
        form.setError("address", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        toast.error(
          error instanceof Error ? error.message : t.addresses.failedToAdd,
        );
      }
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
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
    toast.success(t.webhook.codeGenerated);
  };

  // Handle reset header name to default
  const handleResetHeaderName = () => {
    form.setValue("webhookHeaderName", "X-Webhook-Verification");
    toast.success(t.webhook.headerReset);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="size-4" />
          {t.addresses.addAddress}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{t.addresses.addNewAddress}</DialogTitle>
              <DialogDescription>
                {t.addresses.addNewAddressDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.addresses.token}</FormLabel>
                      <FormControl>
                        <TokenSelector
                          value={field.value}
                          onValueChange={field.onChange}
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
                      <FormLabel>{t.addresses.network}</FormLabel>
                      <FormControl>
                        <NetworkSelector
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleNetworkChange();
                          }}
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
                    <FormLabel>{t.addresses.address}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={addressPlaceholder}
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
                    <FormLabel>{t.addresses.label}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t.addresses.labelPlaceholder}
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
                            placeholder={t.webhook.webhookUrlPlaceholder}
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
                            title={t.webhook.generateNewCode}
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
                        <FormLabel>
                          {t.webhook.verificationHeaderName}
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={
                                t.webhook.verificationHeaderPlaceholder
                              }
                              className="font-mono"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleResetHeaderName}
                            title={t.webhook.resetToDefault}
                          >
                            <IconRotateClockwise className="size-4" />
                          </Button>
                        </div>
                        {!fieldState.error && (
                          <FormDescription>
                            {t.webhook.verificationHeaderDescription}
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
                {form.formState.isSubmitting
                  ? t.addresses.adding
                  : t.addresses.addAddress}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
