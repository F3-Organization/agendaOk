/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Inter", "sans-serif"],
      },
      colors: {
        border: "rgba(148, 163, 184, 0.3)",
        input: "rgba(148, 163, 184, 0.3)",
        ring: "#1d4ed8",
        background: "#ffffff",
        foreground: "#0f172a",
        primary: {
          DEFAULT: "#1d4ed8",
          dim: "#1e3a8a",
          container: "#3b82f6",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff",
        },
        surface: {
          DEFAULT: "#ffffff",
          dim: "#f8fafc",
          low: "#f8fafc",
          container: "#f1f5f9",
          high: "#e2e8f0",
          highest: "#cbd5e1",
          bright: "#f8fafc",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        accent: {
          DEFAULT: "#1d4ed8",
          foreground: "#ffffff",
        },
        outline: {
          DEFAULT: "#94a3b8",
          variant: "rgba(148, 163, 184, 0.25)",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
        full: "9999px",
      },
      backgroundImage: {
        "pulse-gradient": "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.7) 100%)",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)",
        "card-md": "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
        "card-lg": "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05)",
      },
    },
  },
  plugins: [],
}
