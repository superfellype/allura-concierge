import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Allura Brand Colors
        terracotta: {
          50: "hsl(16 60% 95%)",
          100: "hsl(16 60% 90%)",
          200: "hsl(16 58% 80%)",
          300: "hsl(16 56% 70%)",
          400: "hsl(16 58% 60%)",
          500: "hsl(16 60% 50%)",
          600: "hsl(16 62% 42%)",
          700: "hsl(16 65% 35%)",
          800: "hsl(16 68% 28%)",
          900: "hsl(16 70% 20%)",
        },
        cream: {
          50: "hsl(35 40% 99%)",
          100: "hsl(35 35% 97%)",
          200: "hsl(35 30% 94%)",
          300: "hsl(35 28% 90%)",
          400: "hsl(35 25% 85%)",
          500: "hsl(35 22% 78%)",
        },
        // Vitrine Premium Colors - Editorial Design System
        vitrine: {
          // Core palette from spec
          bg: "hsl(35 18% 96%)",           // #F7F5F2
          surface: "hsl(0 0% 100%)",        // #FFFFFF
          text: "hsl(0 0% 11%)",            // #1C1C1C
          "text-secondary": "hsl(0 0% 43%)", // #6E6E6E
          accent: "hsl(35 20% 71%)",        // #C7B8A3
          border: "hsl(35 12% 90%)",        // #E6E3DE
          // Legacy aliases
          cream: "hsl(35 18% 96%)",
          sand: "hsl(35 20% 90%)",
          charcoal: "hsl(0 0% 11%)",
          gold: "hsl(35 20% 71%)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        'soft': '0 4px 30px hsl(16 60% 30% / 0.08)',
        'elegant': '0 8px 40px hsl(16 60% 30% / 0.12)',
        'glow': '0 0 60px hsl(16 60% 50% / 0.2)',
        'glass': '0 8px 32px 0 hsl(16 60% 30% / 0.06)',
        'liquid': '0 20px 60px hsl(16 60% 30% / 0.15), 0 8px 20px hsl(16 60% 30% / 0.1)',
        'liquid-hover': '0 30px 80px hsl(16 60% 30% / 0.2), 0 12px 30px hsl(16 60% 30% / 0.12)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(16 60% 50% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(16 60% 50% / 0.5)" },
        },
        "morph": {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
        },
        "zoom-in": {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "float": "float 6s ease-in-out infinite",
        "float-gentle": "float-gentle 4s ease-in-out infinite",
        "shimmer": "shimmer 3s infinite linear",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "morph": "morph 8s ease-in-out infinite",
        "zoom-in": "zoom-in 0.4s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
