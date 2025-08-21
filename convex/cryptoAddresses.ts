import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { CRYPTO_SYMBOLS } from "@/lib/constants";
import { validateCryptoAddress } from "@/lib/validator";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

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
      .query("cryptoAddresses")
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
        message: `Invalid ${args.cryptoType.toUpperCase()} address format`,
      });
    }

    // Check if address already exists for this user
    const existing = await ctx.db
      .query("cryptoAddresses")
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
    return await ctx.db.insert("cryptoAddresses", {
      userId: userId as Id<"users">,
      cryptoType: args.cryptoType,
      address: args.address,
      label: args.label,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("cryptoAddresses"),
    label: v.optional(v.string()),
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

    const updates: { updatedAt: number; label?: string } = {
      updatedAt: Date.now(),
    };
    if (args.label !== undefined) updates.label = args.label;

    return await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: {
    id: v.id("cryptoAddresses"),
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

    return await ctx.db.delete(args.id);
  },
});
