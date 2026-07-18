import { createElement, type HTMLAttributes, type ReactNode } from "react";

export type LiquidGlassKind = "card" | "control" | "panel";
export type LiquidGlassRadius = "lg" | "md" | "pill" | "sm";
export type LiquidGlassTone = "host" | "join" | "neutral" | "ocean" | "quick";

type LiquidGlassElement = "article" | "aside" | "div" | "header" | "nav" | "section";

export interface LiquidGlassProps extends HTMLAttributes<HTMLElement> {
  as?: LiquidGlassElement;
  children: ReactNode;
  kind?: LiquidGlassKind;
  radius?: LiquidGlassRadius;
  tone?: LiquidGlassTone;
}

export interface LiquidGlassClassOptions {
  className?: string;
  kind?: LiquidGlassKind;
  radius?: LiquidGlassRadius;
  tone?: LiquidGlassTone;
}

export function liquidGlassClassName({
  className = "",
  kind = "panel",
  radius = "md",
  tone = "ocean",
}: LiquidGlassClassOptions = {}) {
  return [
    "liquid-glass",
    `liquid-glass--${kind}`,
    `liquid-glass--${radius}`,
    `liquid-glass--${tone}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function LiquidGlass({
  as = "div",
  children,
  className,
  kind = "panel",
  radius = "md",
  tone = "ocean",
  ...props
}: LiquidGlassProps) {
  return createElement(
    as,
    {
      ...props,
      className: liquidGlassClassName({ className, kind, radius, tone }),
      "data-glass-tone": tone,
    },
    children,
  );
}
