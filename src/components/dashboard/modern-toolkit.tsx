"use client";

import {
  BrainCircuit,
  MessagesSquare,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "AI Smart Insights",
    description:
      "Automated student performance tracking and behavioral analytics.",
    icon: BrainCircuit,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    metric: "94% Accuracy",
    status: "Live Tracking",
  },
  {
    title: "Parent Connect Pro",
    description:
      "Real-time communication and instant notifications for parents.",
    icon: MessagesSquare,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    metric: "Instant SMS",
    status: "Active System",
  },
  {
    title: "Secure Vault Hub",
    description: "Blockchain-verified digital certificates and secure storage.",
    icon: ShieldCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    metric: "End-to-End",
    status: "Secure Storage",
  },
];

export function ModernToolkit() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-bold tracking-tight text-foreground/90 flex items-center gap-2">
            Modern School Toolkit
            <span className="flex h-4 w-10 items-center justify-center rounded-full bg-primary/10 text-[8px] font-black uppercase tracking-widest text-primary ring-1 ring-inset ring-primary/20">
              New
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Cutting-edge features for high-performance institutions.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary"
        >
          View All <ArrowUpRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <Card
            key={i}
            className="group relative overflow-hidden border-border/40 bg-card/40 backdrop-blur-xl transition-premium hover:border-primary/30 p-5 hover:shadow-xl premium-shadow"
          >
            <div className="absolute top-0 right-0 -z-10 h-24 w-24 monument-motif opacity-5 bg-primary/20 rotate-12" />

            <div className="flex items-start justify-between mb-4">
              <div
                className={`h-12 w-12 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-border/20`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1 opacity-70">
                  {feature.status}
                </span>
                <span
                  className={`text-[11px] font-black ${feature.color} leading-none`}
                >
                  {feature.metric}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                <div className="h-full bg-primary/40 rounded-full w-[60%] animate-pulse" />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
                System Health: Optimal
              </span>
            </div>

            {/* Quick Action Overlay on hover */}
            <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
              <Button
                variant="secondary"
                className="font-bold shadow-lg shadow-black/20 rounded-xl px-6"
              >
                Launch {feature.title.split(" ")[1]}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
