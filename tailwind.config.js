/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
      },
      animation: {
        float: "float 6s infinite",
        "gradient-shift": "gradientShift 15s ease infinite",
        "bounce-game": "bounce 1.5s ease-in-out infinite",
        "pulse-game": "pulse 2s ease-in-out infinite",
        "rotate-slow": "rotate 4s linear infinite",
        "block-place": "blockPlace 0.3s ease-out",
        "clear-effect": "clearEffect 0.6s ease-out forwards",
        combo: "comboAnimation 1s ease-out",
        "border-glow": "borderGlow 3s ease infinite",
      },
      keyframes: {
        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        float: {
          "0%, 100%": {
            transform: "translateY(0) translateX(0)",
            opacity: "0",
          },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": {
            transform: "translateY(-100vh) translateX(50px)",
            opacity: "0",
          },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(5deg)" },
        },
        pulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
        rotate: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        blockPlace: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        clearEffect: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "30%": { transform: "scale(1.3)", opacity: "0.8" },
          "100%": { transform: "scale(0)", opacity: "0" },
        },
        comboAnimation: {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.5)" },
          "50%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1.2)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0.8) translateY(-50px)",
          },
        },
        borderGlow: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      colors: {
        game: {
          primary: "#1e3c72",
          secondary: "#2a5298",
          accent: "#7e22ce",
          purple: "#667eea",
          pink: "#f093fb",
          blue: "#4facfe",
          orange: "#fa709a",
        },
      },
    },
  },
  plugins: [],
};
