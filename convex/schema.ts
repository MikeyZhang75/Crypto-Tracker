import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  cryptoAddresses: defineTable({
    userId: v.id("users"),
    cryptoType: v.union(v.literal("btc"), v.literal("usdt"), v.literal("ltc")),
    address: v.string(),
    label: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "cryptoType"]),
});

export default schema;
