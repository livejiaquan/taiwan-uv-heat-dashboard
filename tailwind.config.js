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
        canvas: "#F6F7F2",
        line: "#C9D4CC",
        sun: {
          50: "#FFF5EB", 100: "#FFE5C2", 300: "#FDBA74", 500: "#EA6A22", 600: "#C2410C",
        },
        reef: {
          50: "#eefdf8",
          100: "#d5f7ed",
          500: "#14b8a6",
          700: "#0f766e",
        },
        heat: {
          50: "#FFF1F3", 100: "#FFE0E6", 500: "#E11D48", 700: "#9F1239",
        },
        ink: {
          900: "#10211C",
          700: "#365148",
          500: "#64748b",
          200: "#d9e2ef",
          100: "#eef3f8",
        },
      },
      boxShadow: {
        card: "0 12px 32px -22px rgba(16, 33, 28, 0.28)",
        lift: "0 22px 50px -28px rgba(185, 28, 28, 0.34)",
      },
      backgroundImage: {
        "sun-field":
          "radial-gradient(circle at 3% 4%, rgba(234, 106, 34, 0.11), transparent 28%), radial-gradient(circle at 94% 14%, rgba(225, 29, 72, 0.08), transparent 24%), #F6F7F2",
      },
    },
  },
  plugins: [],
};
