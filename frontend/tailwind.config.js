/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stevens Brand Colors
        stevensMaroon: {
          DEFAULT: '#9D1535',
          50: '#F9E8EC',
          100: '#F3D1D9',
          200: '#E7A3B3',
          300: '#DB758D',
          400: '#CF4767',
          500: '#9D1535',
          600: '#7E112A',
          700: '#5E0D20',
          800: '#3F0815',
          900: '#1F040B',
        },
        stevensGray: {
          DEFAULT: '#949594',
          50: '#F7F7F7',
          100: '#EFEFEF',
          200: '#DFDFDF',
          300: '#CFCFCF',
          400: '#BFBFBF',
          500: '#949594',
          600: '#767676',
          700: '#595959',
          800: '#3B3B3B',
          900: '#1E1E1E',
        },
        // Semantic colors
        appBg: '#F3F2EF',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        borderLight: '#F3F4F6',
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
        accent: {
          DEFAULT: '#9D1535',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      borderRadius: {
        'lg': '0.875rem',
        'xl': '1rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.08)',
        'card-hover': '0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px 0 rgba(0,0,0,0.12)',
        'elevated': '0 0 0 1px rgba(0,0,0,0.08), 0 2px 6px 0 rgba(0,0,0,0.1)',
        'elevated-hover': '0 0 0 1px rgba(0,0,0,0.08), 0 6px 12px 0 rgba(0,0,0,0.15)',
      },
      maxWidth: {
        'container': '1128px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in',
        'fade-up': 'fadeUp 0.2s ease-out',
        'slide-in': 'slideIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'badge-pulse': 'badgePulse 0.6s cubic-bezier(0.4, 0, 0.6, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        badgePulse: {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': {
            transform: 'scale(1.15)',
            opacity: '0.9'
          },
        },
      },
    },
  },
  plugins: [],
}
