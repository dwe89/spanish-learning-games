// Add versioned stylesheet to prevent FOUC
function addVersionedStylesheet() {
    const existingLinks = document.querySelectorAll('link[rel="stylesheet"]');
    existingLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.includes('?')) {
            link.setAttribute('href', `${href}?v=${Date.now()}`);
        }
    });
}

// Debug helper
function debugAuth() {
    console.group('Auth State');
    console.log('Token:', localStorage.getItem('token'));
    console.log('Role:', localStorage.getItem('userRole'));
    console.log('Username:', localStorage.getItem('userName'));
    console.log('Is Authenticated:', localStorage.getItem('isAuthenticated'));
    console.groupEnd();
}

// Configuration and state management
const Config = {
    scripts: {
        authModal: '/src/components/Auth/auth-modal.js',
        apiService: '/src/services/api-service.js'
    },
    menuPath: '/menu.html'
};

let menuLoaded = false;
let isInitializing = false;

// Cache DOM elements
let cachedElements = {
    authButtons: null,
    userProfile: null
};

// Initialize auth state tracking
let isAuthInitialized = false;
let pendingScriptLoads = 0;

// Track initialization state
window.menuInitialized = false;

async function validateAuthState() {
    // Skip validation if we're still loading scripts
    if (pendingScriptLoads > 0) {
        console.log('Skipping auth validation during script loading');
        return true;
    }

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const username = localStorage.getItem('userName');
    const isAuth = localStorage.getItem('isAuthenticated') === 'true';

    // Debug current state
    console.group('Auth State Validation');
    console.log('Token:', token ? 'present' : 'null');
    console.log('Role:', role);
    console.log('Username:', username);
    console.log('Is Authenticated:', isAuth);
    console.groupEnd();

    // Only clear auth if we're fully initialized and missing critical data
    if (isAuthInitialized && (!token || !role || !username || !isAuth)) {
        console.log('Clearing invalid auth state');
        clearAuthState();
        return false;
    }

    return true;
}

async function loadScript(src, isModule = false) {
    pendingScriptLoads++;
    console.log(`Loading script: ${src}${isModule ? ' (ES module)' : ''}`);

    try {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        if (isModule) {
            script.type = 'module'; // Add module type for ES modules
        }

        const loadPromise = new Promise((resolve, reject) => {
            script.onload = () => {
                console.log(`Script loaded: ${src}`);
                resolve();
            };
            script.onerror = () => reject(new Error(`Script load error: ${src}`));
        });

        document.body.appendChild(script);
        await loadPromise;
    } catch (error) {
        console.error('Script loading error:', error);
        throw error;
    } finally {
        pendingScriptLoads--;
        if (pendingScriptLoads === 0) {
            console.log('All scripts loaded, initializing auth state');
            isAuthInitialized = true;
            await validateAuthState();
        }
    }
}

