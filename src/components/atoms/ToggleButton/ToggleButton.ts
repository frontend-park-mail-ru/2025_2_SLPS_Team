import ToggleButtonTemplate from './ToggleButton.hbs';
import './ToggleButton.css'


type Theme = 'light' | 'dark';

export class ToggleButton {
    wrapper: HTMLElement | null = null;
    private readonly STORAGE_KEY = 'theme';

    constructor(public rootElement: HTMLElement) {}

    render(): void {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ToggleButtonTemplate({});

        this.wrapper = tempDiv.firstElementChild as HTMLElement | null;
        if (!this.wrapper) return;

        this.initTheme();
        this.wrapper.addEventListener('click', () => this.toggleTheme());

        this.rootElement.appendChild(this.wrapper);
    }

    private initTheme(): void {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme | null;

        if (savedTheme) {
            this.applyTheme(savedTheme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        }
    }

    private toggleTheme(): void {
        const currentTheme = document.documentElement.getAttribute('data-theme') as Theme | null;
        const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

        this.applyTheme(newTheme);
        localStorage.setItem(this.STORAGE_KEY, newTheme);
    }

    private applyTheme(theme: Theme): void {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    }
}
