document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeLibrary();
});

async function initializeLibrary() {
    try {
        await Promise.all([
            loadCollections(),
            loadResources()
        ]);
        
        setupEventListeners();
        setupDragAndDrop();
        showSuccess('Library loaded successfully');
    } catch (error) {
        console.error('Error initializing library:', error);
        showError('Failed to load library');
    }
}

async function loadCollections() {
    try {
        const collections = await window.teacherApiService.getCollections();
        renderCollectionsGrid(collections);
        updateCollectionsSelect(collections);
    } catch (error) {
        console.error('Error loading collections:', error);
        showError('Failed to load collections');
    }
}

function renderCollectionsGrid(collections) {
    const collectionsGrid = document.querySelector('.collections-grid');
    
    if (collections.length === 0) {
        collectionsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Collections</h3>
                <p>Create a collection to organize your resources</p>
            </div>
        `;
        return;
    }
    
    collectionsGrid.innerHTML = collections.map(collection => `
        <div class="collection-card" onclick="viewCollection('${collection.id}')">
            <div class="collection-icon">
                <i class="fas fa-folder"></i>
                <span class="resource-count">${collection.resourceCount}</span>
            </div>
            <div class="collection-content">
                <h3>${collection.name}</h3>
                <p>${collection.description || 'No description'}</p>
            </div>
        </div>
    `).join('');
}

function updateCollectionsSelect(collections) {
    const collectionsSelect = document.querySelector('.collections-select');
    
    collectionsSelect.innerHTML = collections.map(collection => `
        <label class="checkbox-label">
            <input type="checkbox" name="collections" value="${collection.id}">
            ${collection.name}
        </label>
    `).join('');
}

async function loadResources() {
    try {
        const category = document.getElementById('category-filter').value;
        const source = document.getElementById('source-filter').value;
        
        const resources = await window.teacherApiService.getLibraryResources(category, source);
        renderResourcesGrid(resources);
    } catch (error) {
        console.error('Error loading resources:', error);
        showError('Failed to load resources');
    }
}

function renderResourcesGrid(resources) {
    const resourcesGrid = document.querySelector('.resources-grid');
    
    if (resources.length === 0) {
        resourcesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-books"></i>
                <h3>No Resources Found</h3>
                <p>Upload or purchase resources to get started</p>
            </div>
        `;
        return;
    }
    
    resourcesGrid.innerHTML = resources.map(resource => `
        <div class="resource-card" onclick="viewResourceDetails('${resource.id}')">
            <div class="resource-thumbnail">
                ${getResourceThumbnail(resource)}
            </div>
            <div class="resource-content">
                <h3>${resource.title}</h3>
                <div class="resource-meta">
                    <span class="category">${resource.category}</span>
                    <span class="source ${resource.source.toLowerCase()}">${resource.source}</span>
                </div>
                <p class="resource-description">${resource.description}</p>
                <div class="resource-footer">
                    <span class="date-added">Added ${formatDate(resource.dateAdded)}</span>
                    <div class="resource-actions">
                        <button onclick="event.stopPropagation(); downloadResource('${resource.id}')" class="action-button">
                            <i class="fas fa-download"></i>
                        </button>
                        <button onclick="event.stopPropagation(); shareResource('${resource.id}')" class="action-button">
                            <i class="fas fa-share"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function getResourceThumbnail(resource) {
    const fileType = resource.fileType || 'unknown';
    const iconMap = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'xls': 'fa-file-excel',
        'xlsx': 'fa-file-excel',
        'zip': 'fa-file-archive',
        'unknown': 'fa-file'
    };
    
    if (resource.thumbnail) {
        return `<img src="${resource.thumbnail}" alt="${resource.title}">`;
    }
    
    return `
        <div class="file-icon">
            <i class="fas ${iconMap[fileType] || iconMap.unknown}"></i>
            <span class="file-type">${fileType.toUpperCase()}</span>
        </div>
    `;
}

// Upload Resource
function uploadResource() {
    const modal = document.getElementById('upload-modal');
    document.getElementById('upload-form').reset();
    document.querySelector('.uploaded-files').innerHTML = '';
    modal.style.display = 'block';
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    modal.style.display = 'none';
}

function setupDragAndDrop() {
    const uploadArea = document.getElementById('file-upload-area');
    const fileInput = document.getElementById('resource-files');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
}

function handleFiles(files) {
    const uploadedFiles = document.querySelector('.uploaded-files');
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip'
    ];
    
    Array.from(files).forEach(file => {
        if (!allowedTypes.includes(file.type)) {
            showError(`Invalid file type: ${file.name}`);
            return;
        }
        
        const fileElement = document.createElement('div');
        fileElement.className = 'uploaded-file';
        fileElement.innerHTML = `
            <i class="fas ${getFileIcon(file.type)}"></i>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
            <button type="button" class="remove-file" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        uploadedFiles.appendChild(fileElement);
    });
}

