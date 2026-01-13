import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cozy Library with POP - Vibrant Reading Room Palette
        walnut: {
          DEFAULT: 'rgb(18, 14, 12)',
          50: 'rgb(35, 28, 24)',
          100: 'rgb(30, 24, 20)',
          200: 'rgb(25, 20, 17)',
          300: 'rgb(22, 17, 14)',
          400: 'rgb(18, 14, 12)',
          500: 'rgb(14, 11, 9)',
          600: 'rgb(10, 8, 6)',
        },
        charcoal: {
          DEFAULT: 'rgb(28, 24, 20)',
          light: 'rgb(42, 36, 30)',
        },
        // VIBRANT GOLD - really pops!
        brass: {
          DEFAULT: 'rgb(255, 195, 0)',
          light: 'rgb(255, 215, 70)',
          dark: 'rgb(200, 150, 0)',
        },
        // Warm amber glow
        lamp: {
          DEFAULT: 'rgb(255, 180, 50)',
          glow: 'rgba(255, 180, 50, 0.25)',
        },
        cream: {
          DEFAULT: 'rgb(255, 250, 240)',
          dark: 'rgb(220, 210, 195)',
        },
        parchment: 'rgb(245, 235, 220)',
        bronze: {
          DEFAULT: 'rgb(55, 45, 35)',
          light: 'rgb(80, 65, 50)',
        },
        // Vibrant teal-green
        'library-green': {
          DEFAULT: 'rgb(16, 185, 129)',
          light: 'rgb(52, 211, 153)',
          dark: 'rgb(5, 150, 105)',
        },
        // Rich wine/magenta
        burgundy: {
          DEFAULT: 'rgb(190, 50, 90)',
          light: 'rgb(236, 72, 153)',
          dark: 'rgb(150, 30, 70)',
        },
        leather: {
          DEFAULT: 'rgb(120, 75, 45)',
          light: 'rgb(160, 100, 60)',
        },
        // Electric accent for extra pop
        electric: {
          DEFAULT: 'rgb(99, 102, 241)',
          light: 'rgb(129, 140, 248)',
          cyan: 'rgb(34, 211, 238)',
        },
        // Keep legacy colors for backward compatibility
        primary: {
          DEFAULT: 'rgb(255, 195, 0)', // Matches vibrant brass
          dark: 'rgb(200, 150, 0)',
          light: 'rgb(255, 215, 70)',
        },
        accent: 'rgb(45, 74, 62)', // Now maps to library-green
        surface: {
          DEFAULT: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.12)',
        },
      },
      animation: {
        'card-flip': 'cardFlip 0.6s ease-out',
        'shuffle': 'shuffle 0.15s ease-in-out',
        'lock-snap': 'lockSnap 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'warm-pulse': 'warmPulse 3s ease-in-out infinite',
      },
      keyframes: {
        cardFlip: {
          '0%': { transform: 'rotateY(-90deg) scale(0.9)', opacity: '0' },
          '100%': { transform: 'rotateY(0) scale(1)', opacity: '1' },
        },
        shuffle: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px) rotate(-2deg)' },
          '75%': { transform: 'translateX(5px) rotate(2deg)' },
        },
        lockSnap: {
          '0%': { transform: 'scale(1.1)', boxShadow: '0 0 30px rgba(201,169,89,0.8)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(201,169,89,0)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        warmPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(232, 200, 125, 0.15)' },
          '50%': { boxShadow: '0 0 35px rgba(232, 200, 125, 0.25)' },
        },
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(180deg, rgb(26, 21, 18) 0%, rgb(20, 16, 14) 50%, rgb(26, 21, 18) 100%)',
        'card-gradient': 'linear-gradient(135deg, rgb(37, 32, 25) 0%, rgb(30, 26, 20) 100%)',
        'brass-gradient': 'linear-gradient(135deg, rgb(201, 169, 89) 0%, rgb(180, 145, 70) 100%)',
      },
    },
  },
  plugins: [],
}
export default config
