import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-shift2-primary',
    'bg-shift2-secondary',
    'bg-shift2-accent',
    'hover:bg-shift2-primary',
    'hover:bg-shift2-secondary',
    'text-shift2-primary',
    'border-shift2-primary',
  ],
  theme: {
    extend: {
      colors: {
        shift2: {
          primary: "#1f0036",      // Donker paars (logo kleur)
          secondary: "#6b2d8f",    // Medium paars
          accent: "#b565d8",       // Licht paars
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
