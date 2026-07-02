"use client";

import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import React from "react";
import { HoverCard } from "./HoverCard";
import { useApi } from "@/lib/use-api";
import { platformApi } from "@/lib/api";
import { Solar } from "@/lib/solar-duotone";

const STAT_CONFIG = [
  {
    icon: Solar.users,
    key: "totalUsers" as const,
    label: "Registered Players",
    format: (v: number) => `${v.toLocaleString()}+`,
    fallback: "50,000+",
  },
  {
    icon: Solar.gamepad,
    key: "matchesPlayed" as const,
    label: "Matches Played",
    format: (v: number) => v.toLocaleString(),
    fallback: "0",
  },
  {
    icon: Solar.trophy,
    key: "activeTournaments" as const,
    label: "Active Tournaments",
    format: (v: number) => v.toLocaleString(),
    fallback: "0",
  },
  {
    icon: Solar.bolt,
    key: "liveMatches" as const,
    label: "Matches Live Now",
    format: (v: number) => v.toLocaleString(),
    fallback: "0",
    live: true,
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
  const value = raw !== undefined ? s.format(raw) : s.fallback;

  return (
    <HoverCard delay={i * 0.1} className="lp-stat">
      <div className="lp-stat-icon">
        <Icon icon={s.icon} width={26} height={26} />
      </div>
      <div className="lp-stat-text">
        <div className="lp-stat-value">
          {value}
          {"live" in s && s.live && <span className="lp-stat-live" />}
        </div>
        <div className="lp-stat-label">{s.label}</div>
      </div>
    </HoverCard>
  );
}

function LandingPageStats() {
  const { data: stats } = useApi<StatsData>(() => platformApi.getStats());

  return (
    <motion.section
      className="lp-stats"
      initial={{ marginTop: 0 }}
      animate={{ marginTop: "-3rem" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {STAT_CONFIG.map((s, i) => (
        <StatCard key={s.key} s={s} i={i} stats={stats} />
      ))}
    </motion.section>
  );
}

export default LandingPageStats;
