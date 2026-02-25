"use client";

import { Users, UserCheck, ClipboardCheck, CreditCard } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { motion } from "motion/react";

interface StatsData {
  totalStudents: number;
  totalTeachers: number;
  todayAttendance: number;
  pendingFees: { amount: number; count: number };
}

export function StatsGrid({ stats }: { stats: StatsData }) {
  const cards = [
    { label: "Students", value: stats.totalStudents, icon: Users },
    { label: "Teachers", value: stats.totalTeachers, icon: UserCheck },
    { label: "Present Today", value: stats.todayAttendance, icon: ClipboardCheck },
    {
      label: "Pending Fees",
      value: formatCurrency(Number(stats.pendingFees.amount ?? 0)),
      icon: CreditCard,
      subtitle: `${stats.pendingFees.count} invoices`,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <motion.article
          variants={item}
          key={card.label}
          className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-md hover:border-border transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="mb-4 flex items-center justify-between relative z-10">
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-3xl font-bold tracking-tight text-foreground">{card.value}</p>
            {card.subtitle ? <p className="mt-1 text-sm font-medium text-muted-foreground">{card.subtitle}</p> : null}
          </div>
        </motion.article>
      ))}
    </motion.section>
  );
}