function clearAuthState() {
    // Only clear if we're fully initialized
    if (!isAuthInitialized) {
        console.log('Skipping auth clear - not fully initialized');
        return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('isAuthenticated');
    
    updateMenuUI();
}

function updateMenuUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (!authButtons || !userProfile) {
        console.log('Menu elements not found, skipping UI update');
        return;
    }

    const token = localStorage.getItem('token');
    const username = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    console.log('Updating menu UI:', { hasToken: !!token, username, role, isAuthenticated });

    if (isAuthenticated && username) {
        // Update auth buttons visibility
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Update username displays
        const usernameElements = userProfile.querySelectorAll('.username');
        usernameElements.forEach(el => el.textContent = username);
        
        // Update role display with proper capitalization
        const roleElement = userProfile.querySelector('.role');
        if (roleElement && role) {
            const displayRole = role.charAt(0).toUpperCase() + role.slice(1);
            roleElement.textContent = displayRole;
        }

        // Update dropdown menu links based on user role
        const dashboardLink = userProfile.querySelector('.dropdown-menu a[href*="dashboard"]');
        const progressLink = userProfile.querySelector('.dropdown-menu a[href*="progress"]');
        const settingsLink = userProfile.querySelector('.dropdown-menu a[href*="settings"]');

        if (dashboardLink && progressLink && settingsLink) {
            const basePath = role === 'student' ? '/student-dashboard' : '/teacher-dashboard';
            dashboardLink.href = `${basePath}/index.html`;
            progressLink.href = `${basePath}/progress.html`;
            settingsLink.href = `${basePath}/settings.html`;
        }
        
        // Update active state of navigation links
        updateActiveNavLink();
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
}

// Function to update active state of navigation links
function updateActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href || 
            (currentPath === '/student-dashboard/' && href === '/student-dashboard/index.html') ||
            (currentPath === '/student-dashboard' && href === '/student-dashboard/index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Function to initialize auth modal
async function initializeAuthModal() {
    if (window.authModal) {
        console.log('Auth modal already exists');
        return window.authModal;
    }

    try {
        // Dynamically import the AuthModal module
        const { default: AuthModal } = await import(Config.scripts.authModal);
        
        // Create an instance of AuthModal
        window.authModal = new AuthModal();
        return window.authModal;
    } catch (error) {
        console.error('Error initializing auth modal:', error);
        return null;
    }
}

// Function to open auth modal - only called when login button is clicked
async function openAuthModal() {
    try {
        console.log('Opening auth modal...'); // Debug log
        
        const modal = await initializeAuthModal();
        if (modal) {
            modal.open('login');
        } else {
            console.error('Auth modal not initialized');
        }
    } catch (error) {
        console.error('Error opening auth modal:', error);
    }
}

// Make sure openAuthModal is available globally
window.openAuthModal = openAuthModal;

// Simple auth state management
function getAuthState() {
    return {
        token: localStorage.getItem('token'),
        userRole: localStorage.getItem('userRole'),
        userName: localStorage.getItem('userName'),
        isAuthenticated: localStorage.getItem('isAuthenticated') === 'true'
    };
}

// Load and insert menu HTML
async function loadMenu() {
    if (menuLoaded) {
        console.log('Menu already loaded, skipping...');
        return;
    }

    try {
        const menuContainer = document.getElementById('menu-container');
        if (!menuContainer) {
            console.error('Menu container not found');
            return;
        }
        
        const response = await fetch(Config.menuPath);
        if (!response.ok) throw new Error('Failed to load menu');
        
        const menuHtml = await response.text();
        menuContainer.innerHTML = menuHtml;
        menuLoaded = true;

        // Update menu UI after loading
        updateMenuUI();
        
        // Set active link based on current page
        setActiveLink();
        
        console.log('Menu loaded successfully');
    } catch (error) {
        console.error('Error loading menu:', error);
    }
}

// Set active link in the menu
function setActiveLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.endsWith(href)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/index.html';
}

// Initialize the system
async function initialize() {
    if (isInitializing) {
        console.log('Already initializing, skipping...');
        return;
    }

    isInitializing = true;
    console.log('Initializing...');

    try {
        // First load the menu
        await loadMenu();
        
        // Update menu UI based on current auth state
        updateMenuUI();
        
        // Make the body visible
        document.body.style.visibility = 'visible';
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization failed:', error);
        document.body.style.visibility = 'visible';
    } finally {
        isInitializing = false;
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Make functions globally available
window.logout = logout;
window.updateMenuUI = updateMenuUI;
window.loadMenu = loadMenu;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardMenu();
    setActiveLink();
});

function loadDashboardMenu() {
    const sidebar = document.querySelector('.dashboard-nav');
    if (!sidebar) return;

    const role = localStorage.getItem('userRole');
    const basePath = role === 'student' ? '/student-dashboard' : '/teacher-dashboard';

    sidebar.innerHTML = `
        <div class="nav-section">
            <h3>Learning</h3>
            <a href="${basePath}/index.html" class="nav-item active">
                <i class="fas fa-home"></i>
                <span>Overview</span>
            </a>
            <a href="${basePath}/progress.html" class="nav-item">
                <i class="fas fa-chart-line"></i>
                <span>Progress</span>
            </a>
            <a href="${basePath}/achievements.html" class="nav-item">
                <i class="fas fa-trophy"></i>
                <span>Achievements</span>
            </a>
        </div>

        <div class="nav-section">
            <h3>Study</h3>
            <a href="${basePath}/lessons.html" class="nav-item">
                <i class="fas fa-book"></i>
                <span>Lessons</span>
            </a>
            <a href="${basePath}/assignments.html" class="nav-item">
                <i class="fas fa-tasks"></i>
                <span>Assignments</span>
            </a>
            <a href="${basePath}/vocabulary.html" class="nav-item">
                <i class="fas fa-book"></i>
                <span>Vocabulary</span>
            </a>
        </div>

        <div class="nav-section">
            <h3>Resources</h3>
            <a href="${basePath}/resources.html" class="nav-item">
                <i class="fas fa-folder"></i>
                <span>Resources</span>
            </a>
            <a href="${basePath}/help.html" class="nav-item">
                <i class="fas fa-question-circle"></i>
                <span>Help & Support</span>
            </a>
        </div>
    `;

    // Add click event listeners
    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            updateActiveLink(item);
        });
    });

    // Set initial active link
    const currentPath = window.location.pathname;
    const activeLink = sidebar.querySelector(`a[href="${currentPath}"]`);
    if (activeLink) {
        updateActiveLink(activeLink);
    }
}

function updateActiveLink(activeItem) {
    // Remove active class from all links
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Add active class to clicked link
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.style.display = 'none');
    
    // Show the requested section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
}

// Handle browser back/forward buttons
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1) || 'overview';
    showSection(hash);
    updateActiveLink(document.querySelector(`a[href="#${hash}"]`));
});

// Handle responsive menu toggle
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');
    
    if (menuToggle && dashboardSidebar) {
        menuToggle.addEventListener('click', () => {
            dashboardSidebar.classList.toggle('collapsed');
        });
    }
});