import { HexclaveClientApp } from "@hexclave/next";

import { createCachedValue } from "@/lib/app/cached-value";

interface HexclaveClientOptions {
  projectId: string;
  publishableClientKey?: string;
}

const getCachedHexclaveClientApp = createCachedValue(
  (current: HexclaveClientOptions, next) =>
    current.projectId === next.projectId &&
    current.publishableClientKey === next.publishableClientKey,
  ({ projectId, publishableClientKey }: HexclaveClientOptions) =>
    new HexclaveClientApp({
      projectId,
      publishableClientKey,
      tokenStore: "cookie",
      urls: {
        default: { type: "hosted" },
      },
    }),
);

export function getHexclaveClientApp(projectId: string, publishableClientKey?: string) {
  return getCachedHexclaveClientApp({
    projectId,
    publishableClientKey,
  });
}
