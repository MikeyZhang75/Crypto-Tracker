// Define supported tokens and networks
export const SUPPORTED_TOKENS = ["USDT", "ETH"] as const;
export const SUPPORTED_NETWORKS = ["TRON", "Ethereum"] as const;

// Type definitions
export type TokenType = (typeof SUPPORTED_TOKENS)[number];
export type NetworkType = (typeof SUPPORTED_NETWORKS)[number];

// Define TokenNetworkInfo interface
export interface TokenNetworkInfo {
  token: TokenType;
  network: NetworkType;
  name: string;
  placeholder: string;
  displayName: string;
  regex: RegExp;
}

// Valid Token/Network combinations with metadata
// This is the single source of truth for what combinations are allowed
export const TOKEN_NETWORK_INFO = [
  {
    token: "USDT" as TokenType,
    network: "TRON" as NetworkType,
    name: "Tether (TRC-20)",
    placeholder: "T... (TRC-20 address)",
    displayName: "USDT on TRON",
    regex: /^T[a-zA-Z0-9]{33}$/,
  },
  {
    token: "ETH" as TokenType,
    network: "Ethereum" as NetworkType,
    name: "Ethereum",
    placeholder: "0x... (Ethereum address)",
    displayName: "ETH on Ethereum",
    regex: /^0x[a-fA-F0-9]{40}$/,
  },
] as const satisfies TokenNetworkInfo[];

// Helper function to get token/network info
export function getTokenNetworkInfo(
  token: TokenType,
  network: NetworkType,
): TokenNetworkInfo | undefined {
  return TOKEN_NETWORK_INFO.find(
    (info) => info.token === token && info.network === network,
  );
}

// Helper function to check if a combination is valid
export function isValidTokenNetworkCombination(
  token: TokenType,
  network: NetworkType,
): boolean {
  return getTokenNetworkInfo(token, network) !== undefined;
}

// Helper function to get valid networks for a token
export function getValidNetworksForToken(token: TokenType): NetworkType[] {
  return TOKEN_NETWORK_INFO.filter((info) => info.token === token).map(
    (info) => info.network,
  );
}

// Helper function to get valid tokens for a network
export function getValidTokensForNetwork(network: NetworkType): TokenType[] {
  return TOKEN_NETWORK_INFO.filter((info) => info.network === network).map(
    (info) => info.token,
  );
}

// Options for UI dropdowns
export const TOKEN_NETWORK_OPTIONS = TOKEN_NETWORK_INFO.map((info) => ({
  value: `${info.token}_${info.network}`,
  token: info.token,
  network: info.network,
  name: info.displayName,
}));
