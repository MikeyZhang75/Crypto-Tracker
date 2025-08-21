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

// Public mutation to resend webhook for a transaction
export const resend = mutation({
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
    await ctx.scheduler.runAfter(0, internal.webhooks.send, {
      transactionId: args.transactionId,
    });

    return { success: true };
  },
});

// Internal action to send webhook for a transaction
export const send = internalAction({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    // Get the transaction details
    const transaction = await ctx.runQuery(internal.webhooks.getTransaction, {
      transactionId: args.transactionId,
    });

    if (!transaction) {
      console.log(`Transaction ${args.transactionId} not found`);
      return;
    }

    // Skip if webhook already sent successfully
    if (transaction.webhookSent) {
      console.log(`Webhook already sent for transaction ${args.transactionId}`);
      return;
    }

    // Get the address details to get the webhook URL
    const address = await ctx.runQuery(internal.webhooks.getAddress, {
      addressId: transaction.addressId,
    });

    if (!address || !address.webhookUrl) {
      console.log(
        `No webhook URL configured for address ${transaction.addressId}`,
      );
      return;
    }

    // Get the attempt number (count existing logs + 1)
    const existingLogs = await ctx.runQuery(
      internal.webhooks.getWebhookLogCount,
      {
        transactionId: args.transactionId,
      },
    );
    const attemptNumber = existingLogs + 1;

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

    const sentAt = Date.now();
    let webhookLogId: Id<"webhookLogs"> | null = null;

    try {
      // Create a pending log entry
      webhookLogId = await ctx.runMutation(internal.webhooks.createWebhookLog, {
        transactionId: args.transactionId,
        addressId: transaction.addressId,
        userId: transaction.userId,
        webhookUrl: address.webhookUrl,
        status: "pending",
        requestPayload: JSON.stringify(webhookPayload),
        attemptNumber,
        sentAt,
      });

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

      let responseBody: string | undefined;
      try {
        responseBody = await response.text();
      } catch {
        // Ignore if response body can't be read
      }

      if (response.ok) {
        // Mark the webhook as sent
        await ctx.runMutation(internal.webhooks.markWebhookSent, {
          transactionId: args.transactionId,
        });

        // Update the log entry as successful
        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          webhookLogId,
          status: "success",
          statusCode: response.status,
          responseBody,
        });

        console.log(
          `Webhook sent successfully for transaction ${transaction.transactionId}`,
        );
      } else {
        // Update the log entry as failed
        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          webhookLogId,
          status: "failed",
          statusCode: response.status,
          errorMessage: `HTTP ${response.status}: ${response.statusText}`,
          responseBody,
        });

        console.error(
          `Webhook failed for transaction ${transaction.transactionId}: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      // Update the log entry as failed
      if (webhookLogId) {
        await ctx.runMutation(internal.webhooks.updateWebhookLog, {
          webhookLogId,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      console.error(
        `Error sending webhook for transaction ${transaction.transactionId}:`,
        error,
      );
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

// Internal query to get address details
export const getAddress = internalQuery({
  args: { addressId: v.id("addresses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.addressId);
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

// Internal query to get webhook log count for a transaction
export const getWebhookLogCount = internalQuery({
  args: { transactionId: v.id("transactions") },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("webhookLogs")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .collect();
    return logs.length;
  },
});

// Internal mutation to create a webhook log
export const createWebhookLog = internalMutation({
  args: {
    transactionId: v.id("transactions"),
    addressId: v.id("addresses"),
    userId: v.id("users"),
    webhookUrl: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("pending"),
    ),
    requestPayload: v.string(),
    attemptNumber: v.number(),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookLogs", args);
  },
});

// Internal mutation to update a webhook log
export const updateWebhookLog = internalMutation({
  args: {
    webhookLogId: v.id("webhookLogs"),
    status: v.union(v.literal("success"), v.literal("failed")),
    statusCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    responseBody: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { webhookLogId, ...updates } = args;
    await ctx.db.patch(webhookLogId, updates);
  },
});

// Public query to get webhook logs for a transaction
export const getWebhookLogs = query({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to view webhook logs",
      });
    }

    // Verify the transaction belongs to the user
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Transaction not found",
      });
    }

    if (transaction.userId !== userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You don't have permission to view these webhook logs",
      });
    }

    // Get all webhook logs for this transaction, ordered by sent time descending
    const logs = await ctx.db
      .query("webhookLogs")
      .withIndex("by_transaction", (q) =>
        q.eq("transactionId", args.transactionId),
      )
      .order("desc")
      .collect();

    return logs;
  },
});
