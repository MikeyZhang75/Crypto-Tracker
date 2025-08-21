"use client";

import { useQuery } from "convex/react";
import { columns } from "@/components/addresses/columns";
import { CreateAddressDialog } from "@/components/addresses/create-address-dialog";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/convex/_generated/api";

export default function AddressesPage() {
  const addresses = useQuery(api.cryptoAddresses.list, {});

  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Crypto Address Management</h1>
        <CreateAddressDialog />
      </div>

      {addresses ? (
        <DataTable
          columns={columns}
          data={addresses}
          emptyMessage="No addresses added yet. Click 'Add Address' to get started."
        />
      ) : (
        <div className="rounded-md border">
          <div className="p-8 text-center text-muted-foreground">
            Loading addresses...
          </div>
        </div>
      )}
    </>
  );
}
