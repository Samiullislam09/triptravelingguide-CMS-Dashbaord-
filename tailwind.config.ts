import type { Config } from "tailwindcss";

// TripTravelingGuide command-center design system.
// Light, glassmorphism, SEMrush-inspired. Semantic tokens below are the ONLY
// colors pages/components should reference so the whole app stays coherent.
// (The old `ink.*` dark scale is kept for back-compat with not-yet-migrated
// screens; new UI must use the semantic tokens.)
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Semantic surface / text tokens (light glass theme) ---
        canvas: "#eef1f7", // app background (behind the glass)
        surface: "#ffffff", // solid card
        line: "#e6e9f0", // hairline borders
        muted: "#6b7280", // secondary text
        ink: {
          // Retained dark scale (legacy screens). Do not use in new UI.
          950: "#0B0D12",
          900: "#12151C",
          800: "#1A1E27",
          700: "#252A36",
          600: "#383F4F",
          // Text tokens usable on the light theme:
          DEFAULT: "#0f172a", // primary heading text
        },
        brand: {
          50: "#eff4ff",
          100: "#dbe6ff",
          200: "#bfd3ff",
          300: "#93b4ff",
          400: "#608cff",
          500: "#3b6cf6", // primary
          600: "#2f56e0",
          700: "#2743b8",
          DEFAULT: "#3b6cf6",
          glow: "#608cff",
        },
        // AI / creative accent (violet→used for AI Studio & generative actions)
        ai: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        success: { DEFAULT: "#16a34a", soft: "#dcfce7" },
        warn: { DEFAULT: "#d97706", soft: "#fef3c7" },
        danger: { DEFAULT: "#dc2626", soft: "#fee2e2" },
      },
      boxShadow: {
        glass: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.10)",
        "glass-lg": "0 2px 4px rgba(15,23,42,0.05), 0 24px 48px -16px rgba(15,23,42,0.18)",
        pop: "0 12px 32px -8px rgba(59,108,246,0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "grow-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.5s ease both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "grow-x": "grow-x 0.8s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.8s linear infinite",
        float: "float 5s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
