import { AppProviders } from "@/components/app/app-providers";
import { CatansagaApp } from "@/components/app/catansaga-app";

export default function HomePage() {
  return (
    <AppProviders
      convexUrl={process.env.NEXT_PUBLIC_CONVEX_URL}
      hexclaveProjectId={process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID}
      hexclavePublishableClientKey={process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY}
    >
      <CatansagaApp />
    </AppProviders>
  );
}
