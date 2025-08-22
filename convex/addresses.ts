import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { CRYPTO_SYMBOLS } from "@/lib/constants";
import { generateVerificationCode } from "@/lib/generator";
import { validateCryptoAddress } from "@/lib/validator";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";

export const getScheduledFunctionStatus = query({
  args: {
    addressId: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to view scheduled function status",
      });
    }

    // Verify the address belongs to the user
    const address = await ctx.db.get(args.addressId);
    if (!address || address.userId !== userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You don't have permission to view this address",
      });
    }

    // Get the active scheduled function for this address
    const scheduledFunction = await ctx.db
      .query("scheduledFunctions")
      .withIndex("by_address_and_function", (q) =>
        q.eq("addressId", args.addressId).eq("functionName", "processTransactionFetch")
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return scheduledFunction;
  },
});

export const list = query({
  args: {
    cryptoType: v.optional(
      v.union(...CRYPTO_SYMBOLS.map((symbol) => v.literal(symbol))),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to access crypto addresses",
      });
    }

    const query = ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    const addresses = await query.collect();

    if (args.cryptoType) {
      return addresses.filter((addr) => addr.cryptoType === args.cryptoType);
    }

    return addresses;
  },
});

export const add = mutation({
  args: {
    cryptoType: v.union(...CRYPTO_SYMBOLS.map((symbol) => v.literal(symbol))),
    address: v.string(),
    label: v.optional(v.string()),
    webhookUrl: v.string(),
    webhookVerificationCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to access crypto addresses",
      });
    }

    // Validate address format based on crypto type
    if (!validateCryptoAddress(args.cryptoType, args.address)) {
      throw new ConvexError({
        code: "INVALID_ADDRESS",
        message: `Invalid ${args.cryptoType} address format`,
      });
    }

    // Check if address already exists for this user
    const existing = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("cryptoType"), args.cryptoType),
          q.eq(q.field("address"), args.address),
        ),
      )
      .first();

    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE_ADDRESS",
        message: "This address has already been added to your account",
      });
    }

    const now = Date.now();
    // Use provided verification code or generate a new one
    const verificationCode =
      args.webhookVerificationCode || generateVerificationCode();

    return await ctx.db.insert("addresses", {
      userId: userId,
      cryptoType: args.cryptoType,
      address: args.address,
      label: args.label,
      webhookUrl: args.webhookUrl,
      webhookVerificationCode: verificationCode,
      isListening: false, // Default to not listening
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("addresses"),
    label: v.optional(v.string()),
    webhookUrl: v.string(),
    webhookVerificationCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to access crypto addresses",
      });
    }

    const address = await ctx.db.get(args.id);
    if (!address) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Address not found",
        addressId: args.id,
      });
    }
    if (address.userId !== userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You don't have permission to modify this address",
        addressId: args.id,
      });
    }

    // Always include the label and webhookUrl in updates, even if they're undefined
    // This allows clearing them by setting to undefined
    // For verification code, only update if provided, otherwise keep existing
    const updates: {
      updatedAt: number;
      label?: string;
      webhookUrl?: string;
      webhookVerificationCode?: string;
    } = {
      updatedAt: Date.now(),
      label: args.label,
      webhookUrl: args.webhookUrl,
    };

    // Only update verification code if explicitly provided
    if (args.webhookVerificationCode !== undefined) {
      updates.webhookVerificationCode =
        args.webhookVerificationCode || generateVerificationCode();
    }

    return await ctx.db.patch(args.id, updates);
  },
});

