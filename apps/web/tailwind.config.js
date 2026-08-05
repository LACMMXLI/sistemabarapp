/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--pos-bg) / 0.9)",
        surface: "rgb(var(--pos-surface) / 0.9)",
        surfaceLight: "rgb(var(--pos-surface-elevated) / 0.88)",
        primary: "rgb(var(--pos-amber) / <alpha-value>)",
        primaryHover: "rgb(var(--pos-amber-strong) / <alpha-value>)",
        secondary: "rgb(var(--pos-cyan) / <alpha-value>)",
        success: "rgb(var(--pos-success) / <alpha-value>)",
        warning: "rgb(var(--pos-amber) / <alpha-value>)",
        error: "rgb(var(--pos-danger) / <alpha-value>)",
        text: "rgb(var(--pos-text-primary) / <alpha-value>)",
        textMuted: "rgb(var(--pos-text-secondary) / <alpha-value>)",
        border: "rgb(var(--pos-border-default) / <alpha-value>)",

        pos: {
          bg: "rgb(var(--pos-bg) / <alpha-value>)",
          surface: "rgb(var(--pos-surface) / <alpha-value>)",
          surfaceElevated: "rgb(var(--pos-surface-elevated) / <alpha-value>)",
          border: "rgb(var(--pos-border-default) / <alpha-value>)",
          borderSoft: "rgb(var(--pos-border-soft) / <alpha-value>)",
          textPrimary: "rgb(var(--pos-text-primary) / <alpha-value>)",
          textSecondary: "rgb(var(--pos-text-secondary) / <alpha-value>)",
          textMuted: "rgb(var(--pos-text-muted) / <alpha-value>)",
          amber: "rgb(var(--pos-amber) / <alpha-value>)",
          amberStrong: "rgb(var(--pos-amber-strong) / <alpha-value>)",
          cyan: "rgb(var(--pos-cyan) / <alpha-value>)",
          danger: "rgb(var(--pos-danger) / <alpha-value>)",
          success: "rgb(var(--pos-success) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--pos-font-sans)"],
      },
      spacing: {
        xs: "var(--pos-space-xs)",
        sm: "var(--pos-space-sm)",
        md: "var(--pos-space-md)",
        lg: "var(--pos-space-lg)",
        xl: "var(--pos-space-xl)",
      },
      borderRadius: {
        pos: "var(--pos-radius-md)",
        posSm: "var(--pos-radius-sm)",
        posMd: "var(--pos-radius-md)",
        posLg: "var(--pos-radius-lg)",
      },
      boxShadow: {
        pos: "var(--pos-shadow-control)",
        posPanel: "var(--pos-shadow-panel)",
        posXl: "var(--pos-shadow-modal)",
      },
    },
  },
  plugins: [],
};
