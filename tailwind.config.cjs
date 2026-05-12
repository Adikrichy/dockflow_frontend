module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lp: {
          bg: 'var(--lp-bg)',
          surface: 'var(--lp-surface)',
          surface2: 'var(--lp-surface2)',
          surface3: 'var(--lp-surface3)',
          border: 'var(--lp-border)',
          accent: 'var(--lp-accent)',
          accent2: 'var(--lp-accent2)',
          text: 'var(--lp-text)',
          text2: 'var(--lp-text2)',
           text3: 'var(--lp-text3)',
           green: 'var(--lp-green)',
         }
      }
    },
  },
  plugins: [],
}
