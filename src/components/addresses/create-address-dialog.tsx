"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CryptoSelector } from "@/components/crypto/crypto-selector";
import { Button } from "@/components/ui/button";
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
  CRYPTO_SYMBOLS,
  type CryptoType,
  getCryptoInfo,
} from "@/lib/constants";
import { validateCryptoAddress } from "@/lib/validator";

// Form schema with dynamic validation based on selected crypto type
const formSchema = z
  .object({
    cryptoType: z.enum(CRYPTO_SYMBOLS),
    address: z.string().min(1, "Address is required"),
    label: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate address based on selected crypto type
    const { cryptoType, address } = data;

    if (address) {
      const isValid = validateCryptoAddress(cryptoType, address);

      if (!isValid) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid ${cryptoType} address format`,
          path: ["address"],
        });
      }
    }
  });

export function CreateAddressDialog() {
  const [open, setOpen] = useState(false);
  const addAddress = useMutation(api.cryptoAddresses.add);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cryptoType: "BTC",
      address: "",
      label: "",
    },
  });

  // Watch the cryptoType field to update validation schema
  const watchedCryptoType = form.watch("cryptoType");

  // Handle crypto type changes
  const handleCryptoTypeChange = (value: CryptoType) => {
    form.setValue("cryptoType", value);
    // Clear address field when crypto type changes
    form.setValue("address", "");
    // Clear any existing errors
    form.clearErrors("address");
    // Trigger revalidation if there was a previous value
    if (form.formState.isSubmitted) {
      form.trigger("address");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addAddress({
        cryptoType: values.cryptoType,
        address: values.address,
        label: values.label || undefined,
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
              <FormField
                control={form.control}
                name="cryptoType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cryptocurrency</FormLabel>
                    <FormControl>
                      <CryptoSelector
                        value={field.value}
                        onValueChange={(value) => {
                          handleCryptoTypeChange(value as CryptoType);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          getCryptoInfo(watchedCryptoType)?.placeholder
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
