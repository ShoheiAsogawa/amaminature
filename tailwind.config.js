/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: v('paper'),
        paper2: v('paper2'),
        card: v('card'),
        ink: v('ink'),
        ink2: v('ink2'),
        ink3: v('ink3'),
        accent: v('accent'),
        primary: v('primary'),
        onprimary: v('onprimary'),
        ruri: v('ruri'),
        kuri: v('kuri'),
        umi: v('umi'),
        sango: v('sango'),
        kin: v('kin'),
        danger: v('danger'),
        // ブランドの固定色（テーマに関わらず暗い面で使う）
        forest: {
          950: '#08190F',
          900: '#0E2A20',
          800: '#143A2C',
          700: '#1E4D3A',
          600: '#2B6750',
          300: '#9CC8B0',
          100: '#DCEBE2',
        },
        washi: '#F6F1E7',
        lapis: '#2A4FA3',
        gold: '#C79A2E',
      },
      fontFamily: {
        sans: ['"Zen Kaku Gothic New"', '"Hiragino Sans"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
        serif: ['"Shippori Mincho"', '"Hiragino Mincho ProN"', '"Yu Mincho"', 'serif'],
        latin: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 2px rgb(20 33 28 / 0.06), 0 8px 24px -12px rgb(20 33 28 / 0.18)',
        lift: '0 2px 4px rgb(20 33 28 / 0.08), 0 18px 40px -16px rgb(20 33 28 / 0.35)',
        glow: '0 0 0 1px rgb(199 154 46 / 0.6), 0 12px 40px -8px rgb(199 154 46 / 0.55)',
      },
      letterSpacing: {
        label: '0.18em',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.8s ease-in-out infinite',
        floaty: 'floaty 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
