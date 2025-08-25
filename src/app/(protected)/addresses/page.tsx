"use client";

import { useQuery } from "convex/react";
import { useAddressColumns } from "@/components/addresses/columns-provider";
import { CreateAddressDialog } from "@/components/addresses/create-address-dialog";
import { DataTable } from "@/components/custom-ui/data-table";
import { api } from "@/convex/_generated/api";

export default function AddressesPage() {
  const addresses = useQuery(api.addresses.list, {});
  const columns = useAddressColumns();

  return (
    <>
      <div className="flex justify-end">
        <CreateAddressDialog />
      </div>

      <DataTable columns={columns} data={addresses || []} />
    </>
  );
}
