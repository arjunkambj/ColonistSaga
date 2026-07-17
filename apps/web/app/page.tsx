import { ClientApp } from "./client-app";

export default function HomePage() {
  return (
    <ClientApp
      convexUrl={process.env.NEXT_PUBLIC_CONVEX_URL}
      hexclaveProjectId={process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID}
      hexclavePublishableClientKey={
        process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY
      }
    />
  );
}
