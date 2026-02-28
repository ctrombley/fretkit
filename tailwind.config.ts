import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        magenta: '#F73667',
        fret: {
          green: '#99C432',
          blue: '#00C4CC',
        },
        dark: '#1E2329',
        'dark-light': '#343B40',
      },
      fontFamily: {
        sans: ['Cabin', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
