/** @type {import('tailwindcss').Config} */
// ゲームUI「アマミ図鑑クエスト」（docs/DESIGN_SYSTEM.md）
const v = (n) => `rgb(var(--c-${n}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    // 文字はすべてドット文字（docs/DESIGN_SYSTEM.md §3）。本文は DotGothic16（16px で 1 ドット = 1px）、
    // 小さい文字（12px）と見出し（24・36px）は PixelMplus12、数字は Jersey 15
    fontFamily: {
      sans: ['DotGothic16', '"Hiragino Sans"', '"Yu Gothic UI"', 'Meiryo', 'system-ui', 'sans-serif'],
      num: ['"Jersey 15"', 'DotGothic16', 'system-ui', 'sans-serif'],
      pixel: ['DotGothic16', '"Hiragino Sans"', 'monospace'],
      small: ['"PixelMplus12 Text"', 'DotGothic16', '"Hiragino Sans"', 'sans-serif'],
      head: ['PixelMplus12', '"Jersey 15"', 'DotGothic16', '"Hiragino Sans"', 'sans-serif'],
    },
    fontWeight: { normal: '500', semibold: '700', bold: '800', black: '900' },
    fontSize: {
      // ドット文字がにじまない大きさ：PixelMplus12 は 12 の倍数（12・24・36）、DotGothic16 は 16
      display: ['36px', { lineHeight: '44px', fontWeight: '900' }],
      title: ['24px', { lineHeight: '32px', fontWeight: '800' }],
      section: ['24px', { lineHeight: '30px', fontWeight: '800' }],
      headline: ['16px', { lineHeight: '24px', fontWeight: '700' }],
      body: ['16px', { lineHeight: '26px' }],
      callout: ['16px', { lineHeight: '24px' }],
      input: ['16px', { lineHeight: '24px' }],
      sub: ['12px', { lineHeight: '18px' }],
      tile: ['12px', { lineHeight: '16px', fontWeight: '800' }],
      caption: ['12px', { lineHeight: '16px', fontWeight: '700' }],
      tab: ['12px', { lineHeight: '14px', fontWeight: '800' }],
      'num-xl': ['48px', { lineHeight: '52px', letterSpacing: '0.01em' }],
      'num-kpi': ['30px', { lineHeight: '34px', letterSpacing: '0.01em' }],
      'num-l': ['24px', { lineHeight: '28px', letterSpacing: '0.01em' }],
    },
    borderRadius: { none: '0', bar: '999px', xs: '10px', thumb: '12px', sm: '14px', md: '18px', lg: '24px', xl: '28px', full: '9999px' },
    boxShadow: {
      none: 'none',
      // 押せる面の「厚み」（下に 4px の縁）。押すと縁がなくなって沈む
      pop: '0 4px 0 rgb(var(--c-edge))',
      'pop-sm': '0 3px 0 rgb(var(--c-edge))',
      sheet: '0 -8px 32px rgb(0 0 0 / .18)',
      toast: '0 8px 24px rgb(0 0 0 / .22)',
      thumb: '0 1px 2px rgb(0 0 0 / .14)',
      object: '0 24px 48px rgb(0 0 0 / .45)',
      glow: '0 0 0 4px rgb(var(--c-brand) / .18)',
    },
    extend: {
      colors: {
        page: v('page'),
        surface: v('surface'),
        fill: { DEFAULT: v('fill'), strong: v('fill-strong') },
        sep: v('sep'),
        line: v('line'),
        edge: v('edge'),
        // ドット絵の枠の線と、飾りの窓の帯（docs/DESIGN_SYSTEM.md §4.1）
        ink: v('ink'),
        band: v('band'),
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
        gold: { DEFAULT: v('gold'), edge: v('gold-edge'), soft: v('gold-soft') },
        xp: { DEFAULT: v('xp'), edge: v('xp-edge') },
        capture: { DEFAULT: v('capture'), edge: v('capture-edge') },
        night: { DEFAULT: v('night'), 2: v('night-2') },
        // 生き物のタイプ（分類）の色。チップの地（白い文字 4.5:1）と、淡い地
        type: {
          mammal: v('type-mammal'),
          bird: v('type-bird'),
          herp: v('type-herp'),
          insect: v('type-insect'),
          aqua: v('type-aqua'),
          plant: v('type-plant'),
        },
        'type-soft': {
          mammal: v('type-mammal-soft'),
          bird: v('type-bird-soft'),
          herp: v('type-herp-soft'),
          insect: v('type-insect-soft'),
          aqua: v('type-aqua-soft'),
          plant: v('type-plant-soft'),
        },
        // レア度の色（星の色）
        rare: { 1: v('rare-1'), 2: v('rare-2'), 3: v('rare-3'), 4: v('rare-4') },
      },
      keyframes: {
        'pop-in': { '0%': { transform: 'scale(.6)', opacity: '0' }, '60%': { transform: 'scale(1.08)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        // ドット絵の波紋：拡大（scale）するとドットがにじむので、枠の大きさを 3px ずつ広げる（steps）
        'ring-pulse': { '0%': { inset: '0px', opacity: '.55' }, '100%': { inset: '-18px', opacity: '0' } },
        wiggle: { '0%,100%': { transform: 'rotate(0)' }, '25%': { transform: 'rotate(-8deg)' }, '75%': { transform: 'rotate(8deg)' } },
        shine: { '0%': { transform: 'translateX(-120%) skewX(-20deg)' }, '60%,100%': { transform: 'translateX(220%) skewX(-20deg)' } },
        stripes: { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '20px 0' } },
        'spin-slow': { to: { transform: 'rotate(360deg)' } },
        twinkle: { '0%,100%': { opacity: '.2', transform: 'scale(.6)' }, '50%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: {
        'pop-in': 'pop-in .45s cubic-bezier(.2,.9,.3,1.3) both',
        float: 'float 3s ease-in-out infinite',
        'ring-pulse': 'ring-pulse 1.8s steps(6, end) infinite',
        wiggle: 'wiggle .5s ease-in-out',
        shine: 'shine 3.2s ease-in-out infinite',
        stripes: 'stripes 1s linear infinite',
        'spin-slow': 'spin-slow 12s linear infinite',
        twinkle: 'twinkle 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
