export type BadgeCategory = "platform" | "forum";
export type BadgeRarity = "Common" | "Rare" | "Epic" | "Legendary";

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  Common: "#9CA3AF",
  Rare: "#3498DB",
  Epic: "#9B59B6",
  Legendary: "#F39C12",
} as const;

export const RARITY_SHADOW_CLASSES: Record<BadgeRarity, string> = {
  // Common: "drop-shadow-[0_0_15px_#9CA3AF]",
  Common: "",
  Rare: "drop-shadow-[0_0_10px_#3498DB]",
  Epic: "drop-shadow-[0_0_10px_#9B59B6]",
  Legendary: "drop-shadow-[0_0_10px_#F39C12]",
} as const;

export interface AchievementBadge {
  _id: string;
  slug: string;
  name: string;
  desc: string;
  img: string;
  rarity: BadgeRarity;
  category: BadgeCategory;
  trigger: string | null;
  threshold: number | null;
  isActive: boolean;
  date?: string | null;
}
