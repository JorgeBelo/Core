/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores oficiais da marca Core
        primary: {
          DEFAULT: '#a20100', // Vermelho principal
          dark: '#8a0100',
          light: '#b80100',
        },
        gray: {
          light: '#b4b4b4', // Cinza claro oficial
          DEFAULT: '#808080',
          dark: '#404040',
        },
        dark: {
          DEFAULT: '#000000', // Preto principal
          soft: '#1a1a1a', // Preto suave alternativo
          lighter: '#2a2a2a',
        },
      },
      fontFamily: {
        // Fonte principal da marca (AC Soft Icecream) com fallbacks gordinhas e redondinhas
        brand: ['AC Soft Icecream', 'Fredoka One', 'Comfortaa', 'cursive'],
        // Fonte do sistema (sans-serif moderna)
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
      },
    },
  },
  plugins: [],
}
