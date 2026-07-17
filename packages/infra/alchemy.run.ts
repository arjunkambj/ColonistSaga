import alchemy from "alchemy";
import { Nextjs } from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env.local" });

const app = await alchemy("catansaga");

export const web = await Nextjs("web", {
  cwd: "../../apps/web",
  bindings: {
    NEXT_PUBLIC_CONVEX_URL: alchemy.env.NEXT_PUBLIC_CONVEX_URL!,
  },
  build: {
    env: {
      NEXT_PUBLIC_CONVEX_URL: alchemy.env.NEXT_PUBLIC_CONVEX_URL!,
    },
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();
