/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "#1E293B",
        surfaceLight: "#334155",
        primary: "#F59E0B",
        primaryHover: "#D97706",
        secondary: "#38BDF8",
        success: "#22C55E",
        error: "#EF4444",
        text: "#FFFFFF",
        textMuted: "#94A3B8",
        border: "#334155",
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
    },
  },
  plugins: [],
};
