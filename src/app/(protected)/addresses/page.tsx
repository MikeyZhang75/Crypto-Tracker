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
      <div className="flex justify-end">
        <CreateAddressDialog />
      </div>

      <DataTable columns={columns} data={addresses || []} />
    </>
  );
}
