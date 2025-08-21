// Define the array with const assertion for literal types
export const CRYPTO_INFO = [
  {
    name: "Bitcoin",
    symbol: "BTC",
    placeholder: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa or bc1...",
    color: "bg-orange-500",
  },
  {
    name: "Tether",
    symbol: "USDT",
    placeholder: "0x... (ERC-20) or T... (TRC-20)",
    color: "bg-green-500",
  },
  {
    name: "Litecoin",
    symbol: "LTC",
    placeholder: "L... or M... or ltc1...",
    color: "bg-gray-500",
  },
] as const;

// Derive CryptoType as a union of literal types: "BTC" | "USDT" | "LTC"
export type CryptoType = (typeof CRYPTO_INFO)[number]["symbol"];

// Define CryptoInfo interface based on the actual array structure
export interface CryptoInfo {
  name: string;
  symbol: CryptoType;
  placeholder: string;
  color: string;
}

// Helper function to get crypto info by symbol
export function getCryptoInfo(symbol: CryptoType): CryptoInfo | undefined {
  return CRYPTO_INFO.find((info) => info.symbol === symbol) as
    | CryptoInfo
    | undefined;
}

export const CRYPTO_OPTIONS = CRYPTO_INFO.map((info) => ({
  value: info.symbol,
  symbol: info.symbol,
  name: info.name,
}));

// Create a properly typed array of symbols
export const CRYPTO_SYMBOLS = CRYPTO_INFO.map((info) => info.symbol);
