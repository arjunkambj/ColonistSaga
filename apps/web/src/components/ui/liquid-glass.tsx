import { createElement, type HTMLAttributes, type ReactNode } from "react";

export type LiquidGlassKind = "card" | "control" | "panel";
export type LiquidGlassRadius = "lg" | "md" | "pill" | "sm";

type LiquidGlassElement = "article" | "aside" | "div" | "header" | "nav" | "section";

export interface LiquidGlassProps extends HTMLAttributes<HTMLElement> {
  as?: LiquidGlassElement;
  children: ReactNode;
  kind?: LiquidGlassKind;
  radius?: LiquidGlassRadius;
}

export interface LiquidGlassClassOptions {
  className?: string;
  kind?: LiquidGlassKind;
  radius?: LiquidGlassRadius;
}

export function liquidGlassClassName({
  className = "",
  kind = "panel",
  radius = "md",
}: LiquidGlassClassOptions = {}) {
  return [
    "liquid-glass",
    "liquid-glass-color",
    `liquid-glass--${kind}`,
    `liquid-glass--${radius}`,
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
  ...props
}: LiquidGlassProps) {
  return createElement(
    as,
    {
      ...props,
      className: liquidGlassClassName({ className, kind, radius }),
    },
    children,
  );
}
