import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";

// USDT contract address on Tron mainnet
const USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// Type definition for TronGrid API response
interface TronGridTRC20Response {
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

// Helper function to fetch Tron USDT incoming transfers using TronGrid API
async function fetchTronUSDTTransfers(address: string, lastTimestamp = 0) {
  try {
    // TronGrid API endpoint for TRC20 transactions
    const apiUrl = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20`;

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
        // Add API key if available (optional for public endpoints)
        ...(process.env.TRONGRID_API_KEY && {
          "TRON-PRO-API-KEY": process.env.TRONGRID_API_KEY,
        }),
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

// Internal query to get address details
export const getAddress = internalQuery({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.addressId);
  },
});

// Internal query to get latest transaction timestamp
export const getLatestTransactionTimestamp = internalQuery({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    const latestTransaction = await ctx.db
      .query("transactions")
      .withIndex("by_address_and_timestamp", (q) =>
        q.eq("addressId", args.addressId),
      )
      .order("desc")
      .first();

    return latestTransaction
      ? latestTransaction.timestamp + 1 // Add 1ms to avoid duplicates
      : null;
  },
});

// Internal action to fetch transactions from external API
export const fetchTransactionsAction = internalAction({
  args: {
    addressId: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    // Get the address details
    const address = await ctx.runQuery(internal.cryptoTransfers.getAddress, {
      addressId: args.addressId,
    });

    if (!address) {
      console.log(`Address ${args.addressId} not found`);
      return { shouldContinue: false, transfers: [] };
    }

    // Check if we should continue listening
    if (!address.isListening) {
      console.log(`Listening disabled for address ${args.addressId}`);
      return { shouldContinue: false, transfers: [] };
    }

    // Only support USDT on Tron for now
    if (address.cryptoType !== "USDT") {
      console.log(`Unsupported crypto type ${address.cryptoType}`);
      return { shouldContinue: false, transfers: [] };
    }

    try {
      // Get the latest transaction timestamp
      const latestTimestamp = await ctx.runQuery(
        internal.cryptoTransfers.getLatestTransactionTimestamp,
        { addressId: args.addressId },
      );

      const minTimestamp = latestTimestamp || address.createdAt;

      // Fetch new transfers from TronGrid
      const transfers = await fetchTronUSDTTransfers(
        address.address,
        minTimestamp,
      );

      return { shouldContinue: true, transfers };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return { shouldContinue: true, transfers: [], error: true };
    }
  },
});

// Internal mutation to store transactions and schedule next fetch
export const storeTransactionsAndReschedule = internalMutation({
  args: {
    addressId: v.id("addresses"),
    transfers: v.array(v.any()),
    shouldContinue: v.boolean(),
    error: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.shouldContinue) {
      console.log(`Stopping scheduled function for address ${args.addressId}`);
      return;
    }

    // Store new transactions in the database
    const now = Date.now();
    const address = await ctx.db.get(args.addressId);

    if (!address) {
      console.log("Address not found, stopping");
      return;
    }

    for (const transfer of args.transfers) {
      // Check if transaction already exists (safety check)
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_address", (q) => q.eq("addressId", args.addressId))
        .filter((q) => q.eq(q.field("transactionId"), transfer.transaction_id))
        .first();

      if (!existing) {
        await ctx.db.insert("transactions", {
          addressId: args.addressId,
          userId: address.userId,
          transactionId: transfer.transaction_id,
          cryptoType: "USDT" as const,
          from: transfer.from,
          to: transfer.to,
          amount: transfer.value,
          timestamp: transfer.block_timestamp,
          type:
            transfer.to.toLowerCase() === address.address.toLowerCase()
              ? "received"
              : "sent",
          createdAt: now,
        });

        console.log(`Stored new transaction ${transfer.transaction_id}`);
      }
    }

    // Schedule the next check
    const delay = args.error ? 30000 : 5000; // 30s on error, 5s normally
    await ctx.scheduler.runAfter(
      delay,
      internal.cryptoTransfers.processTransactionFetch,
      { addressId: args.addressId },
    );
  },
});

// Internal action that combines fetch and store
export const processTransactionFetch = internalAction({
  args: {
    addressId: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    // Fetch transactions from external API
    const result = await ctx.runAction(
      internal.cryptoTransfers.fetchTransactionsAction,
      {
        addressId: args.addressId,
      },
    );

    // Store transactions and reschedule
    await ctx.runMutation(
      internal.cryptoTransfers.storeTransactionsAndReschedule,
      {
        addressId: args.addressId,
        transfers: result.transfers,
        shouldContinue: result.shouldContinue,
        error: result.error,
      },
    );
  },
});
