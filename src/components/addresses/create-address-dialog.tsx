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
import { CRYPTO_INFO, type CryptoType } from "@/lib/constants";

// Validation functions for crypto addresses
const validateBtcAddress = (address: string) => {
  return (
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
    /^bc1[a-z0-9]{39,59}$/.test(address)
  );
};

const validateLtcAddress = (address: string) => {
  return (
    /^[LM][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address) ||
    /^ltc1[a-z0-9]{39,59}$/.test(address)
  );
};

const validateUsdtAddress = (address: string) => {
  return (
    /^0x[a-fA-F0-9]{40}$/.test(address) || /^T[a-zA-Z0-9]{33}$/.test(address)
  );
};

// Form schema with dynamic validation based on crypto type
const createFormSchema = (cryptoType: CryptoType) => {
  return z.object({
    cryptoType: z.enum(["btc", "usdt", "ltc"]),
    address: z
      .string()
      .min(1, "Address is required")
      .refine(
        (address) => {
          switch (cryptoType) {
            case "btc":
              return validateBtcAddress(address);
            case "ltc":
              return validateLtcAddress(address);
            case "usdt":
              return validateUsdtAddress(address);
            default:
              return false;
          }
        },
        {
          message: `Invalid ${cryptoType.toUpperCase()} address format`,
        },
      ),
    label: z.string().optional(),
  });
};

export function CreateAddressDialog() {
  const [open, setOpen] = useState(false);
  const addAddress = useMutation(api.cryptoAddresses.add);

  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(createFormSchema("btc")),
    defaultValues: {
      cryptoType: "btc",
      address: "",
      label: "",
    },
  });

  // Watch the cryptoType field to update validation schema
  const watchedCryptoType = form.watch("cryptoType");

  // Update resolver when crypto type changes
  const handleCryptoTypeChange = (value: CryptoType) => {
    form.setValue("cryptoType", value);
    // Clear address field when crypto type changes
    form.setValue("address", "");
    // Update the validation schema
    form.clearErrors("address");
  };

  const onSubmit = async (
    values: z.infer<ReturnType<typeof createFormSchema>>,
  ) => {
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
                        placeholder={CRYPTO_INFO[watchedCryptoType].placeholder}
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
