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

// Type definition for Etherscan API response
export interface EtherscanApiResponse {
  status: string;
  message: string;
  result: Array<{
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    gasUsed: string;
    confirmations: string;
  }>;
}
