import {
  type NetworkType,
  TOKEN_NETWORK_INFO,
  type TokenType,
} from "./constants";

// Validation function using token and network
export function validateTokenNetworkAddress(
  token: TokenType,
  network: NetworkType,
  address: string,
): boolean {
  const info = TOKEN_NETWORK_INFO.find(
    (info) => info.token === token && info.network === network,
  );
  if (!info) {
    return false;
  }
  return info.regex.test(address);
}
