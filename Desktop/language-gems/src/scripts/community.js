class CommunityManager {
    constructor() {
        this.posts = [];
        this.currentCategory = 'all';
        this.currentSort = 'recent';
        this.initializeEventListeners();
        this.loadCommunityData();
    }

    initializeEventListeners() {
        // Category filter
        const categorySelect = document.getElementById('postCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentCategory = e.target.value;
                this.filterAndRenderPosts();
            });
        }

        // Sort filter
        const sortSelect = document.getElementById('postSort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.filterAndRenderPosts();
            });
        }

        // Create post button
        const createPostBtn = document.getElementById('createPostBtn');
        if (createPostBtn) {
            createPostBtn.addEventListener('click', () => this.showCreatePostModal());
        }

        // Find partners button
        const findPartnersBtn = document.getElementById('findPartnersBtn');
        if (findPartnersBtn) {
            findPartnersBtn.addEventListener('click', () => this.showFindPartnersModal());
        }

        // Create post form
        const createPostForm = document.getElementById('createPostForm');
        if (createPostForm) {
            createPostForm.addEventListener('submit', (e) => this.handleCreatePost(e));
        }

        // Modal close buttons
        const closeButtons = document.querySelectorAll('.close-btn, .btn-secondary');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => this.hideModals());
        });
    }

    async loadCommunityData() {
        try {
            // In a real application, these would be API calls
            await Promise.all([
                this.loadPosts(),
                this.loadTrendingTopics(),
                this.loadActiveUsers(),
                this.loadStats()
            ]);
        } catch (error) {
            console.error('Error loading community data:', error);
        }
    }

    async loadPosts() {
        try {
            // const response = await fetch('/api/community/posts');
            // if (!response.ok) throw new Error('Failed to load posts');
            // this.posts = await response.json();

            // Sample data for demonstration
            this.posts = [
                {
                    id: 1,
                    title: 'Tips for Learning Spanish Verb Conjugations',
                    category: 'discussion',
                    content: 'Here are some effective methods I use...',
                    author: 'Maria G.',
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    likes: 15,
                    comments: 8
                },
                {
                    id: 2,
                    title: 'Looking for Conversation Partner',
                    category: 'question',
                    content: 'I am looking for someone to practice with...',
                    author: 'John D.',
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    likes: 5,
                    comments: 12
                }
            ];

            this.filterAndRenderPosts();
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    async loadTrendingTopics() {
        try {
            // const response = await fetch('/api/community/trending');
            // if (!response.ok) throw new Error('Failed to load trending topics');
            // const topics = await response.json();

            // Sample data for demonstration
            const topics = [
                { name: 'Verb Conjugation', count: 25 },
                { name: 'Travel Phrases', count: 18 },
                { name: 'Grammar Tips', count: 15 }
            ];

            this.renderTrendingTopics(topics);
        } catch (error) {
            console.error('Error loading trending topics:', error);
        }
    }

    async loadActiveUsers() {
        try {
            // const response = await fetch('/api/community/active-users');
            // if (!response.ok) throw new Error('Failed to load active users');
            // const users = await response.json();

            // Sample data for demonstration
            const users = [
                { name: 'Maria G.', status: 'online', level: 'Advanced' },
                { name: 'John D.', status: 'online', level: 'Intermediate' },
                { name: 'Sarah M.', status: 'away', level: 'Beginner' }
            ];

            this.renderActiveUsers(users);
        } catch (error) {
            console.error('Error loading active users:', error);
        }
    }

    async loadStats() {
        try {
            // const response = await fetch('/api/community/stats');
            // if (!response.ok) throw new Error('Failed to load stats');
            // const stats = await response.json();

            // Sample data for demonstration
            const stats = {
                activeMembers: 150,
                discussions: 45
            };

            this.updateStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    filterAndRenderPosts() {
        let filteredPosts = this.posts;

        // Apply category filter
        if (this.currentCategory !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === this.currentCategory);
        }

        // Apply sort
        switch (this.currentSort) {
            case 'popular':
                filteredPosts.sort((a, b) => b.likes - a.likes);
                break;
            case 'active':
                filteredPosts.sort((a, b) => b.comments - a.comments);
                break;
            case 'recent':
            default:
                filteredPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        }

        this.renderPosts(filteredPosts);
    }

    renderPosts(posts) {
        const postsList = document.querySelector('.posts-list');
        if (!postsList) return;

        postsList.innerHTML = posts.map(post => `
            <div class="post-card" data-id="${post.id}">
                <div class="post-header">
                    <h3 class="post-title">${post.title}</h3>
                    <span class="post-category category-${post.category}">${post.category}</span>
                </div>
                <div class="post-meta">
                    <span><i class="fas fa-user"></i> ${post.author}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatTimestamp(post.timestamp)}</span>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <span class="post-action">
                        <i class="fas fa-heart"></i> ${post.likes} Likes
                    </span>
                    <span class="post-action">
                        <i class="fas fa-comment"></i> ${post.comments} Comments
                    </span>
                    <span class="post-action">
                        <i class="fas fa-share"></i> Share
                    </span>
                </div>
            </div>
        `).join('');

        // Add click handlers for posts
        document.querySelectorAll('.post-card').forEach(card => {
            card.addEventListener('click', () => this.showPostDetails(card.dataset.id));
        });
    }

    renderTrendingTopics(topics) {
        const topicList = document.querySelector('.topic-list');
        if (!topicList) return;

        topicList.innerHTML = topics.map(topic => `
            <li>
                <span>${topic.name}</span>
                <span class="topic-count">${topic.count} posts</span>
            </li>
        `).join('');
    }

    renderActiveUsers(users) {
        const userList = document.querySelector('.user-list');
        if (!userList) return;

        userList.innerHTML = users.map(user => `
            <li>
                <div class="user-info">
                    <span class="user-name">${user.name}</span>
                    <span class="user-status ${user.status}">${user.status}</span>
                </div>
                <span class="user-level">${user.level}</span>
            </li>
        `).join('');
    }

    updateStats(stats) {
        document.querySelectorAll('.stat-number').forEach(stat => {
            const statParent = stat.closest('.stat-card');
            if (statParent.querySelector('h3').textContent === 'Active Members') {
                stat.textContent = stats.activeMembers;
            } else if (statParent.querySelector('h3').textContent === 'Discussions') {
                stat.textContent = stats.discussions;
            }
        });
    }

    showCreatePostModal() {
        const modal = document.getElementById('createPostModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async handleCreatePost(event) {
        event.preventDefault();

        const formData = {
            title: document.getElementById('postTitle').value,
            category: document.getElementById('postCategory').value,
            content: document.getElementById('postContent').value,
            tags: document.getElementById('postTags').value.split(',').map(tag => tag.trim()),
            author: 'Current User', // In a real app, this would come from the authenticated user
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: 0
        };

        try {
            // In a real application, this would be an API call
            // const response = await fetch('/api/community/posts', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
            // if (!response.ok) throw new Error('Failed to create post');
            // const newPost = await response.json();

            // For demonstration, directly add to local array
            this.posts.unshift({ ...formData, id: Date.now() });
            this.filterAndRenderPosts();
            this.hideModals();
            document.getElementById('createPostForm').reset();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    }

    showPostDetails(postId) {
        const post = this.posts.find(p => p.id === parseInt(postId));
        if (!post) return;

        // In a real application, you would show a modal with post details
        // and options to like, comment, or share
        console.log('Post details:', post);
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }
}

// Initialize community manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.communityManager = new CommunityManager();
}); 