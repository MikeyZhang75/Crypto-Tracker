import { describe, expect, it, mock } from "bun:test";

// Mock the environment module before importing blockchains
mock.module("@/lib/env", () => ({
  env: {
    ETHERSCAN_API_KEY: "FEDWHUK21P9IZKNZ5A2864KZXKZ4RRX2KR",
    TRONGRID_API_KEY: "55d94040-d965-47b2-8939-6d8de46df01e",
    NEXT_PUBLIC_CONVEX_URL: "https://test.convex.cloud",
  },
}));

describe("blockchains", () => {
  it("should fetch Ethereum ETH transfers", async () => {
    // Import after mocking
    const { fetchEthereumETHTransfers } = await import("../blockchains");

    const transfers = await fetchEthereumETHTransfers(
      "0x73f7b1184B5cD361cC0f7654998953E2a251dd58",
    );

    expect(transfers).toBeDefined();
    expect(Array.isArray(transfers)).toBe(true);
  });
});
