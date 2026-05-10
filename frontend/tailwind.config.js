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
        display: ["Manrope", "sans-serif"],
      },
      colors: {
        border: "rgba(109, 117, 140, 0.1)",
        input: "rgba(109, 117, 140, 0.1)",
        ring: "#6D28D9",
        background: "#060e20",
        foreground: "#dee5ff",
        primary: {
          DEFAULT: "#be9dff",
          dim: "#8b4ef7",
          container: "#b28cff",
          foreground: "#3d0088",
        },
        secondary: {
          DEFAULT: "#69f6b8",
          foreground: "#005a3c",
        },
        surface: {
          DEFAULT: "#060e20",
          dim: "#060e20",
          low: "#091328",
          container: "#0f1930",
          high: "#141f38",
          highest: "#192540",
          bright: "#1f2b49",
        },
        muted: {
          DEFAULT: "#0f1930",
          foreground: "#a3aac4",
        },
        accent: {
          DEFAULT: "#be9dff",
          foreground: "#060e20",
        },
        outline: {
          DEFAULT: "#6d758c",
          variant: "rgba(64, 72, 93, 0.15)",
        },
      },
      borderRadius: {
        xl: "3rem",
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
        full: "9999px",
      },
      backgroundImage: {
        "pulse-gradient": "linear-gradient(135deg, #8b4ef7 0%, #be9dff 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(25, 37, 64, 0.4) 0%, rgba(31, 43, 73, 0.1) 100%)",
      },
    },
  },
  plugins: [],
}
