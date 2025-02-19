document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeMarketplace();
});

async function initializeMarketplace() {
    try {
        await Promise.all([
            loadFeaturedResources(),
            loadResources()
        ]);
        
        setupEventListeners();
        loadCart();
        showSuccess('Marketplace loaded successfully');
    } catch (error) {
        console.error('Error initializing marketplace:', error);
        showError('Failed to load marketplace');
    }
}

async function loadFeaturedResources() {
    try {
        const featured = await window.teacherApiService.getFeaturedResources();
        const featuredGrid = document.querySelector('.featured-grid');
        
        featuredGrid.innerHTML = featured.map(resource => `
            <div class="featured-card" onclick="viewResourceDetails('${resource.id}')">
                <div class="featured-image">
                    <img src="${resource.thumbnail}" alt="${resource.title}">
                    ${resource.price === 0 ? '<span class="free-badge">Free</span>' : ''}
                </div>
                <div class="featured-content">
                    <h3>${resource.title}</h3>
                    <p>${resource.description}</p>
                    <div class="featured-meta">
                        <span class="category">${resource.category}</span>
                        <span class="rating">
                            <i class="fas fa-star"></i>
                            ${resource.rating.toFixed(1)}
                        </span>
                    </div>
                    <div class="featured-price">
                        ${formatPrice(resource.price)}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured resources:', error);
        showError('Failed to load featured resources');
    }
}

async function loadResources() {
    try {
        const category = document.getElementById('category-filter').value;
        const level = document.getElementById('level-filter').value;
        const price = document.getElementById('price-filter').value;
        
        const resources = await window.teacherApiService.getResources(category, level, price);
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
                <i class="fas fa-search"></i>
                <h3>No Resources Found</h3>
                <p>Try adjusting your filters to find more resources</p>
            </div>
        `;
        return;
    }
    
    resourcesGrid.innerHTML = resources.map(resource => `
        <div class="resource-card" onclick="viewResourceDetails('${resource.id}')">
            <div class="resource-thumbnail">
                <img src="${resource.thumbnail}" alt="${resource.title}">
                ${resource.price === 0 ? '<span class="free-badge">Free</span>' : ''}
            </div>
            <div class="resource-content">
                <h3>${resource.title}</h3>
                <div class="resource-meta">
                    <span class="category">${resource.category}</span>
                    <span class="level">${resource.level}</span>
                </div>
                <p class="resource-description">${resource.description}</p>
                <div class="resource-footer">
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        ${resource.rating.toFixed(1)} (${resource.reviewCount})
                    </div>
                    <div class="price">
                        ${formatPrice(resource.price)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function viewResourceDetails(resourceId) {
    try {
        const resource = await window.teacherApiService.getResourceDetails(resourceId);
        const modal = document.getElementById('resource-details-modal');
        
        // Update preview image and gallery
        modal.querySelector('.preview-image').src = resource.images[0];
        modal.querySelector('.preview-gallery').innerHTML = resource.images.map(image => `
            <img src="${image}" alt="Preview" onclick="updatePreviewImage(this.src)">
        `).join('');
        
        // Update resource info
        modal.querySelector('.resource-title').textContent = resource.title;
        modal.querySelector('.category').textContent = resource.category;
        modal.querySelector('.level').textContent = resource.level;
        modal.querySelector('.rating').innerHTML = `
            <i class="fas fa-star"></i>
            ${resource.rating.toFixed(1)} (${resource.reviewCount} reviews)
        `;
        
        // Update price section
        modal.querySelector('.price').textContent = formatPrice(resource.price);
        const addToCartButton = modal.querySelector('.add-to-cart');
        addToCartButton.onclick = () => addToCart(resource);
        addToCartButton.disabled = isInCart(resource.id);
        
        // Update description and details
        modal.querySelector('.resource-description').textContent = resource.description;
        modal.querySelector('.included-items').innerHTML = resource.included.map(item => `
            <li><i class="fas fa-check"></i> ${item}</li>
        `).join('');
        
        // Update reviews
        modal.querySelector('.reviews-list').innerHTML = resource.reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <img src="${review.avatar}" alt="${review.name}" class="reviewer-avatar">
                        <div>
                            <h5>${review.name}</h5>
                            <div class="review-rating">
                                ${Array(5).fill().map((_, i) => `
                                    <i class="fas fa-star${i < review.rating ? '' : ' inactive'}"></i>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <span class="review-date">${formatDate(review.date)}</span>
                </div>
                <p class="review-text">${review.comment}</p>
            </div>
        `).join('');
        
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading resource details:', error);
        showError('Failed to load resource details');
    }
}

function closeResourceDetails() {
    const modal = document.getElementById('resource-details-modal');
    modal.style.display = 'none';
}

function updatePreviewImage(src) {
    document.querySelector('.preview-image').src = src;
}

// Cart Management
let cart = [];

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    document.querySelector('.cart-count').textContent = cart.length;
}

function isInCart(resourceId) {
    return cart.some(item => item.id === resourceId);
}

function addToCart(resource) {
    if (!isInCart(resource.id)) {
        cart.push({
            id: resource.id,
            title: resource.title,
            price: resource.price,
            thumbnail: resource.thumbnail
        });
        saveCart();
        showSuccess('Added to cart');
        closeResourceDetails();
    }
}

function removeFromCart(resourceId) {
    cart = cart.filter(item => item.id !== resourceId);
    saveCart();
    renderCart();
}

function openCart() {
    renderCart();
    document.getElementById('cart-modal').style.display = 'block';
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

function renderCart() {
    const cartModal = document.getElementById('cart-modal');
    const cartItems = cartModal.querySelector('.cart-items');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your Cart is Empty</h3>
                <p>Browse the marketplace to find resources</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.thumbnail}" alt="${item.title}" class="item-thumbnail">
                <div class="item-details">
                    <h4>${item.title}</h4>
                    <div class="item-price">${formatPrice(item.price)}</div>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const discount = 0; // Calculate any applicable discounts
    const total = subtotal - discount;
    
    const summary = document.querySelector('.cart-summary');
    summary.querySelector('.subtotal').textContent = formatPrice(subtotal);
    summary.querySelector('.discount').textContent = `-${formatPrice(discount)}`;
    summary.querySelector('.total-amount').textContent = formatPrice(total);
    
    const checkoutButton = summary.querySelector('.checkout-button');
    checkoutButton.disabled = cart.length === 0;
}

async function checkout() {
    try {
        const order = await window.teacherApiService.createOrder(cart);
        window.location.href = order.checkoutUrl;
    } catch (error) {
        console.error('Error creating order:', error);
        showError('Failed to process checkout');
    }
}

function formatPrice(price) {
    if (price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
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
    
    // Level filter change
    document.getElementById('level-filter').addEventListener('change', loadResources);
    
    // Price filter change
    document.getElementById('price-filter').addEventListener('change', loadResources);
    
    // Resource search
    let searchTimeout;
    document.getElementById('resource-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const resourceCards = document.querySelectorAll('.resource-card');
            
            resourceCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('.resource-description').textContent.toLowerCase();
                const category = card.querySelector('.category').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
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