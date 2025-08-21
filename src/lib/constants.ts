export type CryptoType = "btc" | "usdt" | "ltc";

export interface CryptoInfo {
  name: string;
  symbol: string;
  placeholder: string;
  color: string;
}

export const CRYPTO_INFO: Record<CryptoType, CryptoInfo> = {
  btc: {
    name: "Bitcoin",
    symbol: "BTC",
    placeholder: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa or bc1...",
    color: "bg-orange-500",
  },
  usdt: {
    name: "Tether",
    symbol: "USDT",
    placeholder: "0x... (ERC-20) or T... (TRC-20)",
    color: "bg-green-500",
  },
  ltc: {
    name: "Litecoin",
    symbol: "LTC",
    placeholder: "L... or M... or ltc1...",
    color: "bg-gray-500",
  },
};

export const CRYPTO_OPTIONS = Object.entries(CRYPTO_INFO).map(
  ([key, info]) => ({
    value: key,
    symbol: info.symbol,
    name: info.name,
  }),
);
