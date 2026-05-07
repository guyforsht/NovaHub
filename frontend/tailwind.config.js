/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Heebo", "sans-serif"],
      },
      colors: {
        calm: {
          50:  "#f4f7f4",
          100: "#e4ede4",
          200: "#c5d9c6",
          300: "#9bbf9d",
          500: "#5a7d5c",
          600: "#476549",
          700: "#38503a",
          800: "#2c3f2d",
        },
        stone: {
          50:  "#fafaf8",
          100: "#f4f3f0",
          200: "#e8e6e1",
          300: "#d4d1cb",
          400: "#b8b4ac",
          500: "#8f8b83",
          600: "#6b6760",
          700: "#504d47",
          800: "#3b3935",
          900: "#1c1b18",
        },
      },
      boxShadow: {
        calm: "0 4px 24px rgba(56, 80, 58, 0.08)",
        card: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
