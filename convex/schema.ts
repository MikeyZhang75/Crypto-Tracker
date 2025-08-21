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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "cryptoType"]),
});

export default schema;
