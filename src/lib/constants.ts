// Define supported tokens and networks
export const SUPPORTED_TOKENS = ["USDT"] as const;
export const SUPPORTED_NETWORKS = ["TRON"] as const;

// Type definitions
export type TokenType = (typeof SUPPORTED_TOKENS)[number];
export type NetworkType = (typeof SUPPORTED_NETWORKS)[number];

// Define TokenNetworkInfo interface
export interface TokenNetworkInfo {
  token: TokenType;
  network: NetworkType;
  name: string;
  placeholder: string;
  color: string;
  displayName: string;
  regex: RegExp;
}

// Token/Network combinations with metadata
export const TOKEN_NETWORK_INFO = [
  {
    token: "USDT" as TokenType,
    network: "TRON" as NetworkType,
    name: "Tether (TRC-20)",
    placeholder: "T... (TRC-20 address)",
    color: "bg-green-500",
    displayName: "USDT on TRON",
    regex: /^T[a-zA-Z0-9]{33}$/,
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

// Options for UI dropdowns
export const TOKEN_NETWORK_OPTIONS = TOKEN_NETWORK_INFO.map((info) => ({
  value: `${info.token}_${info.network}`,
  token: info.token,
  network: info.network,
  name: info.displayName,
}));
