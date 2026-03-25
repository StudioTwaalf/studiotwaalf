import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // lib/ files may contain Tailwind class strings (e.g. offer-status.ts)
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        studio: {
          yellow: "#E7C46A",
          beige:  "#F7F3EA",
          pink:   "#FFCED3",
          sand:   "#E8DCBB",
          sage:   "#A8BFA3",
          black:  "#111111",
        },
      },
      borderRadius: {
        xl:  "16px",
        "2xl": "24px",
      },
      boxShadow: {
        soft: "0 8px 24px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
