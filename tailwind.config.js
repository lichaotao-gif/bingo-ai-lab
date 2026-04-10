/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--color-page)",
        surface: "var(--color-surface)",
        "card-inner": "var(--color-card-inner)",
        fg: {
          DEFAULT: "var(--color-text)",
          muted: "var(--color-text-secondary)",
          soft: "var(--color-text-tertiary)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          muted: "var(--color-primary-muted)",
        },
        "border-subtle": "var(--color-border-subtle)",
        "border-ui": "var(--color-border-ui)",
        success: "var(--color-success)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      maxWidth: {
        layout: "var(--layout-max-width)",
      },
      spacing: {
        header: "var(--header-height)",
        sidebar: "var(--sidebar-width)",
      },
      borderRadius: {
        panel: "var(--radius-panel)",
        pill: "31px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        popover: "var(--shadow-popover)",
      },
    },
  },
  plugins: [],
};
