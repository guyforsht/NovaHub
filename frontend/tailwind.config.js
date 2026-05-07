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
          50: "#f4f8ff",
          100: "#e8f0ff",
          200: "#ceddff",
          500: "#4f7cff",
          600: "#3f63d6",
          700: "#334fa8",
        },
      },
      boxShadow: {
        calm: "0 8px 30px rgba(31, 41, 55, 0.08)",
      },
    },
  },
  plugins: [],
};
