document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        return;
    }

    initializeMessages();
});

let activeConversationId = null;
let selectedRecipients = new Set();
let messageUpdateInterval;

async function initializeMessages() {
    try {
        await loadConversations();
        setupEventListeners();
        setupDragAndDrop();
        showSuccess('Messages loaded successfully');
    } catch (error) {
        console.error('Error initializing messages:', error);
        showError('Failed to load messages');
    }
}

async function loadConversations(filter = 'all') {
    try {
        const conversations = await window.teacherApiService.getConversations(filter);
        renderConversationsList(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
        showError('Failed to load conversations');
    }
}

function renderConversationsList(conversations) {
    const conversationsList = document.querySelector('.conversations-list');
    
    if (conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comments"></i>
                <h3>No conversations</h3>
                <p>Start a new conversation to begin messaging</p>
            </div>
        `;
        return;
    }
    
    conversationsList.innerHTML = conversations.map(conversation => `
        <div class="conversation-item ${conversation.unread ? 'unread' : ''} ${conversation.starred ? 'starred' : ''}"
             onclick="viewConversation('${conversation.id}')"
             data-conversation-id="${conversation.id}">
            <div class="conversation-avatar">
                ${getConversationAvatar(conversation)}
            </div>
            <div class="conversation-content">
                <div class="conversation-header">
                    <h3>${conversation.title}</h3>
                    <span class="conversation-time">${formatTime(conversation.lastMessageTime)}</span>
                </div>
                <div class="conversation-preview">
                    <p>${conversation.lastMessage}</p>
                    ${conversation.unread ? '<span class="unread-badge"></span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function getConversationAvatar(conversation) {
    if (conversation.participants.length === 1) {
        return `<div class="avatar">${conversation.participants[0].name.charAt(0)}</div>`;
    }
    
    return `
        <div class="avatar-group">
            <div class="avatar">${conversation.participants[0].name.charAt(0)}</div>
            <div class="avatar">${conversation.participants[1].name.charAt(0)}</div>
            ${conversation.participants.length > 2 ? `<div class="avatar-count">+${conversation.participants.length - 2}</div>` : ''}
        </div>
    `;
}

async function viewConversation(conversationId) {
    try {
        clearInterval(messageUpdateInterval);
        activeConversationId = conversationId;
        
        const conversation = await window.teacherApiService.getConversationDetails(conversationId);
        
        // Update UI
        document.querySelector('.empty-state').style.display = 'none';
        document.querySelector('.conversation-view').style.display = 'block';
        
        // Update conversation header
        document.querySelector('.conversation-title').textContent = conversation.title;
        document.querySelector('.conversation-participants').textContent = 
            `${conversation.participants.map(p => p.name).join(', ')}`;
        
        // Update star button
        const starButton = document.querySelector('.conversation-actions .fa-star');
        starButton.className = conversation.starred ? 'fas fa-star' : 'far fa-star';
        
        // Load messages
        await loadMessages(conversationId);
        
        // Mark as read
        if (conversation.unread) {
            await window.teacherApiService.markConversationAsRead(conversationId);
            document.querySelector(`[data-conversation-id="${conversationId}"]`).classList.remove('unread');
        }
        
        // Start periodic updates
        messageUpdateInterval = setInterval(() => loadMessages(conversationId, true), 10000);
    } catch (error) {
        console.error('Error viewing conversation:', error);
        showError('Failed to load conversation');
    }
}

async function loadMessages(conversationId, silent = false) {
    try {
        const messages = await window.teacherApiService.getMessages(conversationId);
        renderMessages(messages, silent);
    } catch (error) {
        console.error('Error loading messages:', error);
        if (!silent) {
            showError('Failed to load messages');
        }
    }
}

function renderMessages(messages, silent = false) {
    const messagesList = document.querySelector('.messages-list');
    const wasScrolledToBottom = isScrolledToBottom(messagesList);
    
    const newHtml = messages.map(message => `
        <div class="message ${message.sender.isTeacher ? 'sent' : 'received'}">
            <div class="message-content">
                ${!message.sender.isTeacher ? `
                    <div class="message-sender">${message.sender.name}</div>
                ` : ''}
                <div class="message-text">${message.content}</div>
                ${message.attachments.length > 0 ? `
                    <div class="message-attachments">
                        ${message.attachments.map(file => `
                            <div class="attachment-item">
                                <i class="fas ${getFileIcon(file.type)}"></i>
                                <span class="file-name">${file.name}</span>
                                <span class="file-size">${formatFileSize(file.size)}</span>
                                <button onclick="downloadAttachment('${file.id}')" class="download-button">
                                    <i class="fas fa-download"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="message-time">${formatTime(message.timestamp)}</div>
            </div>
        </div>
    `).join('');
    
    if (!silent || messagesList.innerHTML !== newHtml) {
        messagesList.innerHTML = newHtml;
        
        if (wasScrolledToBottom) {
            scrollToBottom(messagesList);
        }
    }
}

// Compose Message
function composeMessage() {
    const modal = document.getElementById('compose-modal');
    document.getElementById('compose-form').reset();
    document.querySelector('.recipients-tags').innerHTML = '';
    document.querySelector('.uploaded-files').innerHTML = '';
    selectedRecipients.clear();
    modal.style.display = 'block';
}

function closeComposeModal() {
    const modal = document.getElementById('compose-modal');
    modal.style.display = 'none';
}

async function searchRecipients(query) {
    try {
        const results = await window.teacherApiService.searchRecipients(query);
        const suggestions = document.querySelector('.recipients-suggestions');
        
        if (results.length === 0) {
            suggestions.innerHTML = '<div class="no-results">No results found</div>';
            return;
        }
        
        suggestions.innerHTML = results.map(recipient => `
            <div class="recipient-suggestion" onclick="addRecipient('${recipient.id}', '${recipient.name}', '${recipient.type}')">
                <div class="recipient-avatar">
                    ${recipient.type === 'class' ? '<i class="fas fa-users"></i>' : recipient.name.charAt(0)}
                </div>
                <div class="recipient-info">
                    <div class="recipient-name">${recipient.name}</div>
                    <div class="recipient-type">${recipient.type === 'class' ? 'Class' : 'Student'}</div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching recipients:', error);
        showError('Failed to search recipients');
    }
}

function addRecipient(id, name, type) {
    if (selectedRecipients.has(id)) {
        return;
    }
    
    selectedRecipients.add(id);
    
    const recipientTag = document.createElement('div');
    recipientTag.className = 'recipient-tag';
    recipientTag.innerHTML = `
        <span>${name}</span>
        <button type="button" onclick="removeRecipient('${id}', this.parentElement)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.querySelector('.recipients-tags').appendChild(recipientTag);
    document.querySelector('.recipients-suggestions').innerHTML = '';
    document.getElementById('recipients-search').value = '';
}

function removeRecipient(id, element) {
    selectedRecipients.delete(id);
    element.remove();
}

// File Upload
function setupDragAndDrop() {
    const uploadArea = document.getElementById('compose-upload-area');
    const fileInput = document.getElementById('compose-files');
    
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
    
    Array.from(files).forEach(file => {
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

// Message Actions
async function sendMessage() {
    const messageInput = document.querySelector('.message-input');
    const content = messageInput.textContent.trim();
    const attachments = document.querySelector('.composer-attachments').children;
    
    if (!content && attachments.length === 0) {
        showError('Please enter a message or attach files');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('conversationId', activeConversationId);
        
        // Add attachments
        Array.from(attachments).forEach(element => {
            const fileName = element.querySelector('.file-name').textContent;
            const file = Array.from(document.getElementById('message-files').files)
                .find(f => f.name === fileName);
            if (file) {
                formData.append('files', file);
            }
        });
        
        await window.teacherApiService.sendMessage(formData);
        
        // Clear input and attachments
        messageInput.textContent = '';
        document.querySelector('.composer-attachments').innerHTML = '';
        
        // Reload messages
        await loadMessages(activeConversationId);
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
    }
}

async function submitCompose(event) {
    event.preventDefault();
    
    if (selectedRecipients.size === 0) {
        showError('Please select at least one recipient');
        return;
    }
    
    const form = event.target;
    const formData = new FormData();
    
    formData.append('recipients', Array.from(selectedRecipients));
    formData.append('subject', form.subject.value);
    formData.append('message', form.message.value);
    
    // Add attachments
    const fileElements = form.querySelector('.uploaded-files').children;
    Array.from(fileElements).forEach(element => {
        const fileName = element.querySelector('.file-name').textContent;
        const file = Array.from(document.getElementById('compose-files').files)
            .find(f => f.name === fileName);
        if (file) {
            formData.append('files', file);
        }
    });
    
    try {
        await window.teacherApiService.createConversation(formData);
        showSuccess('Message sent successfully');
        closeComposeModal();
        await loadConversations();
    } catch (error) {
        console.error('Error creating conversation:', error);
        showError('Failed to send message');
    }
}

// Conversation Actions
async function toggleStar() {
    try {
        const starred = await window.teacherApiService.toggleConversationStar(activeConversationId);
        const starButton = document.querySelector('.conversation-actions .fa-star');
        starButton.className = starred ? 'fas fa-star' : 'far fa-star';
        
        // Update conversation list item
        const conversationItem = document.querySelector(`[data-conversation-id="${activeConversationId}"]`);
        if (starred) {
            conversationItem.classList.add('starred');
        } else {
            conversationItem.classList.remove('starred');
        }
    } catch (error) {
        console.error('Error toggling star:', error);
        showError('Failed to update conversation');
    }
}

function showMoreOptions(event) {
    const menu = document.getElementById('more-options-menu');
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    
    menu.style.top = `${rect.bottom + 5}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    menu.style.display = 'block';
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== button) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        }
    });
}

async function markAsUnread() {
    try {
        await window.teacherApiService.markConversationAsUnread(activeConversationId);
        document.querySelector(`[data-conversation-id="${activeConversationId}"]`).classList.add('unread');
        document.getElementById('more-options-menu').style.display = 'none';
    } catch (error) {
        console.error('Error marking as unread:', error);
        showError('Failed to update conversation');
    }
}

async function muteConversation() {
    try {
        await window.teacherApiService.muteConversation(activeConversationId);
        showSuccess('Conversation muted');
        document.getElementById('more-options-menu').style.display = 'none';
    } catch (error) {
        console.error('Error muting conversation:', error);
        showError('Failed to update conversation');
    }
}

async function archiveConversation() {
    try {
        await window.teacherApiService.archiveConversation(activeConversationId);
        document.querySelector(`[data-conversation-id="${activeConversationId}"]`).remove();
        resetConversationView();
        showSuccess('Conversation archived');
        document.getElementById('more-options-menu').style.display = 'none';
    } catch (error) {
        console.error('Error archiving conversation:', error);
        showError('Failed to update conversation');
    }
}

async function deleteConversation() {
    if (!confirm('Are you sure you want to delete this conversation?')) {
        return;
    }
    
    try {
        await window.teacherApiService.deleteConversation(activeConversationId);
        document.querySelector(`[data-conversation-id="${activeConversationId}"]`).remove();
        resetConversationView();
        showSuccess('Conversation deleted');
        document.getElementById('more-options-menu').style.display = 'none';
    } catch (error) {
        console.error('Error deleting conversation:', error);
        showError('Failed to delete conversation');
    }
}

// Utility Functions
function resetConversationView() {
    clearInterval(messageUpdateInterval);
    activeConversationId = null;
    document.querySelector('.empty-state').style.display = 'block';
    document.querySelector('.conversation-view').style.display = 'none';
}

function isScrolledToBottom(element) {
    return element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
}

function scrollToBottom(element) {
    element.scrollTop = element.scrollHeight;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(fileType) {
    const iconMap = {
        'application/pdf': 'fa-file-pdf',
        'application/msword': 'fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fa-file-word',
        'application/vnd.ms-powerpoint': 'fa-file-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fa-file-powerpoint',
        'image/jpeg': 'fa-file-image',
        'image/png': 'fa-file-image',
        'image/gif': 'fa-file-image',
        'application/zip': 'fa-file-archive'
    };
    return iconMap[fileType] || 'fa-file';
}

function setupEventListeners() {
    // Conversation search
    let searchTimeout;
    document.getElementById('conversation-search').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            const conversationItems = document.querySelectorAll('.conversation-item');
            
            conversationItems.forEach(item => {
                const title = item.querySelector('h3').textContent.toLowerCase();
                const preview = item.querySelector('.conversation-preview p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || preview.includes(searchTerm)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }, 300);
    });
    
    // Recipients search
    let recipientSearchTimeout;
    document.getElementById('recipients-search').addEventListener('input', (e) => {
        clearTimeout(recipientSearchTimeout);
        recipientSearchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                searchRecipients(query);
            } else {
                document.querySelector('.recipients-suggestions').innerHTML = '';
            }
        }, 300);
    });
    
    // Conversation filters
    document.querySelectorAll('.filter-button').forEach(button => {
        button.addEventListener('click', async () => {
            document.querySelector('.filter-button.active').classList.remove('active');
            button.classList.add('active');
            await loadConversations(button.dataset.filter);
        });
    });
    
    // Close context menu on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('more-options-menu').style.display = 'none';
        }
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

class MessagesManager {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.isLoading = false;
        this.searchQuery = '';
        this.initializeEventListeners();
    }

    async initializeEventListeners() {
        // New message button
        document.getElementById('newMessageBtn').addEventListener('click', () => this.showNewMessageModal());

        // Close modal button
        document.getElementById('closeMessageModal').addEventListener('click', () => this.hideNewMessageModal());
        document.getElementById('cancelMessageBtn').addEventListener('click', () => this.hideNewMessageModal());

        // Send message button in modal
        document.getElementById('sendMessageBtn').addEventListener('click', () => this.startNewConversation());

        // Search input
        const searchInput = document.querySelector('.search-box input');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.filterConversations();
        });

        // Message input
        const messageInput = document.querySelector('.message-input textarea');
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.querySelector('.send-btn').addEventListener('click', () => this.sendMessage());

        // Initialize conversations
        await this.loadConversations();
    }

    async loadConversations() {
        try {
            this.isLoading = true;
            // In a real application, this would be an API call
            const response = await this.fetchConversations();
            this.conversations = response;
            this.renderConversationsList();
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async fetchConversations() {
        // This is a mock response. In a real application, this would be an API call
        return [
            {
                id: 1,
                participants: [
                    { id: 2, name: 'Sarah Johnson', avatar: '/images/avatar-1.jpg', status: 'online' }
                ],
                lastMessage: {
                    content: 'Hey! Would you like to practice Spanish together?',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5),
                    senderId: 2
                },
                unread: true
            },
            {
                id: 2,
                participants: [
                    { id: 3, name: 'Language Exchange Group', avatar: '/images/group-1.jpg', status: 'offline' }
                ],
                lastMessage: {
                    content: 'Great session everyone! Same time next week?',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60),
                    senderId: 1
                },
                unread: false
            }
        ];
    }

    renderConversationsList() {
        const listContainer = document.querySelector('.messages-list');
        listContainer.innerHTML = '';

        const filteredConversations = this.conversations.filter(conv => {
            const participantNames = conv.participants.map(p => p.name.toLowerCase()).join(' ');
            return participantNames.includes(this.searchQuery.toLowerCase());
        });

        filteredConversations.forEach(conversation => {
            const preview = this.createConversationPreview(conversation);
            listContainer.appendChild(preview);
        });
    }

    createConversationPreview(conversation) {
        const div = document.createElement('div');
        div.className = `message-preview ${conversation.unread ? 'unread' : ''} ${this.currentConversation?.id === conversation.id ? 'active' : ''}`;
        
        const participant = conversation.participants[0];
        const lastMessage = conversation.lastMessage;
        const time = this.formatTimestamp(lastMessage.timestamp);

        div.innerHTML = `
            <div class="preview-avatar">
                <img src="${participant.avatar}" alt="${participant.name}">
                <span class="status-indicator ${participant.status}"></span>
            </div>
            <div class="preview-content">
                <div class="preview-header">
                    <h4>${participant.name}</h4>
                    <span class="preview-time">${time}</span>
                </div>
                <p class="preview-message">${lastMessage.content}</p>
            </div>
            ${conversation.unread ? '<span class="unread-badge"></span>' : ''}
        `;

        div.addEventListener('click', () => this.loadConversation(conversation));
        return div;
    }

    async loadConversation(conversation) {
        this.currentConversation = conversation;
        this.renderConversationsList(); // Update active state
        
        document.querySelector('.empty-state').classList.remove('active');
        const conversationView = document.querySelector('.conversation-view');
        conversationView.classList.add('active');

        // Update conversation header
        const participant = conversation.participants[0];
        document.querySelector('.contact-avatar img').src = participant.avatar;
        document.querySelector('.contact-avatar .status-indicator').className = `status-indicator ${participant.status}`;
        document.querySelector('.contact-details h3').textContent = participant.name;
        document.querySelector('.contact-status').textContent = participant.status === 'online' ? 'Online' : 'Offline';

        // Load messages
        const messages = await this.fetchMessages(conversation.id);
        this.renderMessages(messages);
    }

    async fetchMessages(conversationId) {
        // This is a mock response. In a real application, this would be an API call
        return [
            {
                id: 1,
                content: 'Hey! Would you like to practice Spanish together?',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                senderId: 2
            },
            {
                id: 2,
                content: "Sure! I'd love to practice. What's your level?",
                timestamp: new Date(Date.now() - 1000 * 60 * 25),
                senderId: 1
            },
            {
                id: 3,
                content: "I'm at intermediate level (B1). How about you?",
                timestamp: new Date(Date.now() - 1000 * 60 * 20),
                senderId: 2
            }
        ];
    }

    renderMessages(messages) {
        const container = document.querySelector('.conversation-messages');
        container.innerHTML = '';

        messages.forEach(message => {
            const div = document.createElement('div');
            div.className = `message ${message.senderId === 1 ? 'sent' : 'received'}`;
            
            div.innerHTML = `
                <div class="message-content">
                    <p>${message.content}</p>
                    <span class="message-time">${this.formatTimestamp(message.timestamp)}</span>
                </div>
            `;

            container.appendChild(div);
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        const textarea = document.querySelector('.message-input textarea');
        const content = textarea.value.trim();

        if (!content || !this.currentConversation) return;

        // In a real application, this would be an API call
        const message = {
            id: Date.now(),
            content,
            timestamp: new Date(),
            senderId: 1
        };

        // Optimistically add message to UI
        const container = document.querySelector('.conversation-messages');
        const div = document.createElement('div');
        div.className = 'message sent';
        div.innerHTML = `
            <div class="message-content">
                <p>${content}</p>
                <span class="message-time">${this.formatTimestamp(message.timestamp)}</span>
            </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        // Clear input
        textarea.value = '';

        // Update conversation preview
        this.currentConversation.lastMessage = message;
        this.renderConversationsList();
    }

    showNewMessageModal() {
        document.getElementById('newMessageModal').classList.add('active');
    }

    hideNewMessageModal() {
        document.getElementById('newMessageModal').classList.remove('active');
        document.getElementById('recipient').value = '';
        document.getElementById('messageContent').value = '';
    }

    async startNewConversation() {
        const recipient = document.getElementById('recipient').value.trim();
        const content = document.getElementById('messageContent').value.trim();

        if (!recipient || !content) return;

        // In a real application, this would be an API call to create a new conversation
        const conversation = {
            id: Date.now(),
            participants: [
                { id: Date.now(), name: recipient, avatar: '/images/default-avatar.png', status: 'offline' }
            ],
            lastMessage: {
                content,
                timestamp: new Date(),
                senderId: 1
            },
            unread: false
        };

        this.conversations.unshift(conversation);
        this.renderConversationsList();
        this.hideNewMessageModal();
        this.loadConversation(conversation);
    }

    filterConversations() {
        this.renderConversationsList();
    }

    formatTimestamp(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 1000 * 60) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 1000 * 60 * 60) { // Less than 1 hour
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m ago`;
        } else if (diff < 1000 * 60 * 60 * 24) { // Less than 24 hours
            const hours = Math.floor(diff / (1000 * 60 * 60));
            return `${hours}h ago`;
        } else if (diff < 1000 * 60 * 60 * 24 * 7) { // Less than 7 days
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Initialize messages manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.messagesManager = new MessagesManager();
}); 