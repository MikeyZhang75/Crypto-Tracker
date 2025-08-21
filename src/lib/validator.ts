import type { CryptoType } from "./constants";

// Utility function to validate crypto addresses
export function validateCryptoAddress(
  type: CryptoType,
  address: string,
): boolean {
  switch (type) {
    case "BTC":
      // Bitcoin address validation (simplified)
      // P2PKH: starts with 1, P2SH: starts with 3, Bech32: starts with bc1
      return (
        /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) ||
        /^bc1[a-z0-9]{39,59}$/.test(address)
      );

    case "LTC":
      // Litecoin address validation (simplified)
      // Legacy: starts with L or M, SegWit: starts with ltc1
      return (
        /^[LM][a-km-zA-HJ-NP-Z1-9]{26,33}$/.test(address) ||
        /^ltc1[a-z0-9]{39,59}$/.test(address)
      );

    case "USDT":
      // USDT can be on multiple chains, we'll accept common formats
      // Ethereum/ERC-20: 0x followed by 40 hex characters
      // TRC-20 (Tron): starts with T
      // For simplicity, we'll accept both
      return (
        /^0x[a-fA-F0-9]{40}$/.test(address) ||
        /^T[a-zA-Z0-9]{33}$/.test(address)
      );

    default:
      return false;
  }
}
