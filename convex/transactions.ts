import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";

// USDT contract address on Tron mainnet
const USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// Public query to list transactions by address
export const listByAddress = query({
  args: {
    addressId: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to view transactions",
      });
    }

    // Verify the address belongs to the user
    const address = await ctx.db.get(args.addressId);
    if (!address) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Address not found",
      });
    }

    if (address.userId !== userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You don't have permission to view these transactions",
      });
    }

    // Get all transactions for this address, ordered by timestamp descending
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_address_and_timestamp", (q) =>
        q.eq("addressId", args.addressId),
      )
      .order("desc")
      .collect();

    return transactions;
  },
});

// Public mutation to resend webhook for a transaction
export const resendWebhook = mutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to resend webhooks",
      });
    }

    // Get the transaction
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Transaction not found",
      });
    }

    // Verify the transaction belongs to the user
    if (transaction.userId !== userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You don't have permission to resend this webhook",
      });
    }

    // Reset the webhook sent status to trigger a resend
    await ctx.db.patch(args.transactionId, {
      webhookSent: false,
    });

    // Schedule the webhook to be sent immediately
    await ctx.scheduler.runAfter(0, internal.transactions.sendWebhook, {
      transactionId: args.transactionId,
    });

    return { success: true };
  },
});

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
    if (address.cryptoType !== "USDT") {
      console.log(`Unsupported crypto type ${address.cryptoType}`);
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
          cryptoType: "USDT",
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
        if (address.webhookUrl) {
          newTransactionIds.push({ _id: transactionId, hasWebhook: true });
        }
      }
    }

    // Schedule webhook calls for new transactions
    for (const { _id } of newTransactionIds) {
      await ctx.scheduler.runAfter(0, internal.transactions.sendWebhook, {
        transactionId: _id,
      });
    }

    // Schedule the next check
    const delay = args.error ? 30000 : 5000; // 30s on error, 5s normally
    await ctx.scheduler.runAfter(
      delay,
      internal.transactions.processTransactionFetch,
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

// Internal action to send webhook for a transaction
export const sendWebhook = internalAction({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    // Get the transaction details
    const transaction = await ctx.runQuery(
      internal.transactions.getTransaction,
      {
        transactionId: args.transactionId,
      },
    );

    if (!transaction) {
      console.log(`Transaction ${args.transactionId} not found`);
      return;
    }

    // Skip if webhook already sent
    if (transaction.webhookSent) {
      console.log(`Webhook already sent for transaction ${args.transactionId}`);
      return;
    }

    // Get the address details to get the webhook URL
    const address = await ctx.runQuery(internal.transactions.getAddress, {
      addressId: transaction.addressId,
    });

    if (!address || !address.webhookUrl) {
      console.log(
        `No webhook URL configured for address ${transaction.addressId}`,
      );
      return;
    }

    try {
      // Prepare the webhook payload
      const webhookPayload = {
        transactionId: transaction.transactionId,
        cryptoType: transaction.cryptoType,
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        timestamp: transaction.timestamp,
        blockNumber: transaction.blockNumber,
        fee: transaction.fee,
        status: transaction.status,
        type: transaction.type,
        receivedAt: transaction.createdAt,
      };

      // Send the webhook with verification code in header
      const response = await fetch(address.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CryptoTracker/1.0",
          "X-Webhook-Verification": address.webhookVerificationCode,
        },
        body: JSON.stringify(webhookPayload),
      });

      if (response.ok) {
        // Mark the webhook as sent
        await ctx.runMutation(internal.transactions.markWebhookSent, {
          transactionId: args.transactionId,
        });
        console.log(
          `Webhook sent successfully for transaction ${transaction.transactionId}`,
        );
      } else {
        console.error(
          `Webhook failed for transaction ${transaction.transactionId}: ${response.status} ${response.statusText}`,
        );
        // Optionally, you could implement retry logic here
      }
    } catch (error) {
      console.error(
        `Error sending webhook for transaction ${transaction.transactionId}:`,
        error,
      );
      // Optionally, you could implement retry logic here
    }
  },
});

// Internal query to get a transaction
export const getTransaction = internalQuery({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transactionId);
  },
});

// Internal mutation to mark webhook as sent
export const markWebhookSent = internalMutation({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      webhookSent: true,
    });
  },
});
