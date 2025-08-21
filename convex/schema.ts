import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { CRYPTO_SYMBOLS } from "@/lib/constants";

const schema = defineSchema({
  ...authTables,

  addresses: defineTable({
    userId: v.id("users"),
    cryptoType: v.union(...CRYPTO_SYMBOLS.map((symbol) => v.literal(symbol))),
    address: v.string(),
    label: v.optional(v.string()),
    webhookUrl: v.string(),
    webhookVerificationCode: v.string(),
    isListening: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "cryptoType"]),

  transactions: defineTable({
    addressId: v.id("addresses"),
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
    type: v.union(v.literal("sent"), v.literal("received")),
    webhookSent: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_address", ["addressId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_address_and_timestamp", ["addressId", "timestamp"]),

  webhookLogs: defineTable({
    transactionId: v.id("transactions"),
    addressId: v.id("addresses"),
    userId: v.id("users"),
    webhookUrl: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("pending"),
    ),
    statusCode: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    requestPayload: v.string(), // JSON string of the payload
    responseBody: v.optional(v.string()), // JSON string of the response
    attemptNumber: v.number(),
    sentAt: v.number(),
  })
    .index("by_transaction", ["transactionId"])
    .index("by_address", ["addressId"])
    .index("by_user", ["userId"])
    .index("by_sent_at", ["sentAt"]),
});

export default schema;
