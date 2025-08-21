"use client";

import { CryptoSelector } from "@/components/crypto/crypto-selector";

export default function ProtectedPage() {
  return (
    <div className="container mx-auto p-6 max-w-md">
      <CryptoSelector />
    </div>
  );
}
