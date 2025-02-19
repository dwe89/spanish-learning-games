class BreadcrumbNavigation {
    constructor() {
        this.container = document.createElement('nav');
        this.container.className = 'breadcrumb-nav';
        this.container.setAttribute('aria-label', 'Breadcrumb');
        
        this.initialize();
    }

    initialize() {
        // Get current path and create breadcrumb items
        const path = window.location.pathname;
        const pathSegments = path.split('/').filter(segment => segment);
        
        // Create list for breadcrumbs
        const list = document.createElement('ol');
        list.className = 'breadcrumb-list';
        
        // Always add home
        list.appendChild(this.createBreadcrumbItem('Home', '/', pathSegments.length === 0));
        
        // Add intermediate paths
        let currentPath = '';
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const isLast = index === pathSegments.length - 1;
            
            // Format the segment name
            const name = this.formatSegmentName(segment);
            list.appendChild(this.createBreadcrumbItem(name, currentPath, isLast));
        });
        
        this.container.appendChild(list);
        
        // Insert breadcrumbs after the menu
        const menuContainer = document.getElementById('menu-container');
        if (menuContainer && menuContainer.nextSibling) {
            menuContainer.parentNode.insertBefore(this.container, menuContainer.nextSibling);
        }
    }

    createBreadcrumbItem(name, path, isLast) {
        const item = document.createElement('li');
        item.className = 'breadcrumb-item';
        
        if (isLast) {
            item.classList.add('active');
            item.setAttribute('aria-current', 'page');
            item.textContent = name;
        } else {
            const link = document.createElement('a');
            link.href = path;
            link.textContent = name;
            item.appendChild(link);
        }
        
        return item;
    }

    formatSegmentName(segment) {
        // Remove file extension
        segment = segment.replace('.html', '');
        
        // Split by hyphens and capitalize each word
        return segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

// Initialize breadcrumbs when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BreadcrumbNavigation();
}); 