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
  },
  runtimeEnv: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
