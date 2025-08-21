"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { columns } from "@/components/transactions/columns";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function AddressTransactionsPage() {
  const params = useParams();
  const addressId = params.id as Id<"addresses">;
  const router = useRouter();
  // Get transactions for this address
  const transactions = useQuery(api.transactions.listByAddress, {
    addressId,
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="h-4 w-4" />
          Back to Addresses
        </Button>
      </div>

      {/* Transactions Table */}
      <DataTable columns={columns} data={transactions || []} />
    </div>
  );
}
