import type { EtherscanApiResponse, TronGridTRC20Response } from "./types";

// USDT contract address on Tron mainnet
const USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// Helper function to fetch Tron USDT incoming transfers using TronGrid API
export async function fetchTronUSDTTransfers(
  address: string,
  lastTimestamp = 0,
) {
  try {
    // TronGrid API endpoint for TRC20 transactions
    const apiUrl = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`;
    const apiKey = process.env.TRONGRID_API_KEY;

    if (!apiKey) {
      throw new Error("TRONGRID_API_KEY is not set");
    }

    const params = new URLSearchParams({
      limit: "10",
      contract_address: USDT_CONTRACT_ADDRESS,
      only_confirmed: "true", // Only get confirmed transactions
      only_to: "true", // Only get transfers to the address
      min_timestamp: lastTimestamp.toString(),
    });

    // Fetch TRC20 transactions for the address, filtered by USDT contract
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "TRON-PRO-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`TronGrid API error: ${response.statusText}`);
    }

    const data: TronGridTRC20Response = await response.json();

    return data.data;
  } catch (error) {
    console.error("Error fetching Tron USDT transfers:", error);
    throw error; // Re-throw the error instead of returning mock data
  }
}

// Helper function to fetch Ethereum ETH transfers using Etherscan API
export async function fetchEthereumETHTransfers(
  address: string,
  lastTimestamp = 0,
) {
  try {
    const apiKey = process.env.ETHERSCAN_API_KEY;

    if (!apiKey) {
      throw new Error("ETHERSCAN_API_KEY is not set");
    }

    const apiUrl = "https://api.etherscan.io/api";

    // If we have a lastTimestamp, first convert it to a block number
    let startBlock = "0";
    if (lastTimestamp > 0) {
      // Convert timestamp to Unix seconds (Etherscan expects seconds, not milliseconds)
      const timestampInSeconds = Math.floor(lastTimestamp / 1000);

      // Get the block number for the given timestamp
      const blockParams = new URLSearchParams({
        module: "block",
        action: "getblocknobytime",
        timestamp: timestampInSeconds.toString(),
        closest: "after", // Get the block after this timestamp
        apikey: apiKey,
      });

      const blockResponse = await fetch(`${apiUrl}?${blockParams.toString()}`);
      if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        if (blockData.status === "1" && blockData.result) {
          startBlock = blockData.result;
          console.log(
            `Using startBlock ${startBlock} for timestamp ${lastTimestamp}`,
          );
        }
      }
    }

    // Fetch transactions with the calculated startBlock
    const params = new URLSearchParams({
      module: "account",
      action: "txlist",
      address: address,
      startblock: startBlock,
      endblock: "99999999",
      page: "1",
      offset: "10",
      sort: "desc",
      apikey: apiKey,
    });

    // Fetch ETH transactions for the address
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.statusText}`);
    }

    const data: EtherscanApiResponse = await response.json();

    console.log(data);

    if (data.status !== "1") {
      if (data.message === "No transactions found") {
        return [];
      }
      throw new Error(`Etherscan API error: ${data.message}`);
    }

    // Filter for incoming successful transactions only
    // No need to filter by timestamp since we're using startBlock
    const filteredTransactions = data.result.filter((tx) => {
      return (
        tx.to.toLowerCase() === address.toLowerCase() && tx.isError === "0" // Only successful transactions
      );
    });

    return filteredTransactions;
  } catch (error) {
    console.error("Error fetching Ethereum ETH transfers:", error);
    throw error;
  }
}
