class MemoryGame {
    constructor() {
        this.wordPairs = [];
        this.cards = [];
        this.flippedCards = [];
        this.matches = 0;
        this.attempts = 0;
        this.isLocked = false;
        this.themes = [
            { name: 'Everything French', path: 'backgrounds/everything france.jpg' },
            { name: 'Everything Spanish', path: 'backgrounds/everything spanish.jpg' },
            { name: 'Typical Classroom', path: 'backgrounds/typical classroom.jpg' },
            { name: 'Forest', path: 'backgrounds/forest.jpg' },
            { name: 'Temple of Chaos', path: 'backgrounds/temple_of_chaos.jpg' },
            { name: 'Cave of Memories', path: 'backgrounds/cave_of_memories.jpg' }
        ];
        this.currentTheme = null;
        this.setupEventListeners();
        this.setupResizeObserver();
        this.showModal('customWordsModal');
        this.loadSavedTheme();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('customWordsBtn').addEventListener('click', () => this.showModal('customWordsModal'));
        document.getElementById('closeCustomWordsBtn').addEventListener('click', () => {
            if (this.wordPairs.length > 0) {
                this.hideModal('customWordsModal');
            }
        });
        
        // Game controls
        document.getElementById('addWordPair').addEventListener('click', () => this.addWordPair());
        document.getElementById('startGame').addEventListener('click', () => {
            this.hideModal('customWordsModal');
            this.startGame();
        });
        document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideModal('winModal');
            this.startGame();
        });
        
        // Input type controls
        document.getElementById('pairType').addEventListener('change', () => this.updateInputFields());
        
        // Image controls
        document.getElementById('imageSearchTrigger').addEventListener('click', () => this.showImageSearch());
        document.getElementById('closeImageSearch').addEventListener('click', () => this.hideModal('imageSearchModal'));
        document.getElementById('searchImagesBtn').addEventListener('click', () => this.searchImages());
        document.getElementById('imageSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchImages();
            }
        });
        
        // Upload controls
        document.getElementById('uploadImageBtn').addEventListener('click', () => {
            document.getElementById('customImageInput').click();
        });
        document.getElementById('customImageInput').addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Fullscreen controls
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        
        // Theme controls
        document.getElementById('themeBtn').addEventListener('click', () => this.showThemeModal());
        document.getElementById('closeThemeBtn').addEventListener('click', () => this.hideModal('themeModal'));
        document.getElementById('uploadThemeBtn').addEventListener('click', () => {
            document.getElementById('themeImageInput').click();
        });
        document.getElementById('themeImageInput').addEventListener('change', (e) => this.handleThemeUpload(e));
    }

    setupResizeObserver() {
        const container = document.querySelector('.cards-container');
        const grid = document.getElementById('cardsGrid');
        
        // Create a debounced version of setGridTemplate
        let resizeTimeout;
        const debouncedResize = () => {
            grid.classList.add('resizing');
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.setGridTemplate(this.wordPairs.length * 2);
                grid.classList.remove('resizing');
            }, 100);
        };

        // Create and attach the resize observer
        const resizeObserver = new ResizeObserver(debouncedResize);
        resizeObserver.observe(container);

        // Also handle window resize for fullscreen changes
        window.addEventListener('resize', debouncedResize);
    }

    showModal(modalId) {
        document.querySelector('.modal-overlay').style.display = 'block';
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.querySelector('.modal-overlay').style.display = 'none';
        document.getElementById(modalId).style.display = 'none';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                document.body.classList.add('fullscreen');
                document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i>';
            }).catch(() => {});
        } else {
            document.exitFullscreen().then(() => {
                document.body.classList.remove('fullscreen');
                document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i>';
            }).catch(() => {});
        }
    }

    updateInputFields() {
        const pairType = document.getElementById('pairType').value;
        const vocabInput = document.getElementById('vocabInput');
        const wordEntry = document.querySelector('.word-entry');
        
        if (pairType === 'word') {
            vocabInput.style.display = 'block';
            wordEntry.style.display = 'none';
        } else {
            vocabInput.style.display = 'none';
            wordEntry.style.display = 'flex';
        }
    }

    async searchImagesAPI(query) {
        const PIXABAY_API_KEY = '48227900-ec6e3d762c2e05db2ab8112f5';
        const encodedQuery = encodeURIComponent(query);
        const url = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodedQuery}&image_type=photo&per_page=12&safesearch=true`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
            if (data.hits && data.hits.length > 0) {
                return data.hits.map(image => ({
                    url: image.webformatURL,
                    user: image.user,
                    pageUrl: image.pageURL,
                    previewUrl: image.previewURL
                }));
            } else {
                alert('No images found. Try a different search term.');
                return [];
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            throw new Error('Failed to fetch images from Pixabay');
        }
    }

    async searchImages() {
        const query = document.getElementById('imageSearchInput').value.trim();
        if (!query) return;

        const loadingSpinner = document.getElementById('imageSearchLoading');
        const imageSearchResults = document.getElementById('imageSearchResults');
        
        loadingSpinner.style.display = 'block';
        imageSearchResults.innerHTML = '';

        try {
            const images = await this.searchImagesAPI(query);
            loadingSpinner.style.display = 'none';
            
            if (images.length > 0) {
                // Add Pixabay attribution
                const attribution = document.createElement('div');
                attribution.className = 'pixabay-attribution';
                attribution.innerHTML = 'Images provided by <a href="https://pixabay.com" target="_blank">Pixabay</a>';
                imageSearchResults.appendChild(attribution);
                
                // Create image grid
                const imageGrid = document.createElement('div');
                imageGrid.className = 'image-grid';
                
                images.forEach(image => {
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'image-result-container';
                    
                    const img = document.createElement('img');
                    img.src = image.previewUrl;
                    img.className = 'image-result';
                    
                    const fullImg = new Image();
                    fullImg.src = image.url;
                    fullImg.onload = () => {
                        img.src = image.url;
                    };
                    
                    const credit = document.createElement('div');
                    credit.className = 'image-credit';
                    credit.innerHTML = `by <a href="${image.pageUrl}" target="_blank">${image.user}</a>`;
                    
                    imgContainer.appendChild(img);
                    imgContainer.appendChild(credit);
                    imageGrid.appendChild(imgContainer);
                    
                    img.addEventListener('click', () => {
                        this.addWordWithImage(document.getElementById('spanishWord').value.trim(), image.url);
                        this.hideModal('imageSearchModal');
                    });
                });
                
                imageSearchResults.appendChild(imageGrid);
            }
        } catch (error) {
            loadingSpinner.style.display = 'none';
            alert('Error searching for images. Please try again.');
        }
    }

    showImageSearch() {
        const word = document.getElementById('spanishWord').value.trim();
        if (!word) {
            alert('Please enter a word first');
            return;
        }
        document.getElementById('imageSearchInput').value = word;
        this.showModal('imageSearchModal');
        this.searchImages();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const word = document.getElementById('spanishWord').value.trim();
        if (!word) {
            alert('Please enter a word first');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.addWordWithImage(word, e.target.result);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            alert('Error processing image');
        }
    }

    addWordWithImage(word, imageUrl) {
        if (!word) {
            alert('Please enter a word first');
            return;
        }

        // Check if word already exists
        const exists = this.wordPairs.some(pair => pair.spanish.toLowerCase() === word.toLowerCase());
        if (exists) {
            alert('This word already exists in the list');
            return;
        }

        this.wordPairs.push({
            spanish: word,
            english: imageUrl,
            type: 'image'
        });

        this.updateWordPairsList();
        document.getElementById('spanishWord').value = '';
        document.getElementById('startGame').disabled = this.wordPairs.length < 2;
    }

    addWordPair() {
        const pairType = document.getElementById('pairType').value;

        if (pairType === 'word') {
            const vocabInput = document.getElementById('vocabInput').value.trim();
            if (!vocabInput) {
                alert('Please enter word pairs');
                return;
            }

                const pairs = vocabInput.split('\n').map(line => {
                const [english, spanish] = line.split(/[,\t]/).map(word => word.trim());
                if (english && spanish) {
                    return { type: 'word', english, spanish };
                }
                return null;
            }).filter(pair => pair !== null);

            if (pairs.length > 0) {
                this.wordPairs.push(...pairs);
                this.updateWordPairsList();
                document.getElementById('vocabInput').value = '';
            }
        }

        document.getElementById('startGame').disabled = this.wordPairs.length < 2;
    }

    updateWordPairsList() {
        const list = document.getElementById('wordPairsList');
        list.innerHTML = this.wordPairs.map((pair, index) => `
            <div class="word-pair">
                <div class="word-content">
                    ${pair.type === 'image' 
                        ? `<img src="${pair.english}" alt="${pair.spanish}">`
                        : `<span>${pair.english}</span>`}
                    <span>${pair.spanish}</span>
                </div>
                <button class="delete-btn" onclick="game.removeWordPair(${index})">×</button>
            </div>
        `).join('');
    }

    removeWordPair(index) {
        this.wordPairs.splice(index, 1);
        this.updateWordPairsList();
        document.getElementById('startGame').disabled = this.wordPairs.length < 2;
    }

    createCards() {
        const grid = document.getElementById('cardsGrid');
        grid.innerHTML = '';
        
        // Create pairs array with numbers
        const pairs = this.wordPairs.reduce((acc, pair, index) => {
            // First card (English/Image)
            acc.push({
                content: pair.type === 'image' 
                    ? `<img src="${pair.english}" alt="${pair.spanish}" style="max-width: 100%; max-height: 100%;">` 
                    : pair.english,
                pairIndex: index,
                type: 'first'
            });
            
            // Second card (Spanish)
            acc.push({
                content: pair.spanish,
                pairIndex: index,
                type: 'second'
            });
            return acc;
        }, []);
        
        // Shuffle the pairs
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }
        
        // Create cards
        pairs.forEach((pair, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.pairIndex = pair.pairIndex;
            card.dataset.type = pair.type;
            
            const front = document.createElement('div');
            front.className = 'card-front';
            front.textContent = index + 1;
            
            const back = document.createElement('div');
            back.className = 'card-back';
            back.innerHTML = pair.content;
            
            card.appendChild(front);
            card.appendChild(back);
            
            card.addEventListener('click', () => this.flipCard(card));
            grid.appendChild(card);
        });
        
        this.setGridTemplate(pairs.length);
    }

    setGridTemplate(cardCount) {
        const grid = document.getElementById('cardsGrid');
        const container = document.querySelector('.cards-container');
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        let columns, rows;
        
        // Calculate optimal grid layout based on aspect ratio
        const containerAspect = containerWidth / containerHeight;
        
        if (cardCount <= 6) {
            columns = containerAspect > 1.5 ? 3 : 2;
        } else if (cardCount <= 8) {
            columns = containerAspect > 1.5 ? 4 : 3;
        } else if (cardCount <= 12) {
            columns = containerAspect > 1.5 ? 4 : 3;
        } else {
            columns = containerAspect > 1.5 ? 
                     Math.ceil(Math.sqrt(cardCount * containerAspect)) : 
                     Math.ceil(Math.sqrt(cardCount));
        }
        
        rows = Math.ceil(cardCount / columns);
        
        // Adjust if the resulting layout is too tall
        if (containerHeight / rows < containerWidth / columns * 0.7) {
            columns = Math.ceil(Math.sqrt(cardCount));
            rows = Math.ceil(cardCount / columns);
        }

        // Calculate card size
        const maxCardWidth = Math.floor(containerWidth / columns) - 15;
        const maxCardHeight = Math.floor(containerHeight / rows) - 15;
        const cardSize = Math.min(maxCardWidth, maxCardHeight);

        // Apply grid styles
        grid.style.gridTemplateColumns = `repeat(${columns}, ${cardSize}px)`;
        grid.style.gridTemplateRows = `repeat(${rows}, ${cardSize}px)`;
        grid.style.gap = '15px';
        grid.style.justifyContent = 'center';
        grid.style.alignContent = 'center';
    }

    flipCard(card) {
        if (this.isLocked || card.classList.contains('flipped')) return;
        
        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.isLocked = true;
            this.checkMatch();
        }
    }

    checkMatch() {
        this.attempts++;
        const [card1, card2] = this.flippedCards;
        const isMatch = card1.dataset.pairIndex === card2.dataset.pairIndex &&
                       card1.dataset.type !== card2.dataset.type;

        if (isMatch) {
            this.handleMatch();
        } else {
            this.handleMismatch();
        }

        this.updateStats();
    }

    handleMatch() {
        this.matches++;
        this.flippedCards.forEach(card => {
            const back = card.querySelector('.card-back');
            back.style.backgroundColor = '#86efac';
            back.style.borderColor = '#86efac';
            back.style.color = '#065f46';
        });
        
        document.getElementById('correctSound').play().catch(() => {});
        this.flippedCards = [];
        this.isLocked = false;

        if (this.matches === this.wordPairs.length) {
            document.getElementById('winSound').play().catch(() => {});
            setTimeout(() => this.showWinScreen(), 500);
        }
    }

    handleMismatch() {
        // Add red background temporarily
        this.flippedCards.forEach(card => {
            const back = card.querySelector('.card-back');
            back.style.backgroundColor = '#fecaca';
            back.style.borderColor = '#ef4444';
        });
        
        document.getElementById('wrongSound').play().catch(() => {});
        
        setTimeout(() => {
            this.flippedCards.forEach(card => {
                const back = card.querySelector('.card-back');
                // Reset styles
                back.style.backgroundColor = '';
                back.style.borderColor = '';
                card.classList.remove('flipped');
            });
            this.flippedCards = [];
            this.isLocked = false;
        }, 1000);
    }

    showWinScreen() {
        document.getElementById('finalMatches').textContent = this.matches;
        document.getElementById('finalAttempts').textContent = this.attempts;
        this.showModal('winModal');
    }

    updateStats() {
        document.getElementById('matchCount').textContent = this.matches;
        document.getElementById('attempts').textContent = this.attempts;
    }

    startGame() {
        this.matches = 0;
        this.attempts = 0;
        this.flippedCards = [];
        this.isLocked = false;
        this.createCards();
        this.updateStats();
    }

    resetGame() {
        if (confirm('Are you sure you want to reset the game?')) {
            this.startGame();
        }
    }

    showThemeModal() {
        const themeGrid = document.getElementById('themeGrid');
        themeGrid.innerHTML = '';

        this.themes.forEach(theme => {
            const themeOption = document.createElement('div');
            themeOption.className = 'theme-option';
            if (this.currentTheme === theme.path) {
                themeOption.classList.add('selected');
            }

            const img = document.createElement('img');
            img.src = theme.path;
            img.alt = theme.name;

            const themeName = document.createElement('div');
            themeName.className = 'theme-name';
            themeName.textContent = theme.name;

            themeOption.appendChild(img);
            themeOption.appendChild(themeName);
            themeOption.addEventListener('click', () => this.setTheme(theme.path));

            themeGrid.appendChild(themeOption);
        });

        this.showModal('themeModal');
    }

    async handleThemeUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const customTheme = {
                    name: 'Custom Theme',
                    path: e.target.result
                };
                this.themes.push(customTheme);
                this.setTheme(customTheme.path);
                this.hideModal('themeModal');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            alert('Error processing image');
        }
    }

    setTheme(themePath) {
        this.currentTheme = themePath;
        document.querySelector('.game-wrapper').style.backgroundImage = `url('${themePath}')`;
        localStorage.setItem('memoryGameTheme', themePath);
        
        // Update selected state in theme grid
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.classList.toggle('selected', option.querySelector('img').src === themePath);
        });
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('memoryGameTheme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        }
    }
}

// Initialize game
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new MemoryGame();


});

