"use client";

import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import React from "react";
import { HoverCard } from "./HoverCard";
import { useApi } from "@/lib/use-api";
import { platformApi } from "@/lib/api";

const STAT_CONFIG = [
  {
    icon: "proicons:game",
    key: "totalUsers" as const,
    label: "Registered Players",
    format: (v: number) => `+${v.toLocaleString()}`,
    fallback: "+50,000",
  },
  {
    icon: "game-icons:target-prize",
    key: "matchesPlayed" as const,
    label: "Matches Played",
    format: (v: number) => v.toLocaleString(),
    fallback: "0",
  },
  {
    icon: "famicons:share-social-sharp",
    key: "activeTournaments" as const,
    label: "Active Tournaments",
    format: (v: number) => `+${v.toLocaleString()}`,
    fallback: "+0",
  },
  {
    icon: "game-icons:trophy",
    key: "liveMatches" as const,
    label: "Matches Live Now",
    format: (v: number) => `${v.toLocaleString()}`,
    fallback: "0",
  },
];

type StatsData = {
  totalUsers: number;
  matchesPlayed: number;
  activeTournaments: number;
  liveMatches: number;
};

function StatCard({
  s,
  i,
  stats,
}: {
  s: (typeof STAT_CONFIG)[number];
  i: number;
  stats: StatsData | null;
}) {
  const raw = stats?.[s.key];
  const value =
    raw !== undefined ? s.format(raw) : s.fallback;

  return (
    <HoverCard
      delay={i * 0.1}
      className="bg-linear-to-tl from-bg-3/70 to-bg-bg-5 rounded-lg p-8! hover:bg-opacity-90 cursor-none"
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>
        <Icon
          className="text-brand-red"
          icon={s.icon}
          width="64"
          height="64"
        />
      </div>
      <div className="mt-8! ml-auto text-right">
        <div className="stat-value text-2xl font-bold text-white">
          {value}
        </div>
        <div className="stat-label text-sm font-medium text-white">
          {s.label}
        </div>
      </div>
    </HoverCard>
  );
}

function LandingPageStats() {
  const { data: stats } = useApi<StatsData>(() => platformApi.getStats());

  return (
    <div className="bg-black/30">
      <motion.section
        className="relative grid md:grid-cols-4 gap-0 z-10! bg-bg-5/70 backdrop-blur-sm rounded-lg p-0!"
        initial={{ marginTop: 0 }}
        animate={{ marginTop: "-3rem" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {STAT_CONFIG.map((s, i) => (
          <StatCard key={s.key} s={s} i={i} stats={stats} />
        ))}
      </motion.section>
    </div>
  );
}

export default LandingPageStats;
