import hexclaveComponent from "@hexclave/next/convex.config";
import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    HEXCLAVE_PROJECT_ID: v.string(),
  },
});
// Hexclave 1.0.51 ships Convex 1.27 component typings; the runtime definition is compatible.
app.use(hexclaveComponent as Parameters<typeof app.use>[0]);

export default app;
