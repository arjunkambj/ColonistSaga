"use client";

import { Button } from "@heroui/react";
import arrowRightIcon from "@iconify-icons/solar/arrow-right-outline";
import { Icon } from "@iconify/react";
import Image from "next/image";
import type { ReactNode } from "react";

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
      className="button voyage-card"
      data-voyage-tone={tone}
      isDisabled={disabled}
      isPending={pending}
      onPress={onPress}
      variant="ghost"
    >
      <span className="voyage-card__art" aria-hidden="true">
        <span className="voyage-card__art-glow" />
        <Image
          alt=""
          className="voyage-card__image"
          draggable={false}
          height={512}
          loading="eager"
          priority
          sizes="(max-width: 760px) 88vw, 20rem"
          src={imageSrc}
          width={512}
        />
      </span>
      <span className="voyage-card__body">
        <span className="voyage-card__badge" aria-hidden="true">
          {badge}
        </span>
        <strong className="voyage-card__title">{pending ? `${title}…` : title}</strong>
        <small className="voyage-card__description">{description}</small>
        <span className="voyage-card__cta" aria-hidden="true">
          <Icon icon={arrowRightIcon} />
        </span>
      </span>
    </Button>
  );
}