export const toggleListening = mutation({
  args: {
    id: v.id("addresses"),
    isListening: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to toggle listening",
      });
    }

    const address = await ctx.db.get(args.id);
    if (!address) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Address not found",
      });
    }
    if (address.userId !== userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You don't have permission to modify this address",
      });
    }

    // Update the listening status
    await ctx.db.patch(args.id, {
      isListening: args.isListening,
      updatedAt: Date.now(),
    });

    // If enabling listening, schedule the transaction fetcher only if not already running
    if (args.isListening) {
      // Check if there's already an active scheduled function for this address
      const existingSchedule = await ctx.db
        .query("scheduledFunctions")
        .withIndex("by_address_and_function", (q) =>
          q.eq("addressId", args.id).eq("functionName", "processTransactionFetch")
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (!existingSchedule) {
        // Create a tracking record for the scheduled function
        const now = Date.now();
        await ctx.db.insert("scheduledFunctions", {
          addressId: args.id,
          userId: userId,
          functionName: "processTransactionFetch",
          status: "active",
          startedAt: now,
          lastRunAt: now,
          runCount: 0,
        });
        
        // Schedule the transaction fetcher to run immediately
        await ctx.scheduler.runAfter(
          0,
          internal.transactions.processTransactionFetch,
          {
            addressId: args.id,
          },
        );
        
        console.log(`Started scheduled function for address ${args.id}`);
      } else {
        console.log(`Scheduled function already active for address ${args.id} (started ${new Date(existingSchedule.startedAt).toISOString()})`);
      }
    } else {
      // If disabling, mark any active scheduled functions as stopping
      const activeSchedules = await ctx.db
        .query("scheduledFunctions")
        .withIndex("by_address_and_function", (q) =>
          q.eq("addressId", args.id).eq("functionName", "processTransactionFetch")
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
      
      for (const schedule of activeSchedules) {
        await ctx.db.patch(schedule._id, {
          status: "stopping",
        });
      }
    }
    // The scheduled function will check isListening and update its status accordingly

    return { success: true };
  },
});

// Restart scheduled functions for addresses that should be listening
// This is useful after system restarts or crashes
export const restartListeningAddresses = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to restart listening addresses",
      });
    }

    // Find all addresses that should be listening
    const listeningAddresses = await ctx.db
      .query("addresses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isListening"), true))
      .collect();

    let restartedCount = 0;
    const now = Date.now();

    for (const address of listeningAddresses) {
      // Check if there's already an active scheduled function
      const existingSchedule = await ctx.db
        .query("scheduledFunctions")
        .withIndex("by_address_and_function", (q) =>
          q.eq("addressId", address._id).eq("functionName", "processTransactionFetch")
        )
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();

      if (!existingSchedule) {
        // No active scheduled function, but user wants listening enabled
        // Create a new scheduled function
        await ctx.db.insert("scheduledFunctions", {
          addressId: address._id,
          userId: userId,
          functionName: "processTransactionFetch",
          status: "active",
          startedAt: now,
          lastRunAt: now,
          runCount: 0,
        });

        // Schedule the transaction fetcher
        await ctx.scheduler.runAfter(
          0,
          internal.transactions.processTransactionFetch,
          {
            addressId: address._id,
          },
        );

        restartedCount++;
        console.log(`Restarted scheduled function for address ${address._id}`);
      }
    }

    return { 
      restartedCount, 
      totalListening: listeningAddresses.length,
      message: `Restarted ${restartedCount} scheduled functions out of ${listeningAddresses.length} listening addresses`
    };
  },
});

export const cleanupStaleScheduledFunctions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to cleanup scheduled functions",
      });
    }

    // Find all scheduled functions for this user that are stale
    // Consider a function stale if it's been more than 1 minute since lastRunAt
    // and it's still marked as active (likely means it crashed)
    const staleThreshold = Date.now() - 60000; // 1 minute ago
    
    const staleFunctions = await ctx.db
      .query("scheduledFunctions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "active"),
          q.lt(q.field("lastRunAt"), staleThreshold)
        )
      )
      .collect();

    let cleanedCount = 0;
    for (const sf of staleFunctions) {
      // Check if the address still exists and is listening
      const address = await ctx.db.get(sf.addressId);
      if (!address || !address.isListening) {
        // Mark as stopped if address is gone or not listening
        await ctx.db.patch(sf._id, {
          status: "stopped",
          lastRunAt: Date.now(),
        });
        cleanedCount++;
      }
    }

    return { cleanedCount, staleFunctions: staleFunctions.length };
  },
});

export const remove = mutation({
  args: {
    id: v.id("addresses"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to access crypto addresses",
      });
    }

    const address = await ctx.db.get(args.id);
    if (!address) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Address not found",
      });
    }
    if (address.userId !== userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You don't have permission to modify this address",
      });
    }

    // Delete all transactions associated with this address
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_address", (q) => q.eq("addressId", args.id))
      .collect();

    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    // Delete all scheduled function records for this address
    const scheduledFunctions = await ctx.db
      .query("scheduledFunctions")
      .withIndex("by_address", (q) => q.eq("addressId", args.id))
      .collect();

    for (const sf of scheduledFunctions) {
      await ctx.db.delete(sf._id);
    }

    // Delete the address itself
    // Note: Any running scheduled functions will automatically stop
    // when they detect the address no longer exists
    return await ctx.db.delete(args.id);
  },
});
