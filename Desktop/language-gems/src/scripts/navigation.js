class Navigation {
    static init() {
        // Intercept all link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href.startsWith(window.location.origin)) {
                e.preventDefault();
                this.navigateTo(link.href);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.loadPage(window.location.href, false);
        });
    }

    static navigateTo(url) {
        this.loadPage(url, true);
    }

    static async loadPage(url, addToHistory = true) {
        const loadingOverlay = this.showLoadingOverlay();

        try {
            const response = await fetch(url);
            const html = await response.text();
            
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');
            
            // Update title and content
            document.title = newDoc.title;
            
            // Replace body content while preserving scripts
            const oldScripts = Array.from(document.scripts);
            document.body.innerHTML = newDoc.body.innerHTML;
            
            // Re-add any removed scripts
            oldScripts.forEach(script => {
                if (!document.querySelector(`script[src="${script.src}"]`)) {
                    const newScript = document.createElement('script');
                    newScript.src = script.src;
                    document.body.appendChild(newScript);
                }
            });

            // Update URL
            if (addToHistory) {
                window.history.pushState({}, '', url);
            }

            // Reinitialize CSS
            addVersionedStylesheet();

        } catch (error) {
            console.error('Navigation error:', error);
            window.location.href = url; // Fallback to normal navigation
        } finally {
            this.hideLoadingOverlay(loadingOverlay);
        }
    }

    static showLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(overlay);
        return overlay;
    }

    static hideLoadingOverlay(overlay) {
        overlay.remove();
    }
}

// Initialize navigation
Navigation.init(); 