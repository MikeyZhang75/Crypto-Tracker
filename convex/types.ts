// Type definition for TronGrid API response
export interface TronGridTRC20Response {
  data: Array<{
    transaction_id: string;
    token_info: {
      symbol: string;
      address: string;
      decimals: number;
      name: string;
    };
    block_timestamp: number;
    from: string;
    to: string;
    type: string;
    value: string;
  }>;
  success: boolean;
  meta: {
    at: number;
    page_size: number;
    fingerprint?: string;
    links?: {
      next?: string;
    };
  };
}
