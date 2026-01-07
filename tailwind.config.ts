import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cardan: {
          primary: "#22c55e",
          secondary: "#6b7280",
          accent: "#8b5cf6",
          danger: "#ef4444",
          warning: "#f59e0b",
          success: "#10b981",
        },
      },
    },
  },
  plugins: [],
};
export default config;
