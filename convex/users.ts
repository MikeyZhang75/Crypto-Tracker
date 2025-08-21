import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "You must be authenticated to access user information",
      });
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      id: user._id,
      name: user.name || "Unknown User",
      email: user.email || "",
      emailVerificationTime: user.emailVerificationTime,
      image: user.image,
    };
  },
});
