import * as React from "react";

export function TooltipProvider({
  children,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipTrigger({
  children,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  return <>{children}</>;
}

export function TooltipContent({
  children,
  className,
}: {
  children: React.ReactNode;
  side?: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "none" }} aria-hidden>
      {children}
    </span>
  );
}
