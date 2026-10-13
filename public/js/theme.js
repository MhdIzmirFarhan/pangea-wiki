// Shared Tailwind theme for the viewer and admin portals.
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'surface-container-low': '#141720',
        'secondary': '#43e2d2',
        'secondary-container': '#00c6b7',
        'primary-container': '#c89b3c',
        'on-background': '#dfe2ef',
        'surface-container-highest': '#2e323d',
        'surface-dim': '#0f131c',
        'surface-container-lowest': '#080b11',
        'surface-container': '#181b25',
        'on-primary': '#241800',
        'surface': '#0f131c',
        'outline-variant': '#3f4452',
        'outline': '#8b90a0',
        'on-surface': '#f1f3fa',
        'on-surface-variant': '#b8bdce',
        'background': '#0b0e15',
        'primary': '#f0bf5c',
        'surface-container-high': '#222632',
        'tertiary': '#ffb3ae',
      },
      fontFamily: {
        serif: ['EB Garamond', 'serif'],
        sans: ['Outfit', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
    },
  },
};
