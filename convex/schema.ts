import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { CRYPTO_SYMBOLS } from "@/lib/constants";

const schema = defineSchema({
  ...authTables,

  cryptoAddresses: defineTable({
    userId: v.id("users"),
    cryptoType: v.union(...CRYPTO_SYMBOLS.map((symbol) => v.literal(symbol))),
    address: v.string(),
    label: v.optional(v.string()),
    isListening: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "cryptoType"]),

  transactions: defineTable({
    addressId: v.id("cryptoAddresses"),
    userId: v.id("users"),
    transactionId: v.string(),
    cryptoType: v.union(...CRYPTO_SYMBOLS.map((symbol) => v.literal(symbol))),
    from: v.string(),
    to: v.string(),
    amount: v.string(),
    timestamp: v.number(),
    blockNumber: v.optional(v.string()),
    fee: v.optional(v.string()),
    status: v.optional(v.string()),
    type: v.string(), // "sent" or "received"
    createdAt: v.number(),
  })
    .index("by_address", ["addressId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_address_and_timestamp", ["addressId", "timestamp"]),
});

export default schema;
