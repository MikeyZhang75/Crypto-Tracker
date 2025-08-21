"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DataTable } from "@/components/custom-ui/data-table";
import { columns } from "@/components/transactions/columns";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

export default function AddressTransactionsPage() {
  const params = useParams();
  const address = decodeURIComponent(params.address as string);
  // Get transactions for this address
  const transactions = useQuery(api.transactions.listByAddressString, {
    address,
  });

  return (
    <>
      {/* Back button */}
      <div className="flex items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/addresses">
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      {/* Transactions Table */}
      <DataTable columns={columns} data={transactions || []} />
    </>
  );
}
