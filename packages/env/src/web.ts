import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const convexUrlSchema = (exampleHost: string) =>
  z.url().refine((url) => new URL(url).hostname !== exampleHost, {
    message: `Replace the ${exampleHost} placeholder before running the app`,
  });

export const env = createEnv({
  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_CONVEX_URL: convexUrlSchema("example.convex.cloud"),
    NEXT_PUBLIC_HEXCLAVE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_HEXCLAVE_PROJECT_ID: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
    NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY:
      process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
