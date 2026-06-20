/**
 * useColors.js
 * Returns theme-aware color values for inline styles.
 * Pages use: const c = useColors(); then style={{ backgroundColor: c.bgSecondary }}
 */
import { useTheme } from "./ThemeContext";

export function useColors() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  return {
    bgPrimary: dark ? "#111" : "#f5f7fa",
    bgSecondary: dark ? "#222" : "#ffffff",
    bgCard: dark ? "#1a1a1a" : "#ffffff",
    bgInput: dark ? "#111" : "#fff",
    borderColor: dark ? "#333" : "#ddd",
    borderLight: dark ? "#222" : "#e8e8e8",
    textPrimary: dark ? "#fff" : "#1a1a1a",
    textSecondary: dark ? "#ccc" : "#333",
    textMuted: dark ? "#888" : "#666",
    accentBlue: dark ? "#00aaff" : "#0077cc",
    accentOrange: dark ? "#f28c28" : "#d97706",
    shadow: dark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)",
  };
}
