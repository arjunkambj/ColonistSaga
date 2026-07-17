"use client";

import { useHexclaveApp } from "@hexclave/next";
import { Button } from "@heroui/react";
import { LogIn, ShieldCheck, Sparkles, UserPlus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Brand } from "@/components/ui/brand";
import { LiveMessage } from "@/components/ui/live-message";

export function AuthScreen() {
  const hexclave = useHexclaveApp();
  const [pending, setPending] = useState<"signin" | "signup" | null>(null);
  const [error, setError] = useState("");

  const redirectToAuth = async (kind: "signin" | "signup") => {
    if (pending) {
      return;
    }

    setError("");
    setPending(kind);
    try {
      if (kind === "signin") {
        await hexclave.redirectToSignIn();
      } else {
        await hexclave.redirectToSignUp();
      }
    } catch {
      setError("Authentication could not be opened. Check your connection and try again.");
      setPending(null);
    }
  };

  return (
    <main className="home-page auth-page" id="main-content">
      <div className="home-backdrop" aria-hidden="true">
        <Image
          alt=""
          className="home-scenery"
          fill
          priority
          sizes="100vw"
          src="/home-assets/island-bay-v1.webp"
        />
      </div>
      <header className="site-header">
        <Brand />
        <span className="status-pill">
          <ShieldCheck aria-hidden="true" /> Account-secured play
        </span>
      </header>
      <section className="auth-panel" aria-labelledby="auth-title">
        <p className="eyebrow">
          <Sparkles aria-hidden="true" /> Your Island Awaits
        </p>
        <h1 id="auth-title">Build, trade, and reconnect from any device.</h1>
        <p>Sign in to keep every room seat tied to your account and protected by Hexclave.</p>
        <div className="auth-actions">
          <Button
            className="button button-primary button-large"
            isPending={pending === "signin"}
            onPress={() => void redirectToAuth("signin")}
          >
            <LogIn aria-hidden="true" /> Sign In
          </Button>
          <Button
            className="button button-secondary button-large"
            isPending={pending === "signup"}
            onPress={() => void redirectToAuth("signup")}
          >
            <UserPlus aria-hidden="true" /> Create Account
          </Button>
        </div>
        <LiveMessage message={error} />
      </section>
    </main>
  );
}