function getFileIcon(fileType) {
    const iconMap = {
        'application/pdf': 'fa-file-pdf',
        'application/msword': 'fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
        'application/vnd.ms-powerpoint': 'fa-file-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fa-file-powerpoint',
        'application/zip': 'fa-file-archive'
    };
    return iconMap[fileType] || 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function submitUpload(event) {
    event.preventDefault();
    
    const form = event.target;
    const fileElements = form.querySelector('.uploaded-files').children;
    if (fileElements.length === 0) {
        showError('Please upload at least one file');
        return;
    }
    
    const formData = new FormData();
    formData.append('title', form['resource-title'].value);
    formData.append('category', form['resource-category'].value);
    formData.append('description', form['resource-description'].value);
    
    // Add selected collections
    const selectedCollections = Array.from(form.collections)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    formData.append('collections', JSON.stringify(selectedCollections));
    
    // Add files
    Array.from(fileElements).forEach(element => {
        const fileName = element.querySelector('.file-name').textContent;
        const file = Array.from(document.getElementById('resource-files').files)
            .find(f => f.name === fileName);
        if (file) {
            formData.append('files', file);
        }
    });
    
    try {
        await window.teacherApiService.uploadResource(formData);
        showSuccess('Resource uploaded successfully');
        closeUploadModal();
        loadResources();
    } catch (error) {
        console.error('Error uploading resource:', error);
        showError('Failed to upload resource');
    }
}

// Collection Management
function createCollection() {
    const modal = document.getElementById('collection-modal');
    document.getElementById('collection-form').reset();
    modal.style.display = 'block';
}

function closeCollectionModal() {
    const modal = document.getElementById('collection-modal');
    modal.style.display = 'none';
}

async function submitCollection(event) {
    event.preventDefault();
    
    const form = event.target;
    const collectionData = {
        name: form['collection-name'].value,
        description: form['collection-description'].value
    };
    
    try {
        await window.teacherApiService.createCollection(collectionData);
        showSuccess('Collection created successfully');
        closeCollectionModal();
        await loadCollections();
    } catch (error) {
        console.error('Error creating collection:', error);
        showError('Failed to create collection');
    }
}

// Resource Details
async function viewResourceDetails(resourceId) {
    try {
        const resource = await window.teacherApiService.getResourceDetails(resourceId);
        const modal = document.getElementById('resource-details-modal');
        
        // Update resource info
        modal.querySelector('.resource-title').textContent = resource.title;
        modal.querySelector('.category').textContent = resource.category;
        modal.querySelector('.source').textContent = resource.source;
        modal.querySelector('.date-added').textContent = `Added ${formatDate(resource.dateAdded)}`;
        
        // Update description
        modal.querySelector('.resource-description').textContent = resource.description;
        
        // Update files list
        modal.querySelector('.resource-files').innerHTML = resource.files.map(file => `
            <div class="file-item">
                <i class="fas ${getFileIcon(file.type)}"></i>
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <button onclick="downloadFile('${file.id}')" class="action-button">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `).join('');
        
        // Update collections list
        modal.querySelector('.resource-collections').innerHTML = resource.collections.map(collection => `
            <div class="collection-tag">
                <i class="fas fa-folder"></i>
                ${collection.name}
            </div>
        `).join('');
        
        modal.style.display = 'block';
        modal.dataset.resourceId = resourceId;
    } catch (error) {
        console.error('Error loading resource details:', error);
        showError('Failed to load resource details');
    }
}

function closeResourceDetails() {
    const modal = document.getElementById('resource-details-modal');
    modal.style.display = 'none';
    delete modal.dataset.resourceId;
}

async function downloadResource(resourceId = null) {
    if (!resourceId) {
        resourceId = document.getElementById('resource-details-modal').dataset.resourceId;
    }
    
    try {
        const downloadUrl = await window.teacherApiService.getResourceDownloadUrl(resourceId);
        window.location.href = downloadUrl;
    } catch (error) {
        console.error('Error downloading resource:', error);
        showError('Failed to download resource');
    }
}

async function shareResource(resourceId = null) {
    if (!resourceId) {
        resourceId = document.getElementById('resource-details-modal').dataset.resourceId;
    }
    
    try {
        const shareUrl = await window.teacherApiService.getResourceShareUrl(resourceId);
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        showSuccess('Share link copied to clipboard');
    } catch (error) {
        console.error('Error sharing resource:', error);
        showError('Failed to share resource');
    }
}

async function deleteResource() {
    const resourceId = document.getElementById('resource-details-modal').dataset.resourceId;
    
    if (!confirm('Are you sure you want to delete this resource?')) {
        return;
    }
    
    try {
        await window.teacherApiService.deleteResource(resourceId);
        showSuccess('Resource deleted successfully');
        closeResourceDetails();
        loadResources();
    } catch (error) {
        console.error('Error deleting resource:', error);
        showError('Failed to delete resource');
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function setupEventListeners() {
    // Category filter change
    document.getElementById('category-filter').addEventListener('change', loadResources);
    
    // Source filter change
    document.getElementById('source-filter').addEventListener('change', loadResources);
    
    // Library search
    let searchTimeout;
    document.getElementById('library-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const resourceCards = document.querySelectorAll('.resource-card');
            
            resourceCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('.resource-description').textContent.toLowerCase();
                const meta = card.querySelector('.resource-meta').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm) || meta.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }, 300);
    });
}

function showSuccess(message) {
    // Implementation depends on your toast/notification system
    console.log('Success:', message);
}

function showError(message) {
    // Implementation depends on your toast/notification system
    console.error('Error:', message);
} 