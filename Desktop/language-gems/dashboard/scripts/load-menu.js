
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

// Function to update active state of navigation links
function setActiveMenuLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link, .nav-item');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const isActive = currentPath.endsWith(href) || 
                           (currentPath === '/student-dashboard/' && href === '/student-dashboard/index.html') ||
                           (currentPath === '/student-dashboard' && href === '/student-dashboard/index.html') ||
                           (href.startsWith('#') && window.location.hash === href);
            
            if (isActive) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });
}

// Make functions globally available
window.setActiveMenuLink = setActiveMenuLink;

// Configuration and state management
const Config = {
    scripts: {
        authModal: '/src/components/Auth/auth-modal.js'
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
    if (pendingScriptLoads > 0) {
        console.log('Skipping auth validation during script loading');
        return true;
    }

    console.group('Auth State Validation');
    console.log('User:', auth.currentUser ? 'present' : 'null');
    console.groupEnd();

    return !!auth.currentUser;
}

async function loadScript(src, isModule = false) {
    pendingScriptLoads++;
    console.log(`Loading script: ${src}${isModule ? ' (ES module)' : ''}`);
    
    try {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        if (isModule) {
            script.type = 'module';
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

    signOut(auth).then(() => {
    updateMenuUI();
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// Update other functions to use setActiveMenuLink
function updateMenuUI() {
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    if (!authButtons || !userProfile) {
        console.log('Menu elements not found, skipping UI update');
        return;
    }

    const user = auth.currentUser;
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

    console.log('Updating menu UI:', { hasToken: !!token, username, role, isAuthenticated });

    if (user && isAuthenticated) {
        // Update auth buttons visibility
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        
        // Update username displays
        const usernameElements = userProfile.querySelectorAll('.username');
        usernameElements.forEach(el => el.textContent = username || user.email.split('@')[0]);
        
        // Update role display
        const roleElement = userProfile.querySelector('.role');
        if (roleElement) {
            roleElement.textContent = role.charAt(0).toUpperCase() + role.slice(1);
        }

        // Update profile dropdown content
        const dropdownContent = userProfile.querySelector('.dropdown-content');
        if (dropdownContent) {
            dropdownContent.innerHTML = `
                <div class="user-info">
                    <span class="username">${username || user.email.split('@')[0]}</span>
                    <span class="role">${role.charAt(0).toUpperCase() + role.slice(1)}</span>
                </div>
                <a href="${role === 'teacher' ? '/teacher-dashboard/' : '/student-dashboard/'}" class="dropdown-item">
                    <i class="fas fa-tachometer-alt"></i>
                    Dashboard
                </a>
                <a href="/progress" class="dropdown-item">
                    <i class="fas fa-chart-line"></i>
                    My Progress
                </a>
                <a href="/settings" class="dropdown-item">
                    <i class="fas fa-cog"></i>
                    Settings
                </a>
                <a href="#" class="dropdown-item" onclick="logout(); return false;">
                    <i class="fas fa-sign-out-alt"></i>
                    Sign Out
                </a>
            `;
        }
        
        // Update active state of navigation links
        setActiveMenuLink();
    } else {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
    }
}

// Function to initialize auth modal
async function initializeAuthModal() {
    if (window.authModal) {
        console.log('Auth modal already exists');
        return window.authModal;
    }

    try {
        console.log('Loading auth modal module...');
        const AuthModalModule = await import(Config.scripts.authModal);
        console.log('Auth modal module loaded:', AuthModalModule);
        
        if (!AuthModalModule.default) {
            throw new Error('Auth modal module does not export a default class');
        }

        console.log('Creating new auth modal...');
        window.authModal = new AuthModalModule.default();
        
        if (!window.authModal) {
            throw new Error('Failed to create auth modal instance');
        }
        
        return window.authModal;
    } catch (error) {
        console.error('Error initializing auth modal:', error);
        // Show error to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = 'Failed to initialize authentication. Please try refreshing the page.';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
        return null;
    }
}

// Function to open auth modal - only called when login button is clicked
async function openAuthModal() {
    try {
        console.log('Opening auth modal...');
        
        const modal = await initializeAuthModal();
        if (modal) {
            modal.open('login');
        } else {
            console.error('Auth modal not initialized');
            // Show error to user
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Unable to open login form. Please try again later.';
            document.body.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }
    } catch (error) {
        console.error('Error opening auth modal:', error);
    }
}

// Make sure openAuthModal is available globally
window.openAuthModal = openAuthModal;

// Logout function
async function logout() {
    try {
        await signOut(auth);
        // Clear all auth-related data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isAuthenticated');
        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
    }
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
        setActiveMenuLink();
        
        console.log('Menu loaded successfully');
    } catch (error) {
        console.error('Error loading menu:', error);
    }
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
        
        // Load dashboard menu if we're on a dashboard page
        if (window.location.pathname.includes('dashboard')) {
            loadDashboardMenu();
            setActiveMenuLink();
        }
        
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

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    if (user) {
        console.log('User:', {
            email: user.email,
            displayName: user.displayName,
            uid: user.uid
        });
    }
    updateMenuUI();
});

function loadDashboardMenu() {
    const sidebar = document.querySelector('.dashboard-nav');
    if (!sidebar) return;

    sidebar.innerHTML = `
        <div class="nav-section">
            <h3>Learning</h3>
            <a href="#overview" class="nav-item active">
                <i class="fas fa-home"></i>
                <span>Overview</span>
            </a>
            <a href="#progress" class="nav-item">
                <i class="fas fa-chart-line"></i>
                <span>Progress</span>
            </a>
            <a href="#achievements" class="nav-item">
                <i class="fas fa-trophy"></i>
                <span>Achievements</span>
            </a>
        </div>

        <div class="nav-section">
            <h3>Study</h3>
            <a href="#lessons" class="nav-item">
                <i class="fas fa-book"></i>
                <span>Lessons</span>
            </a>
            <a href="#assignments" class="nav-item">
                <i class="fas fa-tasks"></i>
                <span>Assignments</span>
            </a>
            <a href="#games" class="nav-item">
                <i class="fas fa-gamepad"></i>
                <span>Games</span>
            </a>
            <a href="#flashcards" class="nav-item">
                <i class="fas fa-layer-group"></i>
                <span>Flashcards</span>
            </a>
            <a href="#vocabulary" class="nav-item">
                <i class="fas fa-book"></i>
                <span>Vocabulary</span>
            </a>
        </div>

        <div class="nav-section">
            <h3>Social</h3>
            <a href="#leaderboard" class="nav-item">
                <i class="fas fa-crown"></i>
                <span>Leaderboard</span>
            </a>
        </div>

        <div class="nav-section">
            <h3>Organization</h3>
            <a href="#notes" class="nav-item">
                <i class="fas fa-sticky-note"></i>
                <span>Notes</span>
            </a>
            <a href="#resources" class="nav-item">
                <i class="fas fa-folder"></i>
                <span>Resources</span>
            </a>
            <a href="#help" class="nav-item">
                <i class="fas fa-question-circle"></i>
                <span>Help & Support</span>
            </a>
        </div>
    `;

    // Add click event listeners to handle navigation
    const navItems = sidebar.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('href').substring(1);
            showSection(sectionId);
            setActiveMenuLink(item);
        });
    });

    // Handle initial section based on hash
    const hash = window.location.hash.substring(1) || 'overview';
    showSection(hash);
    setActiveMenuLink(sidebar.querySelector(`a[href="#${hash}"]`));
}

