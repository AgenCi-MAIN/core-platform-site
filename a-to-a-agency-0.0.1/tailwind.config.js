/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./app/components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        command: {
          ink: "#050607",
          panel: "#0e1012",
          frame: "#1a1c20",
          text: "#f8fafc",
          muted: "#aeb5c2",
          red: "#ff2f2f",
          danger: "#ff4d4d",
        },
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255, 47, 47, 0.22), 0 20px 40px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
