import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ============================================
         ELITE COLOR SYSTEM - INDIGO PRIMARY
         World-Class AI-Powered Business Intelligence OS
         ============================================ */
      colors: {
        // Base
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // Secondary Background
        'background-secondary': 'var(--background-secondary)',
        
        // Surface Layer
        surface: 'var(--surface)',
        
        // Text Hierarchy
        'foreground-secondary': 'var(--foreground-secondary)',
        'foreground-muted': 'var(--foreground-muted)',
        
        // Card
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          elevated: 'var(--card-elevated)',
        },
        
        // Popover
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        
        // Primary - Indigo (Interface Highlights, CTAs, Navigation)
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)',
          subtle: 'var(--primary-subtle)',
          'subtle-medium': 'var(--primary-subtle-medium)',
        },
        
        // Secondary
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        
        // Muted
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        
        // Accent
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        
        // Destructive - Muted Crimson (Alerts Only)
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
          subtle: 'var(--destructive-subtle)',
          'subtle-medium': 'var(--destructive-subtle-medium)',
        },
        
        // Warning - Soft Amber
        warning: {
          DEFAULT: 'var(--warning)',
          subtle: 'var(--warning-subtle)',
          foreground: 'var(--warning-foreground)',
        },
        
        // Success - Subtle Green (Financial Positive)
        success: {
          DEFAULT: 'var(--success)',
          subtle: 'var(--success-subtle)',
        },
        
        // Emerald - Secondary Accent for Financial Metrics
        emerald: {
          DEFAULT: 'var(--emerald)',
          subtle: 'var(--emerald-subtle)',
          'subtle-medium': 'var(--emerald-subtle-medium)',
        },
        
        // Indigo - Primary Brand Accent (backward compat)
        indigo: {
          DEFAULT: 'var(--indigo)',
          subtle: 'var(--indigo-subtle)',
          'subtle-medium': 'var(--indigo-subtle-medium)',
        },
        
        // Border & Input
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
          highlight: 'var(--border-highlight)',
        },
        input: 'var(--input)',
        ring: 'var(--ring)',
        
        // Sidebar
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        
        // Charts
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)',
        },
      },
      
      /* ============================================
         TYPOGRAPHY
         ============================================ */
      fontFamily: {
        sans: ['var(--font-bengali)', 'var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-inter-mono)', 'SF Mono', 'Fira Code', 'monospace'],
      },
      
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.01em' }],
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0' }],
        'sm': ['14px', { lineHeight: '20px', letterSpacing: '-0.006em' }],
        'base': ['15px', { lineHeight: '24px', letterSpacing: '-0.01em' }],
        'lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.012em' }],
        'xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.014em' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.016em' }],
        '3xl': ['30px', { lineHeight: '38px', letterSpacing: '-0.018em' }],
        '4xl': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
        '5xl': ['48px', { lineHeight: '56px', letterSpacing: '-0.022em' }],
        'kpi': ['40px', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
      
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      
      /* ============================================
         SPACING (8pt Grid)
         ============================================ */
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      
      /* ============================================
         BORDER RADIUS (Premium Rounded)
         ============================================ */
      borderRadius: {
        'none': '0',
        'sm': 'calc(var(--radius) - 6px)',
        'md': 'calc(var(--radius) - 4px)',
        'DEFAULT': 'calc(var(--radius) - 2px)',
        'lg': 'var(--radius)',
        'xl': 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 12px)',
        'full': '9999px',
      },
      
      /* ============================================
         BOX SHADOWS - SOFT LAYERED
         ============================================ */
      boxShadow: {
        'none': 'none',
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow-md)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'glow-emerald': 'var(--shadow-glow-emerald)',
        'glow-indigo': 'var(--shadow-glow-indigo)',
        'glow-warning': 'var(--shadow-glow-warning)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
      },
      
      /* ============================================
         ANIMATIONS
         ============================================ */
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      
      transitionTimingFunction: {
        'default': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      animation: {
        'fade-in': 'fadeIn 200ms var(--easing-default)',
        'fade-out': 'fadeOut 200ms var(--easing-default)',
        'slide-up': 'slideUp 200ms var(--easing-default)',
        'slide-down': 'slideDown 200ms var(--easing-default)',
        'slide-in': 'slideIn 200ms var(--easing-default)',
        'scale-in': 'scaleIn 200ms var(--easing-default)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'count-up': 'countUp 800ms var(--easing-smooth)',
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      
      /* ============================================
         BACKDROP BLUR
         ============================================ */
      backdropBlur: {
        'xs': '4px',
        'sm': '8px',
        'DEFAULT': '12px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
      },
      
      /* ============================================
         Z-INDEX SCALE
         ============================================ */
      zIndex: {
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