function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.classList.remove('active'));

    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        // Initialize charts if showing progress section
        if (sectionId === 'progress') {
            initializeCharts();
        }
    }
}

// Handle browser back/forward buttons
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1) || 'overview';
    showSection(hash);
    setActiveMenuLink(document.querySelector(`a[href="#${hash}"]`));
});

// Function to toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
        themeBtn.setAttribute('title', `Switch to ${newTheme === 'dark' ? 'light' : 'dark'} mode`);
    }
}

// Make theme toggle available globally
window.toggleTheme = toggleTheme;

// Function to initialize theme
function initializeTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    // Set initial theme
    const theme = storedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    
    // Add theme toggle button to menu
    const menuContainer = document.querySelector('#menu-container');
    if (menuContainer) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle';
        themeBtn.innerHTML = `<i class="fas fa-${theme === 'dark' ? 'sun' : 'moon'}"></i>`;
        themeBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        themeBtn.onclick = toggleTheme;
        
        // Add button to menu
        const menuActions = menuContainer.querySelector('.menu-actions');
        if (menuActions) {
            menuActions.appendChild(themeBtn);
        } else {
            const actions = document.createElement('div');
            actions.className = 'menu-actions';
            actions.appendChild(themeBtn);
            menuContainer.appendChild(actions);
        }
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            const themeBtn = document.querySelector('.theme-toggle');
            if (themeBtn) {
                themeBtn.innerHTML = `<i class="fas fa-${e.matches ? 'sun' : 'moon'}"></i>`;
                themeBtn.setAttribute('title', `Switch to ${e.matches ? 'light' : 'dark'} mode`);
            }
        }
    });
}

// Initialize theme when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    initializeTheme();
}