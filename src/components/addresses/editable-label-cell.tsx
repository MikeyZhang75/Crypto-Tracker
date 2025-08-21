"use client";

import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface EditableLabelCellProps {
  address: Doc<"cryptoAddresses">;
}

export function EditableLabelCell({ address }: EditableLabelCellProps) {
  const [value, setValue] = useState(address.label || "");
  const [isDirty, setIsDirty] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const updateAddress = useMutation(api.cryptoAddresses.update);

  // Update local state when address prop changes and not dirty
  useEffect(() => {
    if (!isDirty) {
      setValue(address.label || "");
    }
  }, [address.label, isDirty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only update if value has changed
    if (value === (address.label || "")) {
      setIsDirty(false);
      return;
    }

    try {
      await updateAddress({
        id: address._id,
        label: value || undefined,
      });
      toast.success("Label updated successfully");
      setIsDirty(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        toast.error(error.data.message || "Failed to update label");
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to update label",
        );
      }
      // Reset to original value on error
      setValue(address.label || "");
      setIsDirty(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setIsDirty(true);
  };

  const handleBlur = () => {
    // Submit form on blur if value has changed
    if (isDirty && formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <Label htmlFor={`${address._id}-label`} className="sr-only">
        Label
      </Label>
      <Input
        id={`${address._id}-label`}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Add label..."
        className="h-8 min-w-0 border-transparent bg-transparent shadow-none hover:bg-input/30 focus-visible:bg-background focus-visible:border dark:bg-transparent dark:hover:bg-input/30 dark:focus-visible:bg-input/30"
      />
    </form>
  );
}
