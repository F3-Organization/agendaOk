/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
        border: "rgb(var(--color-outline) / 0.25)",
        input: "rgb(var(--color-outline) / 0.25)",
        ring: "rgb(var(--color-ring) / <alpha-value>)",
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          dim: "rgb(var(--color-primary-dim) / <alpha-value>)",
          container: "rgb(var(--color-primary-container) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          foreground: "rgb(var(--color-secondary-foreground) / <alpha-value>)",
        },
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          dim: "rgb(var(--color-surface-dim) / <alpha-value>)",
          low: "rgb(var(--color-surface-low) / <alpha-value>)",
          container: "rgb(var(--color-surface-container) / <alpha-value>)",
          high: "rgb(var(--color-surface-high) / <alpha-value>)",
          highest: "rgb(var(--color-surface-highest) / <alpha-value>)",
          bright: "rgb(var(--color-surface-bright) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
          foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          foreground: "rgb(var(--color-accent-foreground) / <alpha-value>)",
        },
        outline: {
          DEFAULT: "rgb(var(--color-outline) / <alpha-value>)",
          variant: "rgb(var(--color-outline) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--color-destructive) / <alpha-value>)",
          foreground: "rgb(var(--color-destructive-foreground) / <alpha-value>)",
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
  plugins: [require('tailwindcss-animate')],
}
