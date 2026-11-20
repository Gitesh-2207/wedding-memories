/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#F8F3E9',
          50: '#FDFCF9',
          100: '#F8F3E9',
          200: '#EDE4D1',
          300: '#DFD1B3',
        },
        gold: {
          DEFAULT: '#D8B978',
          light: '#E6D0A3',
          dark: '#B89750',
          50: '#FBF8F0',
          100: '#F6EFDC',
          200: '#EBDCB4',
          300: '#DFC88B',
          400: '#D8B978',
          500: '#C29F55',
          600: '#9E7E3A',
        },
        maroon: {
          DEFAULT: '#8C2436',
          light: '#A53449',
          dark: '#681523',
          50: '#F9ECEE',
          100: '#F0D1D6',
          200: '#DEA3AD',
          300: '#C77382',
          400: '#AB4658',
          500: '#8C2436',
          600: '#731828',
          700: '#590E1C',
        },
        brown: {
          DEFAULT: '#45372E',
          light: '#5E4C41',
          dark: '#2E241E',
          50: '#F6F4F3',
          100: '#E7E3E0',
          200: '#CFC6C0',
          300: '#B0A39B',
          400: '#7F6C60',
          500: '#45372E',
          600: '#382C24',
          700: '#2A201A',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #F8F3E9 0%, #EDE4D1 100%)',
        'gold-shimmer': 'linear-gradient(90deg, #D8B978 0%, #F5E6C4 50%, #D8B978 100%)',
        'maroon-gradient': 'linear-gradient(135deg, #8C2436 0%, #681523 100%)',
      },
      boxShadow: {
        'royal': '0 10px 25px -5px rgba(69, 55, 46, 0.08), 0 8px 10px -6px rgba(69, 55, 46, 0.05)',
        'royal-lg': '0 20px 30px -10px rgba(69, 55, 46, 0.12), 0 10px 15px -5px rgba(69, 55, 46, 0.08)',
        'gold-glow': '0 0 15px rgba(216, 185, 120, 0.35)',
      }
    },
  },
  plugins: [],
}
