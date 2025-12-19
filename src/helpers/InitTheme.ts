type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export function initTheme(): void {
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;

    if (savedTheme) {
        applyTheme(savedTheme);
        return;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
}

function applyTheme(theme: Theme): void {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
}

export function isDarkTheme(): boolean {
    if (document.documentElement.getAttribute('data-theme') === 'dark') {
        return true;
    }

    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'dark') {
        return true;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
