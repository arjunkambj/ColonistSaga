import { HexclaveClientApp } from "@hexclave/next";

export function createHexclaveClientApp(projectId: string, publishableClientKey?: string) {
  return new HexclaveClientApp({
    projectId,
    publishableClientKey,
    tokenStore: "nextjs-cookie",
    urls: {
      default: { type: "hosted" },
    },
  });
}
