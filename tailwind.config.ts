import type { Config } from "tailwindcss";

/**
 * Ashfall Gunmetal token system.
 *
 * Colors are CSS custom properties holding RGB channel triplets
 * (`--c-ember: 255 106 43`) consumed as `rgb(var(--c-ember) / <alpha-value>)`
 * so Tailwind opacity modifiers keep working. The dark "Bunker" theme lives on
 * `:root`; the light "Daylight Patrol" theme remaps the SAME token names on
 * `.light` — components never need variant classes.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces, darkest to lightest (semantic depth, not literal shade)
        steel: {
          950: "rgb(var(--c-steel-950) / <alpha-value>)",
          900: "rgb(var(--c-steel-900) / <alpha-value>)",
          850: "rgb(var(--c-steel-850) / <alpha-value>)",
          800: "rgb(var(--c-steel-800) / <alpha-value>)",
          700: "rgb(var(--c-steel-700) / <alpha-value>)",
          600: "rgb(var(--c-steel-600) / <alpha-value>)",
        },
        rivet: "rgb(var(--c-rivet) / <alpha-value>)",
        // Text
        bone: {
          DEFAULT: "rgb(var(--c-bone) / <alpha-value>)",
          soft: "rgb(var(--c-bone-soft) / <alpha-value>)",
          faint: "rgb(var(--c-bone-faint) / <alpha-value>)",
        },
        // Accents
        ember: {
          DEFAULT: "rgb(var(--c-ember) / <alpha-value>)",
          deep: "rgb(var(--c-ember-deep) / <alpha-value>)",
        },
        hazard: "rgb(var(--c-hazard) / <alpha-value>)",
        blood: "rgb(var(--c-blood) / <alpha-value>)",
        olive: "rgb(var(--c-olive) / <alpha-value>)",
        // Blueprint canvas line-art + grid
        blueprint: "rgb(var(--c-blueprint) / <alpha-value>)",
        grid: "rgb(var(--c-grid) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "Haettenschweiler", "sans-serif"],
        body: ["var(--font-body)", "Segoe UI", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        title: "0.08em",
        stamp: "0.2em",
      },
      borderRadius: {
        card: "0.375rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.4), 0 4px 16px rgb(0 0 0 / 0.25)",
        raised: "0 2px 4px rgb(0 0 0 / 0.5), 0 8px 24px rgb(0 0 0 / 0.35)",
        ember: "0 0 0 1px rgb(var(--c-ember) / 0.4), 0 0 18px rgb(var(--c-ember) / 0.25)",
        inset: "inset 0 1px 3px rgb(0 0 0 / 0.5)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ember": {
          "0%, 100%": { boxShadow: "0 0 0 1px rgb(var(--c-ember) / 0.35)" },
          "50%": { boxShadow: "0 0 0 1px rgb(var(--c-ember) / 0.7), 0 0 20px rgb(var(--c-ember) / 0.3)" },
        },
      },
      animation: {
        "fade-in": "fade-in-up 0.35s ease-out both",
        "pulse-ember": "pulse-ember 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
