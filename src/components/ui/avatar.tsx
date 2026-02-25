import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)} {...props} />;
}

export function AvatarImage({ className, alt = "Avatar", src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null;
  return <img src={src} alt={alt} className={cn("h-full w-full object-cover", className)} {...props} />;
}


export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted text-xs", className)} {...props} />;
}
