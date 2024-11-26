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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      boxShadow: {
        outset: "0px 1px 1px 0px rgba(255, 255, 255, 0.25) inset, 0px 4px 4px 0px rgba(255, 255, 255, 0.12) inset, 0px 0px 0px 1px rgba(255, 255, 255, 0.12) inset, 0px -0.5px 2px 0px rgba(0, 0, 0, 0.08) inset, 0px 0px 0px 0.5px rgba(0, 0, 0, 0.08), 0px 1px 3px 0px rgba(0, 0, 0, 0.05), 0px 0px 2px 0px rgba(0, 0, 0, 0.12)",
        outsetDark: "0px 1px 1px 0px rgba(255, 255, 255, 0.08) inset, 0px 0px 0px 1px rgba(255, 255, 255, 0.04) inset, 0px 2px 4px 0px rgba(255, 255, 255, 0.08) inset, 0px 0px 0px 0.5px rgba(255, 255, 255, 0.08), 0px 1px 3px 0px rgba(0, 0, 0, 0.05), 0px 0px 2px 0px rgba(0, 0, 0, 0.12)",
        outsetHover: "0px 1px 1px 0px rgba(255, 255, 255, 0.18) inset, 0px 0px 0px 1px rgba(255, 255, 255, 0.12) inset, 0px -0.5px 2px 0px rgba(0, 0, 0, 0.08) inset, 0px 0px 0px 0.5px rgba(0, 0, 0, 0.08), 0px 1px 3px 0px rgba(0, 0, 0, 0.05), 0px 0px 4px 0px rgba(0, 0, 0, 0.08)",
      }
    },
    fontFamily: {
      serif: ['var(--libre-caslon-condensed)', 'serif'],
      sans: ['var(--font-geist-sans)', 'sans-serif'],
    }
  },
  plugins: [],
};
export default config;
