// Search functionality for Spanish Learning Games
class SearchComponent {
    constructor() {
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.activeFilters = new Set();
        this.debounceTimeout = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
                this.performSearch();
            }, 300);
        });

        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.toggleFilter(button);
            });
        });
    }

    toggleFilter(button) {
        const filter = button.dataset.filter;
        if (this.activeFilters.has(filter)) {
            this.activeFilters.delete(filter);
            button.classList.remove('active');
        } else {
            this.activeFilters.add(filter);
            button.classList.add('active');
        }
        this.performSearch();
    }

    async performSearch() {
        const query = this.searchInput.value.trim().toLowerCase();
        if (query.length < 2) {
            this.searchResults.innerHTML = '';
            return;
        }

        try {
            const results = await this.fetchSearchResults(query);
            const filteredResults = this.filterResults(results);
            this.displayResults(filteredResults);
        } catch (error) {
            console.error('Search error:', error);
            this.displayError();
        }
    }

    async fetchSearchResults(query) {
        // This would be replaced with actual API call
        // For now, we'll simulate some results
        return [
            {
                title: 'Spanish Basics',
                type: 'lesson',
                language: 'spanish',
                level: 'beginner',
                url: '/spanish-basics.html'
            },
            {
                title: 'French Colors',
                type: 'lesson',
                language: 'french',
                level: 'beginner',
                url: '/french-colors.html'
            },
            // Add more mock results
        ].filter(item => 
            item.title.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            item.language.toLowerCase().includes(query)
        );
    }

    filterResults(results) {
        if (this.activeFilters.size === 0) return results;

        return results.filter(result => {
            return Array.from(this.activeFilters).some(filter => {
                switch (filter) {
                    case 'spanish':
                    case 'french':
                        return result.language === filter;
                    case 'beginner':
                    case 'intermediate':
                    case 'advanced':
                        return result.level === filter;
                    case 'lesson':
                    case 'game':
                    case 'quiz':
                        return result.type === filter;
                    default:
                        return true;
                }
            });
        });
    }

    displayResults(results) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="no-results">
                    <p>No results found. Try different keywords or filters.</p>
                </div>
            `;
            return;
        }

        this.searchResults.innerHTML = results.map(result => `
            <div class="search-result-item">
                <a href="${result.url}">
                    <h3>${result.title}</h3>
                    <div class="result-meta">
                        <span class="result-type">${result.type}</span>
                        <span class="result-language">${result.language}</span>
                        <span class="result-level">${result.level}</span>
                    </div>
                </a>
            </div>
        `).join('');
    }

    displayError() {
        this.searchResults.innerHTML = `
            <div class="search-error">
                <p>An error occurred while searching. Please try again later.</p>
            </div>
        `;
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchComponent();
}); 