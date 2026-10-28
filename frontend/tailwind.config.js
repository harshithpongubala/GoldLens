/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#191919',
        shell: '#1E1E1E',
        sidebar: '#141414',
        card: {
          DEFAULT: 'rgba(38, 38, 38, 0.65)',
          solid: '#262626',
          border: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(50, 50, 50, 0.8)',
        },
        gold: {
          light: '#F3E5AB',
          DEFAULT: '#D1B15F',
          dark: '#B8933D',
          glow: 'rgba(209, 177, 95, 0.25)'
        },
        sage: {
          light: '#A3C4BC',
          DEFAULT: '#84A98C',
          dark: '#52796F',
          glow: 'rgba(132, 169, 140, 0.25)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.55)',
        'gold-glow': '0 0 25px rgba(209, 177, 95, 0.2)',
      }
    },
  },
  plugins: [],
}
