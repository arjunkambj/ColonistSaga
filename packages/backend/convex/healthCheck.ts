import { query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  returns: v.literal("OK"),
  handler: async () => {
    return "OK" as const;
  },
});
