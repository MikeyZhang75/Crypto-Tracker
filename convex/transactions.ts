import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import type { TronGridTRC20Response } from "./types";

// USDT contract address on Tron mainnet
const USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// Public query to list transactions by address string
export const listByAddressString = query({
  args: {
    address: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to view transactions",
      });
    }

    // Find the address by string
    const addressRecord = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("address"), args.address))
      .first();

    if (!addressRecord) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Address not found",
      });
    }

    // Get all transactions for this address, ordered by timestamp descending
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_address_and_timestamp", (q) =>
        q.eq("addressId", addressRecord._id),
      )
      .order("desc")
      .collect();

    return transactions;
  },
});

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
    const address = await ctx.runQuery(internal.transactions.getAddress, {
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
    if (address.token !== "USDT" || address.network !== "TRON") {
      console.log(
        `Unsupported token/network ${address.token}/${address.network}`,
      );
      return { shouldContinue: false, transfers: [] };
    }

    try {
      // Get the latest transaction timestamp
      const latestTimestamp = await ctx.runQuery(
        internal.transactions.getLatestTransactionTimestamp,
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
    // Find the scheduled function tracking record
    const scheduledFunction = await ctx.db
      .query("scheduledFunctions")
      .withIndex("by_address_and_function", (q) =>
        q
          .eq("addressId", args.addressId)
          .eq("functionName", "processTransactionFetch"),
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "active"),
          q.eq(q.field("status"), "stopping"),
        ),
      )
      .first();

    if (!args.shouldContinue || scheduledFunction?.status === "stopping") {
      console.log(`Stopping scheduled function for address ${args.addressId}`);

      // Mark the scheduled function as stopped
      if (scheduledFunction) {
        await ctx.db.patch(scheduledFunction._id, {
          status: "stopped",
          lastRunAt: Date.now(),
        });
      }
      return;
    }

    // Store new transactions in the database
    const now = Date.now();
    const address = await ctx.db.get(args.addressId);

    if (!address) {
      console.log("Address not found, stopping");

      // Mark the scheduled function as stopped if address is deleted
      if (scheduledFunction) {
        await ctx.db.patch(scheduledFunction._id, {
          status: "stopped",
          lastRunAt: Date.now(),
        });
      }
      return;
    }

    const newTransactionIds: Array<{
      _id: Id<"transactions">;
      hasWebhook: boolean;
    }> = [];

    for (const transfer of args.transfers) {
      // Check if transaction already exists (safety check)
      const existing = await ctx.db
        .query("transactions")
        .withIndex("by_address", (q) => q.eq("addressId", args.addressId))
        .filter((q) => q.eq(q.field("transactionId"), transfer.transaction_id))
        .first();

      if (!existing) {
        const transactionId = await ctx.db.insert("transactions", {
          addressId: args.addressId,
          userId: address.userId,
          transactionId: transfer.transaction_id,
          token: "USDT",
          network: "TRON",
          from: transfer.from,
          to: transfer.to,
          amount: transfer.value,
          timestamp: transfer.block_timestamp,
          type:
            transfer.to.toLowerCase() === address.address.toLowerCase()
              ? "received"
              : "sent",
          webhookSent: false,
          createdAt: now,
        });

        console.log(`Stored new transaction ${transfer.transaction_id}`);

        // Track new transactions that need webhook calls
        if (address.webhook) {
          newTransactionIds.push({ _id: transactionId, hasWebhook: true });
        }
      }
    }

    // Schedule webhook calls for new transactions
    for (const { _id } of newTransactionIds) {
      await ctx.scheduler.runAfter(0, internal.webhooks.send, {
        transactionId: _id,
      });
    }

    // Update the scheduled function tracking record and schedule next run
    if (scheduledFunction && scheduledFunction.status === "active") {
      const now = Date.now();
      const delay = args.error ? 30000 : 5000; // 30s on error, 5s normally

      await ctx.db.patch(scheduledFunction._id, {
        lastRunAt: now,
        nextRunAt: now + delay,
        runCount: scheduledFunction.runCount + 1,
        errorCount: args.error
          ? (scheduledFunction.errorCount || 0) + 1
          : scheduledFunction.errorCount,
        lastError: args.error ? "Failed to fetch transactions" : undefined,
      });

      // Schedule the next check
      await ctx.scheduler.runAfter(
        delay,
        internal.transactions.processTransactionFetch,
        { addressId: args.addressId },
      );
    } else {
      console.log(
        `No active scheduled function found for address ${args.addressId}, not rescheduling`,
      );
    }
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
      internal.transactions.fetchTransactionsAction,
      {
        addressId: args.addressId,
      },
    );

    // Store transactions and reschedule
    await ctx.runMutation(
      internal.transactions.storeTransactionsAndReschedule,
      {
        addressId: args.addressId,
        transfers: result.transfers,
        shouldContinue: result.shouldContinue,
        error: result.error,
      },
    );
  },
});
