"use client";

import { Button } from "@heroui/react";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { liquidGlassClassName } from "@/components/ui/liquid-glass";

export type VoyageCardTone = "host" | "join" | "quick";

export interface VoyageCardProps {
  actionLabel: string;
  badge: ReactNode;
  description: string;
  disabled?: boolean;
  imageSrc: string;
  onPress(): void;
  pending?: boolean;
  title: string;
  tone: VoyageCardTone;
}

export function VoyageCard({
  actionLabel,
  badge,
  description,
  disabled = false,
  imageSrc,
  onPress,
  pending = false,
  title,
  tone,
}: VoyageCardProps) {
  return (
    <Button
      aria-label={`${title}. ${description}. ${actionLabel}`}
      className={liquidGlassClassName({
        className: "voyage-card",
        kind: "card",
        radius: "lg",
        tone,
      })}
      isDisabled={disabled}
      isPending={pending}
      onPress={onPress}
      variant="ghost"
    >
      <span className="voyage-card-art" aria-hidden="true">
        <span className="voyage-card-art-glow" />
        <Image alt="" draggable={false} height={512} src={imageSrc} width={512} />
      </span>
      <span className="voyage-card-content">
        <span className="voyage-card-badge" aria-hidden="true">
          {badge}
        </span>
        <strong>{pending ? `${title}…` : title}</strong>
        <small>{description}</small>
      </span>
      <span className="voyage-card-action" aria-hidden="true">
        <ArrowRight />
      </span>
    </Button>
  );
}
