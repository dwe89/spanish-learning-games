class ResourcesManager {
    constructor() {
        this.resources = [];
        this.searchQuery = '';
        this.favorites = new Set();
        
        this.initializeEventListeners();
        this.loadResources();
    }

    async initializeEventListeners() {
        // Add resource buttons
        document.querySelectorAll('[data-resource-type]').forEach(btn => {
            btn.addEventListener('click', () => {
                const resourceType = btn.dataset.resourceType;
                this.showResourceModal(null, resourceType);
            });
        });

        // Modal close buttons
        document.getElementById('closeResourceModal').addEventListener('click', () => this.hideResourceModal());
        document.getElementById('cancelResourceBtn').addEventListener('click', () => this.hideResourceModal());
        document.getElementById('closeDetailsModal').addEventListener('click', () => this.hideDetailsModal());

        // Save resource button
        document.getElementById('saveResourceBtn').addEventListener('click', () => this.saveResource());

        // Search input
        const searchInput = document.querySelector('.search-box input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderResources();
        });

        // Resource tags input
        const tagsInput = document.getElementById('resourceTags');
        tagsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const tag = tagsInput.value.trim();
                if (tag) {
                    this.addTagToPreview(tag);
                    tagsInput.value = '';
                }
            }
        });

        // Resource details modal buttons
        document.getElementById('editResourceBtn').addEventListener('click', () => this.editResource());
        document.getElementById('deleteResourceBtn').addEventListener('click', () => this.deleteResource());
        document.getElementById('shareResourceBtn').addEventListener('click', () => this.shareResource());
        document.getElementById('favoriteResourceBtn').addEventListener('click', () => this.toggleFavorite());
    }

    async loadResources() {
        try {
            // In a real application, this would be an API call
            const response = await this.fetchResources();
            this.resources = response;
            this.renderResources();
        } catch (error) {
            console.error('Error loading resources:', error);
        }
    }

    async fetchResources() {
        // This is a mock response. In a real application, this would be an API call
        return [
            {
                id: 1,
                type: 'textbook',
                title: 'Spanish Grammar in Context',
                author: 'Juan Martinez',
                url: 'https://example.com/spanish-grammar',
                level: 'intermediate',
                description: 'A comprehensive guide to Spanish grammar with practical examples and exercises.',
                tags: ['grammar', 'exercises', 'intermediate'],
                favorite: true
            },
            {
                id: 2,
                type: 'course',
                title: 'Conversational Spanish',
                author: 'Maria Rodriguez',
                url: 'https://example.com/conversational-spanish',
                level: 'beginner',
                description: 'Learn everyday Spanish conversation through interactive lessons.',
                tags: ['conversation', 'beginner', 'interactive'],
                favorite: false
            }
        ];
    }

    renderResources() {
        // Filter resources by search query
        const filteredResources = this.resources.filter(resource =>
            resource.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            resource.tags.some(tag => tag.toLowerCase().includes(this.searchQuery.toLowerCase()))
        );

        // Group resources by type
        const groupedResources = {
            textbook: filteredResources.filter(r => r.type === 'textbook'),
            course: filteredResources.filter(r => r.type === 'course'),
            video: filteredResources.filter(r => r.type === 'video'),
            podcast: filteredResources.filter(r => r.type === 'podcast'),
            website: filteredResources.filter(r => r.type === 'website'),
            app: filteredResources.filter(r => r.type === 'app')
        };

        // Render each section
        Object.entries(groupedResources).forEach(([type, resources]) => {
            const container = document.getElementById(`${type}sContainer`);
            container.innerHTML = resources.map(resource => this.createResourceCard(resource)).join('');
        });

        // Add click events to cards
        document.querySelectorAll('.resource-card').forEach(card => {
            const resourceId = parseInt(card.dataset.resourceId);
            const resource = this.resources.find(r => r.id === resourceId);

            // Card click
            card.addEventListener('click', () => {
                this.showResourceDetails(resource);
            });

            // Favorite button click
            const favoriteBtn = card.querySelector('.favorite-btn');
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(resource);
            });
        });
    }

    createResourceCard(resource) {
        return `
            <div class="resource-card" data-resource-id="${resource.id}">
                <button class="favorite-btn ${resource.favorite ? 'active' : ''}" title="Favorite">
                    <i class="fa${resource.favorite ? 's' : 'r'} fa-star"></i>
                </button>
                <h3 class="resource-title">${resource.title}</h3>
                <div class="resource-author">${resource.author}</div>
                <span class="resource-level">${resource.level}</span>
                <div class="resource-tags">
                    ${resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <p class="resource-description">${resource.description}</p>
                <div class="resource-link">
                    <a href="${resource.url}" target="_blank" onclick="event.stopPropagation()">
                        <i class="fas fa-external-link-alt"></i> Open Resource
                    </a>
                </div>
            </div>
        `;
    }

    showResourceModal(resource = null, type = null) {
        const modal = document.getElementById('resourceModal');
        const form = document.getElementById('resourceForm');
        const titleEl = modal.querySelector('.modal-header h3');
        
        if (resource) {
            // Edit mode
            titleEl.textContent = 'Edit Resource';
            form.elements.resourceTitle.value = resource.title;
            form.elements.resourceType.value = resource.type;
            form.elements.resourceUrl.value = resource.url;
            form.elements.resourceAuthor.value = resource.author;
            form.elements.resourceLevel.value = resource.level;
            form.elements.resourceDescription.value = resource.description;
            form.elements.resourceFavorite.checked = resource.favorite;
            
            // Add tags
            const tagsPreview = document.querySelector('.tags-preview');
            tagsPreview.innerHTML = '';
            resource.tags.forEach(tag => this.addTagToPreview(tag));
            
            form.dataset.resourceId = resource.id;
        } else {
            // New resource mode
            titleEl.textContent = 'Add Resource';
            form.reset();
            document.querySelector('.tags-preview').innerHTML = '';
            delete form.dataset.resourceId;
            
            if (type) {
                form.elements.resourceType.value = type;
            }
        }

        modal.classList.add('active');
    }

    hideResourceModal() {
        document.getElementById('resourceModal').classList.remove('active');
    }

    showResourceDetails(resource) {
        const modal = document.getElementById('resourceDetailsModal');
        
        document.getElementById('detailsTitle').textContent = resource.title;
        document.getElementById('detailsAuthor').textContent = resource.author;
        document.getElementById('detailsLevel').textContent = resource.level;
        document.getElementById('detailsDescription').textContent = resource.description;
        document.getElementById('detailsUrl').href = resource.url;
        
        const tagsContainer = document.getElementById('detailsTags');
        tagsContainer.innerHTML = resource.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        const favoriteBtn = document.getElementById('favoriteResourceBtn');
        favoriteBtn.innerHTML = `<i class="fa${resource.favorite ? 's' : 'r'} fa-star"></i>`;
        favoriteBtn.classList.toggle('active', resource.favorite);
        
        modal.dataset.resourceId = resource.id;
        modal.classList.add('active');
    }

    hideDetailsModal() {
        document.getElementById('resourceDetailsModal').classList.remove('active');
    }

    async saveResource() {
        const form = document.getElementById('resourceForm');
        const tags = Array.from(document.querySelectorAll('.tags-preview .tag'))
            .map(tag => tag.textContent.trim());

        const resourceData = {
            title: form.elements.resourceTitle.value,
            type: form.elements.resourceType.value,
            url: form.elements.resourceUrl.value,
            author: form.elements.resourceAuthor.value,
            level: form.elements.resourceLevel.value,
            description: form.elements.resourceDescription.value,
            tags,
            favorite: form.elements.resourceFavorite.checked
        };

        if (form.dataset.resourceId) {
            // Edit existing resource
            resourceData.id = parseInt(form.dataset.resourceId);
            const index = this.resources.findIndex(r => r.id === resourceData.id);
            if (index !== -1) {
                this.resources[index] = resourceData;
            }
        } else {
            // Create new resource
            resourceData.id = Date.now();
            this.resources.push(resourceData);
        }

        this.hideResourceModal();
        this.renderResources();
    }

    async deleteResource() {
        const modal = document.getElementById('resourceDetailsModal');
        const resourceId = parseInt(modal.dataset.resourceId);
        
        this.resources = this.resources.filter(resource => resource.id !== resourceId);
        this.hideDetailsModal();
        this.renderResources();
    }

    editResource() {
        const modal = document.getElementById('resourceDetailsModal');
        const resourceId = parseInt(modal.dataset.resourceId);
        const resource = this.resources.find(r => r.id === resourceId);
        
        if (resource) {
            this.hideDetailsModal();
            this.showResourceModal(resource);
        }
    }

    shareResource() {
        const modal = document.getElementById('resourceDetailsModal');
        const resourceId = parseInt(modal.dataset.resourceId);
        const resource = this.resources.find(r => r.id === resourceId);
        
        if (resource) {
            // Implement sharing functionality
            console.log('Sharing resource:', resource);
        }
    }

    toggleFavorite(resource = null) {
        if (!resource) {
            const modal = document.getElementById('resourceDetailsModal');
            const resourceId = parseInt(modal.dataset.resourceId);
            resource = this.resources.find(r => r.id === resourceId);
        }
        
        if (resource) {
            resource.favorite = !resource.favorite;
            this.renderResources();
            
            // Update details modal if open
            const detailsModal = document.getElementById('resourceDetailsModal');
            if (detailsModal.classList.contains('active') && parseInt(detailsModal.dataset.resourceId) === resource.id) {
                const favoriteBtn = document.getElementById('favoriteResourceBtn');
                favoriteBtn.innerHTML = `<i class="fa${resource.favorite ? 's' : 'r'} fa-star"></i>`;
                favoriteBtn.classList.toggle('active', resource.favorite);
            }
        }
    }

    addTagToPreview(tag) {
        const tagsPreview = document.querySelector('.tags-preview');
        const tagEl = document.createElement('span');
        tagEl.className = 'tag';
        tagEl.innerHTML = `
            ${tag}
            <button type="button" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        tagsPreview.appendChild(tagEl);
    }
}

// Initialize resources manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.resourcesManager = new ResourcesManager();
}); 