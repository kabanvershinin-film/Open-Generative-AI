'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'sapog_theme';
const ThemeContext = createContext(null);

function applyTheme(nextTheme) {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = nextTheme;
    document.body.dataset.theme = nextTheme;
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme = typeof window !== 'undefined'
            ? window.localStorage.getItem(THEME_KEY)
            : null;
        const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
        setThemeState(initialTheme);
        applyTheme(initialTheme);
        setMounted(true);
    }, []);

    const setTheme = (nextTheme) => {
        const normalizedTheme = nextTheme === 'dark' ? 'dark' : 'light';
        setThemeState(normalizedTheme);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(THEME_KEY, normalizedTheme);
        }
        applyTheme(normalizedTheme);
    };

    const value = useMemo(() => ({
        theme,
        mounted,
        setTheme,
        toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
        isLight: theme === 'light',
    }), [mounted, theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const value = useContext(ThemeContext);
    if (!value) {
        throw new Error('useTheme должен использоваться внутри ThemeProvider');
    }
    return value;
}
