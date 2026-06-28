/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'app-bg': 'rgb(var(--app-bg-rgb) / <alpha-value>)',
        'panel-bg': 'rgb(var(--panel-bg-rgb) / <alpha-value>)',
        'card-bg': 'rgb(var(--card-bg-rgb) / <alpha-value>)',
        primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--secondary-rgb) / <alpha-value>)',
        muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
