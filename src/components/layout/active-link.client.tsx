"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ActiveLinkProps {
  href: string;
  className: string;
  activeClassName: string;
  children: ReactNode;
  prefetch?: boolean;
}

export function ActiveLink({
  href,
  className,
  activeClassName,
  children,
  prefetch,
}: ActiveLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(className, active && activeClassName)}
    >
      {children}
    </Link>
  );
}
