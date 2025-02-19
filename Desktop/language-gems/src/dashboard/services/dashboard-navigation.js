// Handle dynamic content loading for dashboard navigation
export class DashboardNavigation {
    static init() {
        // Get all navigation links in the sidebar
        const navLinks = document.querySelectorAll('.dashboard-nav .nav-item');
        
        // Add click event listeners to each link
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Update active state
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Get the target page URL
                const href = link.getAttribute('href');
                
                // Load the content
                DashboardNavigation.loadContent(href);
            });
        });
    }
    
    static async loadContent(url) {
        try {
            // Show loading state
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) loadingOverlay.classList.add('active');
            
            // Fetch the new page content
            const response = await fetch(url);
            const html = await response.text();
            
            // Create a temporary element to parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Get the main content area from the new page
            const newContent = doc.querySelector('.dashboard-main');
            
            // Update the current page's main content
            const mainContent = document.querySelector('.dashboard-main');
            if (mainContent && newContent) {
                mainContent.innerHTML = newContent.innerHTML;
                
                // Update the page title
                document.title = doc.title;
                
                // Update the URL without refreshing
                history.pushState({}, doc.title, url);
                
                // Load any scripts that were in the new content
                const scripts = newContent.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    Array.from(script.attributes).forEach(attr => {
                        newScript.setAttribute(attr.name, attr.value);
                    });
                    newScript.textContent = script.textContent;
                    document.body.appendChild(newScript);
                });
            }
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            // Hide loading state
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) loadingOverlay.classList.remove('active');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    DashboardNavigation.init();
});