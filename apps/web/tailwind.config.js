/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgba(15, 23, 42, 0.88)",
        surface: "rgba(30, 41, 59, 0.82)",
        surfaceLight: "rgba(51, 65, 85, 0.8)",
        primary: "#F59E0B",
        primaryHover: "#D97706",
        secondary: "#38BDF8",
        success: "#22C55E",
        error: "#EF4444",
        text: "#FFFFFF",
        textMuted: "#94A3B8",
        border: "#334155",

        pos: {
          bg: "#07090b",
          surface: "#0d1115",
          surfaceElevated: "#12181d",
          border: "rgba(255, 255, 255, 0.14)",
          borderSoft: "rgba(255, 255, 255, 0.08)",
          textPrimary: "#f5f7f8",
          textSecondary: "#a8b0b7",
          textMuted: "#707981",
          amber: "#ffc400",
          amberStrong: "#ffad00",
          cyan: "#00bfe8",
          danger: "#ff4b3e",
          success: "#62d36b",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
      },
      borderRadius: {
        posSm: "8px",
        posMd: "12px",
        posLg: "16px",
      },
      boxShadow: {
        posPanel: "0 14px 34px rgba(0, 0, 0, 0.42)",
      },
    },
  },
  plugins: [],
};
