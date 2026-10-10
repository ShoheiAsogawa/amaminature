/** @type {import('tailwindcss').Config} */
// デザインシステム「瑠璃の野帳」（docs/DESIGN_SYSTEM.md §2.4・§3.2・§3.3・§4.1・§4.3）
const v = (n) => `rgb(var(--c-${n}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    // §3.2 書体は IBM Plex の 1 ファミリー（serif・latin は持たない）
    fontFamily: {
      sans: ['"IBM Plex Sans JP"', '"Hiragino Sans"', '"Hiragino Kaku Gothic ProN"', '"Yu Gothic UI"', 'Meiryo', 'system-ui', 'sans-serif'],
      num: ['"IBM Plex Sans"', '"IBM Plex Sans JP"', '-apple-system', '"Hiragino Sans"', 'Roboto', 'system-ui', 'sans-serif'],
    },
    // §3.4 太さは 400 と 600 だけ
    fontWeight: { normal: '400', semibold: '600' },
    // §3.3 文字サイズ（text-xs〜text-9xl は使わない）
    fontSize: {
      display: ['28px', { lineHeight: '36px', fontWeight: '600' }],
      title: ['22px', { lineHeight: '30px', fontWeight: '600' }],
      section: ['18px', { lineHeight: '26px', fontWeight: '600' }],
      headline: ['16px', { lineHeight: '22px', fontWeight: '600' }],
      body: ['15px', { lineHeight: '26px' }],
      callout: ['15px', { lineHeight: '22px' }],
      input: ['16px', { lineHeight: '24px' }],
      sub: ['13px', { lineHeight: '20px' }],
      tile: ['13px', { lineHeight: '18px', fontWeight: '600' }],
      caption: ['12px', { lineHeight: '16px', letterSpacing: '0.02em' }],
      tab: ['11px', { lineHeight: '14px', letterSpacing: '0.02em' }],
      'num-xl': ['40px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '600' }],
      'num-kpi': ['28px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
      'num-l': ['22px', { lineHeight: '26px', letterSpacing: '-0.01em', fontWeight: '600' }],
    },
    // §4.1 角丸
    borderRadius: { none: '0', bar: '2px', xs: '6px', thumb: '8px', sm: '10px', md: '12px', lg: '16px', full: '9999px' },
    // §4.3 影は浮いている層だけ（none はダークで影を消すため）
    boxShadow: {
      none: 'none',
      sheet: '0 -8px 32px rgb(0 0 0 / .14)',
      toast: '0 8px 24px rgb(0 0 0 / .18)',
      thumb: '0 1px 2px rgb(0 0 0 / .12)',
      object: '0 24px 48px rgb(0 0 0 / .45)',
    },
    extend: {
      // §2.4 色（値は src/styles/index.css の --c-*）
      colors: {
        page: v('page'),
        surface: v('surface'),
        fill: { DEFAULT: v('fill'), strong: v('fill-strong') },
        sep: v('sep'),
        fg: { DEFAULT: v('fg'), 2: v('fg-2'), 3: v('fg-3') },
        brand: { DEFAULT: v('brand'), fill: v('brand-fill'), pressed: v('brand-pressed'), soft: v('brand-soft') },
        'on-brand': v('on-brand'),
        'on-danger': v('on-danger'),
        success: v('success'),
        warning: v('warning'),
        danger: v('danger'),
        legend: v('legend'),
        silhouette: v('silhouette'),
        'line-green': v('line-green'),
        thumb: v('thumb'),
        toast: { DEFAULT: v('toast'), fg: v('toast-fg') },
      },
    },
  },
  plugins: [],
};
