/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Noto Sans TC"',
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      colors: {
        sun: {
          50: "#fff9eb",
          100: "#fff0c7",
          300: "#ffd76a",
          500: "#f59e0b",
          600: "#d97706",
        },
        reef: {
          50: "#eefdf8",
          100: "#d5f7ed",
          500: "#14b8a6",
          700: "#0f766e",
        },
        heat: {
          50: "#fff1f0",
          100: "#ffe0dc",
          500: "#ef4444",
          700: "#b91c1c",
        },
        ink: {
          900: "#182033",
          700: "#334155",
          500: "#64748b",
          200: "#d9e2ef",
          100: "#eef3f8",
        },
      },
      boxShadow: {
        card: "0 18px 45px -24px rgba(24, 32, 51, 0.35)",
        lift: "0 22px 50px -28px rgba(185, 28, 28, 0.34)",
      },
      backgroundImage: {
        "sun-field":
          "linear-gradient(135deg, rgba(255, 249, 235, 0.94) 0%, rgba(238, 253, 248, 0.86) 46%, rgba(255, 241, 240, 0.9) 100%)",
      },
    },
  },
  plugins: [],
};
