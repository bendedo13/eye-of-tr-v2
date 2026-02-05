// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00d9ff",
        "primary-glow": "rgba(0, 217, 255, 0.15)",
        secondary: "#8b5cf6",
        accent: "#0ea5e9",
        background: "#0a0e27",
        surface: "#1a1f3a",
        border: "rgba(0, 217, 255, 0.1)",
        "face-seek-deep-space": "#0a0e27",
        "face-seek-dark-slate": "#1a1f3a",
        "face-seek-midnight": "#0d1117",
        "face-seek-cyan": "#00d9ff",
        "face-seek-blue": "#0ea5e9",
        "face-seek-purple": "#8b5cf6",
        "face-seek-green": "#10b981",
        "face-seek-gold": "#fbbf24",
      },
      fontFamily: {
        sans: ["System"], // Use system font for native feel
        mono: ["System"],
      },
    },
  },
  plugins: [],
};
