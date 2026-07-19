import { getConvexProvidersConfig } from "@hexclave/next/convex-auth.config";

export default {
  providers: getConvexProvidersConfig({
    projectId: process.env.HEXCLAVE_PROJECT_ID!,
  }),
};
