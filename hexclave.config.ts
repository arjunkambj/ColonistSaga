import { defineHexclaveConfig } from "@hexclave/next/config";

export const config = defineHexclaveConfig({
  apps: {
    installed: {
      analytics: { enabled: true },
      authentication: { enabled: true },
      emails: { enabled: true },
    },
  },
  auth: {
    allowSignUp: true,
    oauth: {
      accountMergeStrategy: "link_method",
      providers: {
        google: {
          allowConnectedAccounts: true,
          allowSignIn: true,
          type: "google",
        },
      },
    },
    otp: {
      allowSignIn: true,
    },
    password: {
      allowSignIn: false,
    },
  },
});
