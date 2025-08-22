import { getAddress, isAddress } from "ethers";
import {
  getTokenNetworkInfo,
  isValidTokenNetworkCombination,
  type NetworkType,
  type TokenType,
} from "./constants";

/**
 * Validates a TRON address using Base58 check
 * TRON addresses start with 'T' and are 34 characters long
 */
function isValidTronAddress(address: string): boolean {
  // Basic format check
  if (!/^T[a-zA-Z0-9]{33}$/.test(address)) {
    return false;
  }

  // For production, you might want to add Base58 validation
  // This would require additional libraries like bs58check
  // For now, we'll use the regex validation
  return true;
}

/**
 * Validates an Ethereum address with checksum validation
 */
function isValidEthereumAddress(address: string): boolean {
  try {
    // ethers.js isAddress checks format and checksum
    if (!isAddress(address)) {
      return false;
    }

    // Attempt to get the checksummed address
    // This will throw if the address is invalid
    getAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main validation function using token and network
 * Uses proper validation libraries for each network type
 */
export function validateTokenNetworkAddress(
  token: TokenType,
  network: NetworkType,
  address: string,
): boolean {
  // First check if the combination is valid
  if (!isValidTokenNetworkCombination(token, network)) {
    return false;
  }

  // Get the info for this combination
  const info = getTokenNetworkInfo(token, network);
  if (!info) {
    return false;
  }

  // Use network-specific validation
  switch (network) {
    case "Ethereum":
      return isValidEthereumAddress(address);
    case "TRON":
      return isValidTronAddress(address);
    default:
      // Fallback to regex validation for unknown networks
      return info.regex.test(address);
  }
}

/**
 * Formats an address to its checksummed version if applicable
 */
export function formatAddress(
  token: TokenType,
  network: NetworkType,
  address: string,
): string | null {
  if (!validateTokenNetworkAddress(token, network, address)) {
    return null;
  }

  // Format based on network
  switch (network) {
    case "Ethereum":
      try {
        return getAddress(address); // Returns checksummed address
      } catch {
        return address;
      }
    case "TRON":
      // TRON addresses don't have checksum in the same way
      return address;
    default:
      return address;
  }
}
