import { getConvexProvidersConfig } from "@hexclave/next/convex-auth.config";

const projectId = process.env.HEXCLAVE_PROJECT_ID;

if (!projectId) {
  throw new Error("HEXCLAVE_PROJECT_ID must be set in the Convex deployment environment.");
}

export default {
  providers: getConvexProvidersConfig({ projectId }),
};
