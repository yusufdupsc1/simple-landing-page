"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/server/actions/checkout";

interface FeePaymentActionsProps {
  feeId: string;
  className?: string;
}

export function FeePaymentActions({
  feeId,
  className,
}: FeePaymentActionsProps) {
  const [pending, startTransition] = useTransition();
  const [gateway, setGateway] = useState<"SSLCOMMERZ" | null>(null);

  function beginSslCommerzCheckout() {
    setGateway("SSLCOMMERZ");
    startTransition(async () => {
      const result = await createCheckoutSession({
        feeId,
        gateway: "SSLCOMMERZ",
      });

      if (!result.success) {
        toast.error("Failed to initialize payment");
        setGateway(null);
        return;
      }

      if (!result.url) {
        toast.error("Failed to initialize payment");
        setGateway(null);
        return;
      }

      window.location.href = result.url;
    });
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={beginSslCommerzCheckout}
      >
        {pending && gateway === "SSLCOMMERZ" ? (
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
        ) : (
          <CreditCard className="mr-1 h-3.5 w-3.5" />
        )}
        Pay Online (SSLCommerz)
      </Button>
    </div>
  );
}
