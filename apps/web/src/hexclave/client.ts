import { HexclaveClientApp } from "@hexclave/next";

export function createHexclaveClientApp(projectId: string, publishableClientKey?: string) {
  return new HexclaveClientApp({
    projectId,
    publishableClientKey,
    tokenStore: "cookie",
    urls: {
      default: { type: "hosted" },
    },
  });
}
