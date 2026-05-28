export interface CategoryColor {
  value: string;
  label: string;
  hex: string;
}

export const CATEGORY_COLORS: CategoryColor[] = [
  { value: "teal", label: "Teal", hex: "#0d9488" },
  { value: "navy", label: "Navy", hex: "#1b4263" },
  { value: "mint", label: "Mint", hex: "#4fc9ab" },
  { value: "teal-dark", label: "Teal Dark", hex: "#0d5a5a" },
  { value: "amber", label: "Amber", hex: "#d97706" },
  { value: "rose", label: "Rose", hex: "#e11d48" },
  { value: "violet", label: "Violet", hex: "#7c3aed" },
  { value: "emerald", label: "Emerald", hex: "#059669" },
  { value: "sky", label: "Sky", hex: "#0284c7" },
  { value: "orange", label: "Orange", hex: "#ea580c" },
  { value: "indigo", label: "Indigo", hex: "#4f46e5" },
  { value: "cyan", label: "Cyan", hex: "#0891b2" },
  { value: "lime", label: "Lime", hex: "#65a30d" },
  { value: "pink", label: "Pink", hex: "#db2777" },
  { value: "fuchsia", label: "Fuchsia", hex: "#c026d3" },
  { value: "yellow", label: "Yellow", hex: "#ca8a04" },
  { value: "red", label: "Red", hex: "#dc2626" },
  { value: "blue", label: "Blue", hex: "#2563eb" },
  { value: "slate", label: "Slate", hex: "#475569" },
  { value: "gray", label: "Gray", hex: "#6b7280" },
];

export const getCategoryColorHex = (colorName: string | undefined): string => {
  if (!colorName) return CATEGORY_COLORS[0].hex;
  const color = CATEGORY_COLORS.find(c => c.value === colorName.toLowerCase());
  return color ? color.hex : CATEGORY_COLORS[0].hex;
};

/**
 * Returns styles for the icon container based on the category color.
 * Uses 20% opacity for the background and 100% for the text/icon.
 */
export const getCategoryIconStyles = (colorName: string | undefined) => {
  const hex = getCategoryColorHex(colorName);
  return {
    backgroundColor: `${hex}20`, // 20 in hex is roughly 12.5% or use 33 for 20%
    color: hex
  };
};
