import { ConvexError } from "convex/values";
import { z } from "zod";

import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = Pick<MutationCtx | QueryCtx, "auth">;

const hexclaveUserSchema = z.object({
  email: z.string().nullable(),
  id: z.string().min(1),
  isAnonymous: z.boolean(),
  isRestricted: z.boolean(),
  name: z.string().nullable(),
  role: z.literal("authenticated"),
});

export type HexclaveUser = z.infer<typeof hexclaveUserSchema>;

export async function getCurrentHexclaveUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    return { authenticated: false, error: "Unauthenticated." } as const;
  }

  const parsedUser = hexclaveUserSchema.safeParse({
    email: identity.email ?? null,
    id: identity.subject,
    isAnonymous: identity.is_anonymous,
    isRestricted: identity.is_restricted,
    name: identity.name ?? null,
    role: identity.role,
  });

  if (!parsedUser.success) {
    return { authenticated: false, error: "Missing Hexclave user claims." } as const;
  }

  if (parsedUser.data.isAnonymous || parsedUser.data.isRestricted) {
    return { authenticated: false, error: "A full Hexclave account is required." } as const;
  }

  return { authenticated: true, user: parsedUser.data } as const;
}

export async function requireCurrentHexclaveUser(ctx: AuthCtx): Promise<HexclaveUser> {
  const auth = await getCurrentHexclaveUser(ctx);

  if (!auth.authenticated) {
    throw new ConvexError({ code: "UNAUTHENTICATED", message: auth.error });
  }

  return auth.user;
}
