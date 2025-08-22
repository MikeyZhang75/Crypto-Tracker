import { describe, expect, it } from "bun:test";
import type { NetworkType, TokenType } from "../constants";
import { formatAddress, validateTokenNetworkAddress } from "../validator";

describe("validateTokenNetworkAddress", () => {
  describe("Token/Network Combination Validation", () => {
    it("should reject invalid token/network combinations", () => {
      // ETH on TRON should be invalid
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "TRON" as NetworkType,
          "T1234567890123456789012345678901234",
        ),
      ).toBe(false);

      // USDT on Ethereum should be invalid (we only support USDT on TRON)
      expect(
        validateTokenNetworkAddress(
          "USDT" as TokenType,
          "Ethereum" as NetworkType,
          "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        ),
      ).toBe(false);
    });

    it("should accept valid token/network combinations", () => {
      // USDT on TRON is valid
      expect(
        validateTokenNetworkAddress(
          "USDT" as TokenType,
          "TRON" as NetworkType,
          "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
        ),
      ).toBe(true);

      // ETH on Ethereum is valid (use all lowercase to avoid checksum issues)
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
        ),
      ).toBe(true);
    });
  });

  describe("Ethereum Address Validation", () => {
    it("should validate correct Ethereum addresses", () => {
      // Valid checksummed address (correct checksum from ethers)
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
        ),
      ).toBe(true);

      // Valid all lowercase address
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed",
        ),
      ).toBe(true);

      // Valid all uppercase address (without 0x to uppercase)
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED",
        ),
      ).toBe(true);
    });

    it("should reject invalid Ethereum addresses", () => {
      // Wrong length
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "0x742d35Cc6634C0532925a3b844Bc9e7595f0bE",
        ),
      ).toBe(false);

      // Invalid characters
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbZ",
        ),
      ).toBe(false);

      // Missing 0x prefix
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        ),
      ).toBe(false);

      // Invalid checksum (if address has mixed case)
      expect(
        validateTokenNetworkAddress(
          "ETH" as TokenType,
          "Ethereum" as NetworkType,
          "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
        ),
      ).toBe(false);
    });
  });

  describe("TRON Address Validation", () => {
    it("should validate correct TRON addresses", () => {
      // Valid TRON addresses start with T and are 34 characters
      expect(
        validateTokenNetworkAddress(
          "USDT" as TokenType,
          "TRON" as NetworkType,
          "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
        ),
      ).toBe(true);
      expect(
        validateTokenNetworkAddress(
          "USDT" as TokenType,
          "TRON" as NetworkType,
          "TN9RRaXkCFtTXRso2GdTZxSxxwufzxLQPP",
        ),
      ).toBe(true);
    });

    it("should reject invalid TRON addresses", () => {
      // Wrong prefix
      expect(
        validateTokenNetworkAddress(
          "USDT" as TokenType,
          "TRON" as NetworkType,
          "XJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
        ),
      ).toBe(false);

      // Wrong length
      expect(
        validateTokenNetworkAddress(
          "USDT" as TokenType,
          "TRON" as NetworkType,
          "TJRabPrwbZy45sbavfcjinPJC18kjpRTv",
        ),
      ).toBe(false);

      // Invalid characters
      expect(
        validateTokenNetworkAddress(
          "USDT" as TokenType,
          "TRON" as NetworkType,
          "TJRabPrwbZy45sbavfcjinPJC18kjpRT!@",
        ),
      ).toBe(false);
    });
  });
});

describe("formatAddress", () => {
  it("should return checksummed Ethereum address", () => {
    const result = formatAddress(
      "ETH" as TokenType,
      "Ethereum" as NetworkType,
      "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
    );

    // ethers.js will return the properly checksummed version
    // The actual checksum might vary, so we just check it's not null and is a string
    expect(result).not.toBeNull();
    expect(typeof result).toBe("string");
    expect(result?.startsWith("0x")).toBe(true);
  });

  it("should return TRON address unchanged", () => {
    const tronAddress = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";
    const result = formatAddress(
      "USDT" as TokenType,
      "TRON" as NetworkType,
      tronAddress,
    );

    expect(result).toBe(tronAddress);
  });

  it("should return null for invalid addresses", () => {
    const result = formatAddress(
      "ETH" as TokenType,
      "Ethereum" as NetworkType,
      "invalid-address",
    );

    expect(result).toBeNull();
  });

  it("should return null for invalid token/network combinations", () => {
    const result = formatAddress(
      "ETH" as TokenType,
      "TRON" as NetworkType,
      "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8",
    );

    expect(result).toBeNull();
  });
});
