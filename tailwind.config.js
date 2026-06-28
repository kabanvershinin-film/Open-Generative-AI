/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./packages/studio/src/**/*.{js,jsx}",
        "./packages/Open-AI-Design-Agent/packages/design-agent/src/**/*.{js,jsx}",
        "./packages/Open-Poe-AI/packages/agents/src/**/*.{js,jsx,ts,tsx}",
        "./packages/Vibe-Workflow/packages/workflow-builder/src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                },
                'app-bg': 'var(--bg-app)',
                'panel-bg': 'var(--bg-panel)',
                'card-bg': 'var(--bg-card)',
                secondary: 'var(--color-secondary)',
                muted: 'var(--text-muted)',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
                '3xl': '2rem',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(217, 70, 239, 0.4)',
                'glow-accent': '0 0 20px rgba(168, 85, 247, 0.4)',
                '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.8)',
            }
        },
    },
    plugins: [],
}
