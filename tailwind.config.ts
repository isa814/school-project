import type { Config } from "tailwindcss";

// Brand colours extracted from the school logo (IMG-20261019-WA0035.jpg).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0235A4", deep: "#021E66" },
        sky: { DEFAULT: "#7EACEB", soft: "#EAF2FD" },
        gold: { DEFAULT: "#D4A150", soft: "#FBF3E4" },
        ink: "#0F172A",
        surface: { DEFAULT: "#FFFFFF", muted: "#F8FAFC" },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.25rem" },
      boxShadow: { card: "0 1px 2px rgba(2,30,102,0.06), 0 8px 24px -12px rgba(2,30,102,0.18)" },
    },
  },
  plugins: [],
};
export default config;
