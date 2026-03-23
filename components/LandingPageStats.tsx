"use client";

import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import React from "react";
import { HoverCard } from "./HoverCard";

const stats = [
  { icon: "proicons:game", value: "+50,000", label: "Simultaneous Players" },
  {
    icon: "game-icons:target-prize",
    value: "2,942,000",
    label: "Matches Played",
  },
  {
    icon: "famicons:share-social-sharp",
    value: "+100,000",
    label: "On Our Social Networks",
  },
  { icon: "game-icons:trophy", value: "+1,000", label: "Active Tournaments" },
];

function StatCard({ s, i }: { s: { icon: string; value: string; label: string }, i: number }) {
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
          {s.value}
        </div>
        <div className="stat-label text-sm font-medium text-white">
          {s.label}
        </div>
      </div>
    </HoverCard>
  );
}

function LandingPageStats() {
  return (
    <div className="bg-black/30">
      <motion.section
        className="relative grid md:grid-cols-4 gap-0 z-10! bg-bg-5/70 backdrop-blur-sm rounded-lg p-0!"
        initial={{ marginTop: 0 }}
        animate={{ marginTop: "-3rem" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* <div className="stats-grid"> */}
        {stats.map((s, i) => (
          <StatCard key={i} s={s} i={i} />
        ))}
        {/* </div> */}
      </motion.section>
    </div>
  );
}

export default LandingPageStats;
