import {
  getTokenNetworkInfo,
  isValidTokenNetworkCombination,
  type NetworkType,
  type TokenType,
} from "./constants";

// Validation function using token and network
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

  // Validate the address format
  return info.regex.test(address);
}
