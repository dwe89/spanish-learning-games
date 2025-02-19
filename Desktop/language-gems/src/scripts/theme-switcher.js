// Theme switcher functionality
class ThemeSwitcher {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.toggleButton = document.getElementById('theme-toggle');
        this.initialize();
    }

    initialize() {
        // Set initial theme
        if (!localStorage.getItem('theme')) {
            this.theme = this.systemPrefersDark ? 'dark' : 'light';
        }
        this.applyTheme();

        // Add event listeners
        this.toggleButton.addEventListener('click', () => this.toggleTheme());
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                this.theme = e.matches ? 'dark' : 'light';
                this.applyTheme();
            }
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        this.updateToggleButton();
        this.updateColors();
    }

    updateToggleButton() {
        const icon = this.toggleButton.querySelector('i');
        if (this.theme === 'dark') {
            icon.className = 'fas fa-sun';
            this.toggleButton.setAttribute('aria-label', 'Switch to light mode');
        } else {
            icon.className = 'fas fa-moon';
            this.toggleButton.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    updateColors() {
        const root = document.documentElement;
        if (this.theme === 'dark') {
            root.style.setProperty('--bg-gradient-1', '#121212');
            root.style.setProperty('--bg-gradient-2', '#1f1f1f');
            root.style.setProperty('--bg-gradient-3', '#2d2d2d');
            root.style.setProperty('--text-dark', '#ffffff');
            root.style.setProperty('--text-light', '#cccccc');
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.05)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.05)');
        } else {
            root.style.setProperty('--bg-gradient-1', '#2c3e50');
            root.style.setProperty('--bg-gradient-2', '#3498db');
            root.style.setProperty('--bg-gradient-3', '#2980b9');
            root.style.setProperty('--text-dark', '#333333');
            root.style.setProperty('--text-light', '#666666');
            root.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
        }
    }
}

// Initialize theme switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeSwitcher();
}); 