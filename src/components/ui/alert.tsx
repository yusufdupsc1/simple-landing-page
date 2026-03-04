import * as React from "react";
import { cn } from "@/lib/utils";

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
};

export function Alert({
  className,
  variant = "default",
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "w-full rounded-md border p-4 text-sm",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-border bg-background",
        className,
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("text-sm", className)} {...props} />;
}
