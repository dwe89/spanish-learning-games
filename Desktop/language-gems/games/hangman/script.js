import { supabase } from '../../src/authentication/supabase-client.js';

const DEBUG = true;

const gameElements = {
    startGameBtn: document.getElementById('startGameBtn'),
    wordInput: document.getElementById('wordInput'),
    displayWord: document.getElementById('displayWord'),
    lettersContainer: document.getElementById('lettersContainer'),
    canvas: document.getElementById('hangmanCanvas'),
    categorySelect: document.getElementById('categorySelect'),
    currentScore: document.getElementById('currentScore'),
    timer: document.getElementById('timer'),
    streak: document.getElementById('streak'),
    wins: document.getElementById('wins'),
    losses: document.getElementById('losses'),
    hintBtn: document.getElementById('hintBtn'),
    customListBtn: document.getElementById('customListBtn'),
    customListModal: document.getElementById('customListModal'),
    customWordDisplay: document.getElementById('customWordDisplay'),
    addToListBtn: document.getElementById('addToListBtn'),
    startCustomListBtn: document.getElementById('startCustomListBtn'),
    generateLinkBtn: document.getElementById('generateLinkBtn'),
    instructionsBtn: document.getElementById('instructionsBtn'),
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    highScoresBtn: document.getElementById('highScoresBtn'),
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    speakWordBtn: document.getElementById('speakWordBtn'),
    shareScoreBtn: document.getElementById('shareScoreBtn'),
    restartBtn: document.getElementById('restartBtn'),
    wordDisplay: document.getElementById('wordDisplay'),
    guessedLettersDisplay: document.getElementById('guessedLetters'),
    hangmanImage: document.getElementById('hangmanImage'),
    messageDisplay: document.getElementById('message')
};

// Add these at the very top with other game state declarations
let guessedLetters = [];
let mistakes = 0;
let currentWord = '';
let gameOver = false;

// Add game state variables at the top
let selectedWord = '';
let displayWord = '';
let wrongGuesses = 0;
let timeElapsed = 0;
let gameTimer;
let lastWord = ''; // Store the last word for retry

// Add variables for tracking game state
let wins = 0;
let losses = 0;
let currentStreak = 0;

// Add background music audio element
const backgroundMusic = new Audio('assets/music/background.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3; // Set initial volume to 30%

// Add music control variables
let musicEnabled = true;

// Fullscreen functionality
const fullscreenBtn = document.getElementById('fullscreenBtn');
const gameContainer = document.querySelector('.game-container');

// Add at the top with other state variables
let savedWordLists = [];

// Add these constants at the top
const GAME_MODES = {
    DEFAULT: 'default',
    CUSTOM: 'custom',
    SAVED: 'saved'
};
let currentGameMode = GAME_MODES.DEFAULT;

// Move this to the top with other game variables
let defaultWordList = ['hangman', 'javascript', 'programming', 'computer']; // Your default words

// Add early declaration
window.initializeNewWord = window.initializeNewWord || function(word) {
    console.error('initializeNewWord not implemented! Word:', word);
};

// At VERY TOP of file
(function() {
    // Initialize early reference
    window.startNextWord = window.startNextWord || function() {
        console.error('startNextWord not initialized!');
    };
    
    // Initialize music controls early
    window.musicToggleBtn = document.getElementById('musicToggle');
})();

// Modified startNextWord function
window.startNextWord = function() {
    const activeWordList = currentGameMode === GAME_MODES.DEFAULT 
        ? defaultWordList 
        : customWordList;

    if (!activeWordList || activeWordList.length === 0) {
        showNotification('No words available!', 'error');
        return;
    }

    currentWordIndex = (currentWordIndex + 1) % activeWordList.length;
    initializeNewWord(activeWordList[currentWordIndex]);
};

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        if (gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen();
        } else if (gameContainer.webkitRequestFullscreen) {
            gameContainer.webkitRequestFullscreen();
        } else if (gameContainer.msRequestFullscreen) {
            gameContainer.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function updateFullscreenIcon() {
    const icon = fullscreenBtn.querySelector('i');
    if (!icon) return;
    
    icon.classList.remove('fa-expand', 'fa-compress');
    icon.classList.add(document.fullscreenElement ? 'fa-compress' : 'fa-expand');
}

// Add word categories
const wordCategories = {
    animals: [
        'elephant', 'giraffe', 'penguin', 'kangaroo', 'dolphin',
        'lion', 'tiger', 'zebra', 'rhinoceros', 'koala',
        'panda', 'cheetah', 'gorilla', 'hippopotamus', 'octopus'
    ],
    countries: [
        'france', 'japan', 'brazil', 'australia', 'egypt',
        'canada', 'india', 'italy', 'mexico', 'russia',
        'spain', 'china', 'germany', 'thailand', 'greece'
    ],
    food: [
        'pizza', 'sushi', 'hamburger', 'spaghetti', 'tacos',
        'pancakes', 'chocolate', 'icecream', 'sandwich', 'salad',
        'noodles', 'cookies', 'burrito', 'lasagna', 'croissant'
    ],
    movies: [
        'avatar', 'titanic', 'starwars', 'inception', 'jaws',
        'matrix', 'gladiator', 'frozen', 'jurassic', 'godfather',
        'ghostbusters', 'batman', 'superman', 'wonderwoman', 'avengers'
    ],
    sports: [
        'football', 'basketball', 'tennis', 'baseball', 'volleyball',
        'soccer', 'hockey', 'cricket', 'rugby', 'golf',
        'swimming', 'boxing', 'skiing', 'surfing', 'skateboarding'
    ],
    technology: [
        'computer', 'internet', 'smartphone', 'robot', 'laptop',
        'bluetooth', 'wifi', 'tablet', 'keyboard', 'mouse',
        'printer', 'monitor', 'software', 'hardware', 'database'
    ],
    science: [
        'chemistry', 'biology', 'physics', 'astronomy', 'geology',
        'evolution', 'gravity', 'molecule', 'electron', 'ecosystem',
        'photosynthesis', 'climate', 'energy', 'planet', 'galaxy'
    ]
};

// Add power-up state variables
let powerUps = {
    freezeTime: { active: false, count: 3 },
    doublePoints: { active: false, count: 3 },
    skipWord: { count: 3 }
};

// Add custom word list handling
let customWordList = [];
let currentWordIndex = 0;

// Add speech synthesis
const speechSynthesis = window.speechSynthesis;
let currentTheme = 'light';

// Add accented characters
const accentedLetters = {
    'a': ['á', 'à', 'â', 'ä'],
    'e': ['é', 'è', 'ê', 'ë'],
    'i': ['í', 'ì', 'î', 'ï'],
    'o': ['ó', 'ò', 'ô', 'ö'],
    'u': ['ú', 'ù', 'û', 'ü'],
    'n': ['ñ'],
    'c': ['ç']
};

// Move music controls to TOP of script
const musicElements = {
    btn: document.getElementById('musicToggle'),
    audio: document.getElementById('backgroundMusic')
};

// Initialize music state
let isMusicEnabled = true;

if (musicElements.btn && musicElements.audio) {
    musicElements.btn.addEventListener('click', () => {
        if (musicElements.audio.paused || musicElements.audio.muted) {
            musicElements.audio.muted = false;
            musicElements.audio.play().catch(err => {
                console.log('Music play failed:', err);
                showNotification('Click again to start music', 'info');
            });
            musicElements.btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        } else {
            musicElements.audio.pause();
            musicElements.audio.muted = true;
            musicElements.btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        }
    });
}

// Wrap entire script in error boundary
try {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[DEBUG] DOM loaded, checking elements...');

        // Initialize save functionality
        initializeSaveButton();

        // Remove test button references
        console.log('[DEBUG] All elements:', {
            saveBtn: document.getElementById('saveWordBtn')
        });

        if (DEBUG) console.log('DOM loaded, initializing game...');
        
        // Initialize game elements
        if (gameElements.startGameBtn) {
            gameElements.startGameBtn.addEventListener('click', () => {
                if (DEBUG) console.log('Start button clicked');
                
                // Get the custom word input
                const wordInput = document.getElementById('wordInput');
                const customWord = wordInput?.value.trim();
                
                // If custom word exists and is valid, use it
                if (customWord && customWord.length > 0) {
                    // Validate word (only letters and spaces)
                    if (!/^[a-zA-Z\s]+$/.test(customWord)) {
                        showNotification('Word can only contain letters and spaces', 'error');
                        return;
                    }
                    
                    // Initialize game with custom word
                    initGame(customWord);
                    
                    // Clear the input
                    wordInput.value = '';
                    
                    showNotification('Starting game with custom word!', 'success');
                } else {
                    // Start game normally with category selection
                    initGame();
                }
            });
        }

        // Initialize keyboard controls
        document.addEventListener('keydown', (e) => {
            // Don't handle letter keys if any input/textarea is focused
            const activeElement = document.activeElement;
            const isInputFocused = activeElement.tagName === 'INPUT' || 
                                  activeElement.tagName === 'TEXTAREA';
            
            if (!isInputFocused && !gameOver && /^[a-z]$/.test(e.key.toLowerCase())) {
                handleGuess(e.key.toLowerCase());
            }
        });

        // Create initial keyboard
        createLetterButtons();
        
        if (DEBUG) console.log('Initial setup complete');

        // Add fullscreen event listeners
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', toggleFullscreen);
            document.addEventListener('fullscreenchange', updateFullscreenIcon);
            document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
            document.addEventListener('MSFullscreenChange', updateFullscreenIcon);
        }

        // Add hint button listener
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', handleHint);
        }

        // Add close handlers for modals
        document.querySelectorAll('.modal .close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    // Restart game if it was a victory or game over modal
                    if (modal.id === 'victoryModal' || modal.id === 'gameOverModal') {
                        initGame();
                    }
                }
            });
        });

        // Start custom list button
        const startCustomListBtn = document.getElementById('startCustomListBtn');
        if (startCustomListBtn) {
            startCustomListBtn.addEventListener('click', () => {
                if (DEBUG) console.log('Starting custom word list game...');
                if (customWordList.length === 0) {
                    showNotification('Please add words to your custom list first', 'error');
                    return;
                }
                startCustomWordList();
            });
        }

        // Generate link button
        const generateLinkBtn = document.getElementById('generateLinkBtn');
        if (generateLinkBtn) {
            generateLinkBtn.addEventListener('click', () => {
                if (DEBUG) console.log('Generating share link...');
                if (customWordList.length === 0) {
                    showNotification('Please add words to your custom list first', 'error');
                    return;
                }
                generateCustomLink();
            });
        }

        // Custom word list button
        const customListBtn = document.getElementById('customListBtn');
        if (customListBtn) {
            customListBtn.addEventListener('click', () => {
                const modal = document.getElementById('customListModal');
                if (modal) {
                    modal.style.display = 'flex';
                }
            });
        }

        // Add word to list
        const addToListBtn = document.getElementById('addToListBtn');
        const customWordInput = document.getElementById('customWordInput');
        
        if (addToListBtn && customWordInput) {
            addToListBtn.addEventListener('click', () => {
                const words = customWordInput.value
                    .split(/[,\n]+/)  // Split by commas or newlines
                    .map(word => word.trim())
                    .filter(word => word && word.length > 0);
                
                if (words.length > 0) {
                    let addedCount = 0;
                    words.forEach(word => {
                        if (!customWordList.includes(word)) {
                            customWordList.push(word);
                            addedCount++;
                        }
                    });
                    
                    updateCustomWordDisplay();
                    customWordInput.value = '';
                    customWordInput.focus();
                    
                    if (addedCount > 0) {
                        showNotification(`Added ${addedCount} word${addedCount === 1 ? '' : 's'} to the list`, 'success');
                    } else {
                        showNotification('All words were already in the list', 'info');
                    }
                }
            });

            // Enter key to add word(s)
            customWordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addToListBtn.click();
                }
            });

            // Paste functionality
            customWordInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedText = e.clipboardData.getData('text');
                const words = pastedText
                    .split(/[,\n\s]+/)  // Split by commas, newlines, or spaces
                    .map(word => word.trim())
                    .filter(word => word && word.length > 0);
                
                if (words.length === 0) {
                    showNotification('No valid words found in pasted text', 'error');
                    return;
                }

                let addedCount = 0;
                words.forEach(word => {
                    if (!customWordList.includes(word)) {
                        customWordList.push(word);
                        addedCount++;
                    }
                });

                updateCustomWordDisplay();
                customWordInput.value = '';
                showNotification(`Added ${addedCount} new word${addedCount === 1 ? '' : 's'}`, 'success');
            });
        }

        // Close custom list modal
        const closeCustomListBtn = document.querySelector('#customListModal .close-btn');
        if (closeCustomListBtn) {
            closeCustomListBtn.addEventListener('click', () => {
                const modal = document.getElementById('customListModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Instructions button
        const instructionsBtn = document.getElementById('instructionsBtn');
        if (instructionsBtn) {
            instructionsBtn.addEventListener('click', () => {
                const modal = document.getElementById('instructionsModal');
                if (modal) modal.style.display = 'flex';
            });
        }

        // Sound toggle button
        let soundEnabled = true;
        const soundToggleBtn = document.getElementById('soundToggleBtn');
        if (soundToggleBtn) {
            soundToggleBtn.addEventListener('click', () => {
                soundEnabled = !soundEnabled;
                const icon = soundToggleBtn.querySelector('i');
                if (icon) {
                    icon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
                }
                // Only mute sound effects, not music
                document.querySelectorAll('#correctSound, #wrongSound, #winSound, #loseSound, #powerupSound').forEach(audio => {
                    audio.muted = !soundEnabled;
                });
            });
        }

        // High scores button
        const highScoresBtn = document.getElementById('highScoresBtn');
        if (highScoresBtn) {
            highScoresBtn.addEventListener('click', () => {
                showHighScores();
            });
        }

        // Power-up button listeners
        const powerupButtons = [
            'freezeTimeBtn', 
            'doublePointsBtn', 
            'skipWordBtn'
        ];

        powerupButtons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', window[btn.replace('Btn', '')]);
            }
        });

        // Check URL for custom words on page load
        if (DEBUG) console.log('Checking URL for custom words...');
        checkForCustomWords();

        // Theme toggle
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }

        // Speak word button
        const speakWordBtn = document.getElementById('speakWordBtn');
        if (speakWordBtn) {
            speakWordBtn.addEventListener('click', () => speakWord(selectedWord));
        }

        // Share score button
        const shareScoreBtn = document.getElementById('shareScoreBtn');
        if (shareScoreBtn) {
            shareScoreBtn.addEventListener('click', shareScore);
        }

        // Initialize theme based on user preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('#themeToggleBtn i').className = 'fas fa-sun';
        }

        // Restart button
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                initGame();
                showNotification('Game restarted!', 'info');
            });
        }

        // Update the placeholder text for the input
        if (customWordInput) {
            customWordInput.placeholder = 'Type or paste words (e.g., cat, dog, bird)';
        }

        // Add music toggle button handler
        if (musicElements.btn) {
            musicElements.btn.addEventListener('click', () => {
                musicEnabled = !musicEnabled;
                musicElements.audio.muted = !musicEnabled;
                musicElements.btn.textContent = musicEnabled ? '🔊 Music' : '🔇 Music';
            });
        }

        // Add click handler for autoplay restrictions
        document.addEventListener('click', () => {
            if (musicEnabled && backgroundMusic.paused) {
                backgroundMusic.play().catch(err => console.log('Music play failed:', err));
            }
        }, { once: true });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseAllAudio();
            } else {
                if (musicEnabled && !musicElements.audio.paused) {
                    musicElements.audio.play().catch(console.error);
                }
            }
        });

        // Initialize music
        backgroundMusic.load();
        
        // Add user interaction handler to start music
        document.addEventListener('click', () => {
            if (musicEnabled && backgroundMusic.paused) {
                backgroundMusic.play()
                    .then(() => {
                        console.log('Music started successfully');
                    })
                    .catch(error => {
                        console.log('Music autoplay failed:', error);
                        showNotification('Click the music button to start playing', 'info');
                    });
            }
        }, { once: true });

        // Update music toggle button handler
        if (musicElements.btn) {
            musicElements.btn.addEventListener('click', () => {
                musicEnabled = !musicEnabled;
                musicElements.audio.muted = !musicEnabled;
                musicElements.btn.textContent = musicEnabled ? '🔊 Music' : '🔇 Music';
            });
        }

        // Add debug logs for elements
        console.log('Save button element:', gameElements.saveWordBtn);
        console.log('Word input element:', gameElements.wordInput);

        // Load saved word lists
        loadSavedWordLists();

        // Add auth state change listener to reload lists when user logs in/out
        supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                loadSavedWordLists();
            } else {
                savedWordLists = [];
                updateSavedWordListsDisplay();
            }
        });
    });

    // Initialize save functionality
    async function initializeSaveButton() {
        const saveBtn = document.getElementById('saveWordBtn');
        if (!saveBtn) {
            console.error('Save button not found');
            return;
        }

        saveBtn.addEventListener('click', async () => {
            const words = getCustomWords();
            if (!words || words.length === 0) {
                showNotification('Please add some words first', 'error');
                return;
            }

            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (!user) {
                showNotification('Please log in to save word lists', 'error');
                return;
            }

            try {
                const { error } = await supabase
                    .from('word_lists')
                    .insert([{
                        words,
                        user_id: user.id,
                        user_name: user.user_metadata?.name || 'Anonymous',
                        timestamp: new Date().toISOString(),
                        game_type: 'hangman',
                        list_name: 'Custom Word List'
                    }]);

                if (error) throw error;
                showNotification('Word list saved successfully!', 'success');
                loadSavedWordLists();
            } catch (error) {
                console.error('Error saving word list:', error);
                showNotification('Failed to save word list', 'error');
            }
        });
    }

    async function loadSavedWordLists() {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data: wordLists, error } = await supabase
                .from('word_lists')
                .select('*')
                .eq('user_id', user.id)
                .eq('game_type', 'hangman');

            if (error) throw error;
            savedWordLists = wordLists;
            updateSavedWordListsDisplay();
        } catch (error) {
            console.error('Error loading word lists:', error);
            showNotification('Failed to load word lists', 'error');
        }
    }

    function updateSavedWordListsDisplay() {
        const container = document.getElementById('savedWordLists');
        if (!container) return;

        if (!savedWordLists || savedWordLists.length === 0) {
            container.innerHTML = '<p class="empty-state">No saved word lists yet</p>';
            return;
        }

        container.innerHTML = savedWordLists.map(list => `
            <div class="word-list-item" data-id="${list.id}">
                <div class="word-info">
                    <span class="word-text">${list.list_name}</span>
                    <span class="word-meta">
                        ${list.words.length} words • Created ${new Date(list.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <div class="actions">
                    <button class="use-list-btn" onclick="useWordList('${list.id}')">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteWordList('${list.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async function useWordList(listId) {
        try {
            const { data: wordList, error } = await supabase
                .from('word_lists')
                .select('*')
                .eq('id', listId)
                .single();
            
            if (error) throw error;
            
            if (wordList?.words?.length > 0) {
                customWordList = wordList.words;
                currentGameMode = GAME_MODES.SAVED;
                startCustomWordList();
                showNotification(`Loaded word list: ${wordList.list_name}`, 'success');
            }
        } catch (error) {
            console.error('Error loading word list:', error);
            showNotification('Failed to load word list', 'error');
        }
    }

    async function deleteWordList(listId) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user) {
            showNotification('Please log in to delete word lists', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from('word_lists')
                .delete()
                .eq('id', listId)
                .eq('user_id', user.id); // Extra security check

            if (error) throw error;
            showNotification('Word list deleted successfully', 'success');
            loadSavedWordLists();
        } catch (error) {
            console.error('Error deleting word list:', error);
            showNotification('Failed to delete word list', 'error');
        }
    }

    function createLetterButtons() {
        if (!gameElements.lettersContainer) {
            console.error('Letters container not found!');
            return;
        }

        gameElements.lettersContainer.innerHTML = '';
        
        // Create main keyboard container
        const keyboardContainer = document.createElement('div');
        keyboardContainer.className = 'keyboard-grid';
        
        // Create regular letters in a proper keyboard layout
        const keyboardRows = [
            'qwertyuiop',
            'asdfghjkl',
            'zxcvbnm'
        ];
        
        keyboardRows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            
            row.split('').forEach(letter => {
                const button = document.createElement('button');
                button.textContent = letter;
                button.className = 'letter';
                button.addEventListener('click', () => handleGuess(letter));
                rowDiv.appendChild(button);
            });
            
            keyboardContainer.appendChild(rowDiv);
        });
        
        gameElements.lettersContainer.appendChild(keyboardContainer);

        // Add accented letters in a new row
        const accentedRow = document.createElement('div');
        accentedRow.className = 'accented-row';
        
        // Collect and sort all accented letters
        const allAccents = Object.values(accentedLetters).flat().sort();
        allAccents.forEach(accent => {
            const accentButton = document.createElement('button');
            accentButton.textContent = accent;
            accentButton.className = 'letter accent';
            accentButton.addEventListener('click', () => handleGuess(accent));
            accentedRow.appendChild(accentButton);
        });
        
        gameElements.lettersContainer.appendChild(accentedRow);
    }

    function initGame(customWord = null) {
        // If retrying after game over, use the last word
        if (gameOver && lastWord) {
            selectedWord = lastWord;
        } else if (customWord) {
            selectedWord = customWord;
        } else {
            // Normal word selection logic
            const category = gameElements.categorySelect.value;
            if (category === 'random') {
                const categories = Object.keys(wordCategories);
                const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                const words = wordCategories[randomCategory];
                selectedWord = words[Math.floor(Math.random() * words.length)];
            } else {
                const words = wordCategories[category];
                selectedWord = words[Math.floor(Math.random() * words.length)];
            }
        }
        
        // Reset game state
        displayWord = selectedWord.split('').map(char => char === ' ' ? '/' : '_').join('');
        wrongGuesses = 0;
        gameOver = false;
        timeElapsed = 0;
        
        // Reset hint button
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.classList.remove('used');
        }
        
        // Update display
        updateWordDisplay();
        
        // Reset and create keyboard
        createLetterButtons();
        
        // Clear canvas and draw initial state
        if (gameElements.canvas) {
            const ctx = gameElements.canvas.getContext('2d');
            const isFullscreen = document.fullscreenElement !== null;
            
            // Clear the entire canvas
            ctx.clearRect(0, 0, gameElements.canvas.width, gameElements.canvas.height);
            
            // Draw initial state (just the base)
            drawHangman(ctx, wrongGuesses, isFullscreen);
        }
        
        // Start timer
        clearInterval(gameTimer);
        gameTimer = setInterval(() => {
            timeElapsed++;
            if (gameElements.timer) {
                gameElements.timer.textContent = formatTime(timeElapsed);
            }
        }, 1000);
    }

    function handleGuess(letter) {
        if (DEBUG) console.log('Handling guess:', letter);
        if (gameOver || !selectedWord) return;
        
        const letterButtons = document.querySelectorAll('.letter');
        const letterButton = Array.from(letterButtons)
            .find(btn => btn.textContent.toLowerCase() === letter.toLowerCase());
        
        if (!letterButton || letterButton.classList.contains('used')) return;
        
        letterButton.classList.add('used');
        
        const letterIndices = [];
        selectedWord.split('').forEach((char, index) => {
            if (char.toLowerCase() === letter.toLowerCase()) {
                letterIndices.push(index);
            }
        });
        
        if (letterIndices.length > 0) {
            letterButton.classList.add('correct');
            playSound('correct');
            
            letterIndices.forEach(index => {
                const displayArray = displayWord.split('');
                displayArray[index] = selectedWord[index];
                displayWord = displayArray.join('');
            });
            
            gameElements.displayWord.textContent = displayWord.split('').map(char => 
                char === ' ' ? '   ' : char
            ).join(' ');
            
            if (!displayWord.includes('_')) {
                handleVictory();
            }
        } else {
            letterButton.classList.add('wrong');
            playSound('wrong');
            wrongGuesses++;
            
            const ctx = gameElements.canvas.getContext('2d');
            const isFullscreen = document.fullscreenElement !== null;
            drawHangman(ctx, wrongGuesses, isFullscreen);
            
            // Game over after 6 wrong guesses
            if (wrongGuesses >= 6) {
                setTimeout(() => {
                    handleGameOver();
                }, 500); // Small delay to let the final drawing complete
            }
        }
    }

    function updateWordDisplay(guessedLetter = null) {
        if (guessedLetter) {
            const wordArray = selectedWord.split('');
            const displayArray = displayWord.split('');
            
            wordArray.forEach((char, index) => {
                if (char.toLowerCase() === guessedLetter.toLowerCase()) {
                    displayArray[index] = selectedWord[index];
                }
            });
            
            displayWord = displayArray.join('');
        }
        
        // Display word with proper spacing and slashes
        const displayText = displayWord.split('').map(char => {
            if (char === '/') return ' / ';
            return char;
        }).join(' ');
        
        gameElements.displayWord.textContent = displayText;
    }

    function playSound(soundName) {
        const sound = document.getElementById(soundName + 'Sound');
        if (sound && !sound.muted) {
            sound.currentTime = 0;
            sound.play().catch(err => console.log('Sound play failed:', err));
        }
    }

    // Add drawHangman function
    function drawHangman(ctx, wrongGuesses, isFullscreen = false) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const scale = isFullscreen ? 1.5 : 1;
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = isFullscreen ? 4 : 3;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Calculate dimensions
        const baseWidth = width * 0.6;
        const baseHeight = height * 0.8;
        const startX = (width - baseWidth) / 2;
        const startY = height * 0.9;
        
        // Always draw base structure
        // Base
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + baseWidth, startY);
        ctx.stroke();
        
        // Vertical pole
        ctx.beginPath();
        ctx.moveTo(startX + baseWidth * 0.25, startY);
        ctx.lineTo(startX + baseWidth * 0.25, startY - baseHeight);
        ctx.stroke();
        
        // Horizontal beam
        ctx.beginPath();
        ctx.moveTo(startX + baseWidth * 0.25, startY - baseHeight);
        ctx.lineTo(startX + baseWidth * 0.75, startY - baseHeight);
        ctx.stroke();
        
        // Rope
        ctx.beginPath();
        ctx.moveTo(startX + baseWidth * 0.75, startY - baseHeight);
        ctx.lineTo(startX + baseWidth * 0.75, startY - baseHeight * 0.8);
        ctx.stroke();
        
        // Store body points for reference
        const headBottom = startY - baseHeight * 0.8 + (isFullscreen ? 60 : 40);
        const bodyLength = isFullscreen ? 120 : 80;
        const bodyBottom = headBottom + bodyLength;
        const bodyCenter = startX + baseWidth * 0.75;
        
        // Draw body parts based on wrong guesses
        if (wrongGuesses >= 1) {
            // Head
            const headRadius = isFullscreen ? 30 : 20;
            ctx.beginPath();
            ctx.arc(bodyCenter, startY - baseHeight * 0.8 + headRadius, 
                    headRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (wrongGuesses >= 2) {
            // Body
            ctx.beginPath();
            ctx.moveTo(bodyCenter, headBottom);
            ctx.lineTo(bodyCenter, bodyBottom);
            ctx.stroke();
        }
        
        if (wrongGuesses >= 3) {
            // Left arm
            const armLength = isFullscreen ? 60 : 40;
            const shoulderY = headBottom + (isFullscreen ? 35 : 25);
            ctx.beginPath();
            ctx.moveTo(bodyCenter, shoulderY);
            ctx.lineTo(bodyCenter - armLength, shoulderY + (isFullscreen ? 30 : 20));
            ctx.stroke();
        }
        
        if (wrongGuesses >= 4) {
            // Right arm
            const armLength = isFullscreen ? 60 : 40;
            const shoulderY = headBottom + (isFullscreen ? 35 : 25);
            ctx.beginPath();
            ctx.moveTo(bodyCenter, shoulderY);
            ctx.lineTo(bodyCenter + armLength, shoulderY + (isFullscreen ? 30 : 20));
            ctx.stroke();
        }
        
        if (wrongGuesses >= 5) {
            // Left leg
            const legLength = isFullscreen ? 75 : 50;
            ctx.beginPath();
            ctx.moveTo(bodyCenter, bodyBottom);
            ctx.lineTo(bodyCenter - legLength, bodyBottom + legLength);
            ctx.stroke();
        }
        
        if (wrongGuesses >= 6) {
            // Right leg
            const legLength = isFullscreen ? 75 : 50;
            ctx.beginPath();
            ctx.moveTo(bodyCenter, bodyBottom);
            ctx.lineTo(bodyCenter + legLength, bodyBottom + legLength);
            ctx.stroke();
        }
    }

    // Add victory and game over handling
    function handleVictory() {
        if (gameOver) return;
        gameOver = true;
        clearInterval(gameTimer);
        
        wins++;
        currentStreak++;
        if (gameElements.wins) gameElements.wins.textContent = wins;
        if (gameElements.streak) gameElements.streak.textContent = `Streak: ${currentStreak}`;
        
        playSound('win');
        showConfetti();
        
        // Different handling for custom word list mode
        if (customWordList.length > 0) {
            handleCustomWordVictory();
        } else {
            handleRegularVictory();
        }
    }

    function handleRegularVictory() {
        const victoryModal = document.getElementById('victoryModal');
        if (!victoryModal) return;
        
        const stats = victoryModal.querySelector('#victoryStats');
        if (stats) {
            stats.innerHTML = `
                <p>Word: ${selectedWord}</p>
                <p>Time: ${formatTime(timeElapsed)}</p>
                <p>Wrong guesses: ${wrongGuesses}</p>
                <p>Current streak: ${currentStreak}</p>
            `;
        }
        
        // Set up next word button
        const nextWordBtn = victoryModal.querySelector('#nextWordBtn');
        if (nextWordBtn) {
            nextWordBtn.onclick = () => {
                victoryModal.style.display = 'none';
                startNewRound();
            };
        }
        
        victoryModal.style.display = 'flex';
    }

    function handleCustomWordVictory() {
        const customVictoryModal = document.getElementById('customVictoryModal');
        if (!customVictoryModal) return;
        
        const isLastWord = currentWordIndex >= customWordList.length - 1;
        const modalContent = customVictoryModal.querySelector('.modal-content');
        
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="victory-header">
                    <h2><i class="fas fa-crown"></i> ¡Victoria!</h2>
                    <div class="confetti-container"></div>
                </div>
                <div class="victory-stats">
                    <div id="customVictoryStats">
                        <p>Word: ${selectedWord}</p>
                        <p>Time: ${formatTime(timeElapsed)}</p>
                        <p>Wrong guesses: ${wrongGuesses}</p>
                        <p>Current streak: ${currentStreak}</p>
                    </div>
                    <div class="victory-buttons">
                        ${!isLastWord ? `
                            <button id="customNextWordBtn" class="btn next-word-btn">
                                <i class="fas fa-forward"></i> Next Word (${currentWordIndex + 1}/${customWordList.length})
                            </button>
                        ` : `
                            <button id="customPlayAgainBtn" class="btn next-word-btn">
                                <i class="fas fa-redo"></i> Play Again
                            </button>
                        `}
                    </div>
                </div>
            `;
            
            // Set up button event listeners
            const nextWordBtn = modalContent.querySelector('#customNextWordBtn');
            const playAgainBtn = modalContent.querySelector('#customPlayAgainBtn');
            
            if (nextWordBtn) {
                nextWordBtn.onclick = () => {
                    customVictoryModal.style.display = 'none';
                    startNextWord();
                };
            }
            
            if (playAgainBtn) {
                playAgainBtn.onclick = () => {
                    customVictoryModal.style.display = 'none';
                    currentWordIndex = 0;
                    startNewRound();
                };
            }
        }
        
        customVictoryModal.style.display = 'flex';
    }

    function handleGameOver() {
        if (gameOver) return;
        
        gameOver = true;
        clearInterval(gameTimer);
        playSound('lose');
        
        losses++;
        currentStreak = 0;
        lastWord = selectedWord;
        
        if (gameElements.losses) gameElements.losses.textContent = losses;
        if (gameElements.streak) gameElements.streak.textContent = 'Streak: 0';
        
        if (customWordList.length > 0) {
            handleCustomGameOver();
        } else {
            handleRegularGameOver();
        }
    }

    function handleRegularGameOver() {
        const gameOverModal = document.getElementById('gameOverModal');
        if (!gameOverModal) return;
        
        const modalContent = gameOverModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="modal-header">
                    <h2><i class="fas fa-skull"></i> Game Over</h2>
                </div>
                <div class="modal-stats">
    
                    <p>Time: ${formatTime(timeElapsed)}</p>
                    <p>Wrong guesses: ${wrongGuesses}</p>
                </div>
                <div class="modal-buttons">
                    <button id="nextWordBtn" class="btn next-word-btn">
                        <i class="fas fa-forward"></i> Next Word
                    </button>
                </div>
            `;
            
            // Set up next word button
            const nextWordBtn = modalContent.querySelector('#nextWordBtn');
            if (nextWordBtn) {
                nextWordBtn.onclick = () => {
                    gameOverModal.style.display = 'none';
                    startNewRound(); // Start a new round with a new word
                };
            }
        }
        
        gameOverModal.style.display = 'flex';
    }

    function handleCustomGameOver() {
        const customGameOverModal = document.getElementById('customGameOverModal');
        if (!customGameOverModal) return;
        
        const isLastWord = currentWordIndex >= customWordList.length - 1;
        const modalContent = customGameOverModal.querySelector('.modal-content');
        
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="modal-header">
                    <h2><i class="fas fa-skull"></i> Game Over</h2>
                </div>
                <div class="modal-stats">
               
                    <p>Time: ${formatTime(timeElapsed)}</p>
                    <p>Wrong guesses: ${wrongGuesses}</p>
                </div>
                <div class="modal-buttons">
                    ${!isLastWord ? `
                        <button id="customNextWordBtn" class="btn next-word-btn">
                            <i class="fas fa-forward"></i> Next Word (${currentWordIndex + 1}/${customWordList.length})
                        </button>
                    ` : `
                        <button id="customPlayAgainBtn" class="btn next-word-btn">
                            <i class="fas fa-redo"></i> Play Again
                        </button>
                    `}
                </div>
            `;
            
            // Set up button event listeners
            const nextWordBtn = modalContent.querySelector('#customNextWordBtn');
            const playAgainBtn = modalContent.querySelector('#customPlayAgainBtn');
            
            if (nextWordBtn) {
                nextWordBtn.onclick = () => {
                    customGameOverModal.style.display = 'none';
                    startNextWord(); // Move to next word in sequence
                };
            }
            
            if (playAgainBtn) {
                playAgainBtn.onclick = () => {
                    customGameOverModal.style.display = 'none';
                    currentWordIndex = 0;
                    startNewRound(); // Start over from beginning
                };
            }
        }
        
        customGameOverModal.style.display = 'flex';
    }

    function startNewRound() {
        // Close any open modals
        const modals = [
            'gameOverModal',
            'victoryModal',
            'customGameOverModal',
            'customVictoryModal'
        ];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) modal.style.display = 'none';
        });
        
        // Reset game state
        gameOver = false;
        wrongGuesses = 0;
        timeElapsed = 0;
        
        // Start new game
        initGame();
    }

    function startNextWord() {
        if (customWordList.length > 0) {
            currentWordIndex++;
            if (currentWordIndex >= customWordList.length) {
                // Show game complete screen when we've gone through all words
                showGameComplete();
                return;
            }
            // Start next word from custom list
            selectedWord = customWordList[currentWordIndex];
            initGame(selectedWord);
        } else {
            // Regular game mode - get random word
            startNewRound();
        }
    }

    function showGameComplete() {
        const gameCompleteScreen = document.createElement('div');
        gameCompleteScreen.className = 'game-complete-screen';
        
        const totalWords = customWordList.length;
        const correctWords = wins;
        
        gameCompleteScreen.innerHTML = `
            <h2>Game Complete!</h2>
            <p>Well done! You guessed ${correctWords} out of ${totalWords} words correctly!</p>
            <p>Final streak: ${currentStreak}</p>
            <button class="btn next-word-btn" onclick="startNewRound()">
                <i class="fas fa-redo"></i> Play Again
            </button>
        `;
        
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            const mainContent = gameContainer.innerHTML;
            gameContainer.innerHTML = '';
            gameContainer.appendChild(gameCompleteScreen);
            
            // Add event listener to restore game container when playing again
            const playAgainBtn = gameCompleteScreen.querySelector('button');
            if (playAgainBtn) {
                playAgainBtn.onclick = () => {
                    gameContainer.innerHTML = mainContent;
                    currentWordIndex = 0;
                    startNewRound();
                };
            }
        }
    }

    function closeCustomModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function closeModal(modalId = 'victoryModal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
            // Reset game state if needed
            if (modalId === 'victoryModal') {
                resetGame();
            }
        }
    }

    // Update getRandomWord function
    function getRandomWord(category = 'random') {
        if (category === 'random') {
            // Get random category
            const categories = Object.keys(wordCategories);
            category = categories[Math.floor(Math.random() * categories.length)];
        }
        
        const words = wordCategories[category];
        if (!words || words.length === 0) {
            console.error('No words found for category:', category);
            return null;
        }
        
        return words[Math.floor(Math.random() * words.length)];
    }

    // Add high scores functionality
    function showHighScores() {
        const highScoresModal = document.getElementById('highScoresModal');
        if (highScoresModal) {
            const stats = highScoresModal.querySelector('#highScoresList');
            if (stats) {
                stats.innerHTML = `
                    <div class="high-score">
                        <p>Current Streak: ${currentStreak}</p>
                        <p>Total Wins: ${wins}</p>
                        <p>Total Losses: ${losses}</p>
                    </div>
                `;
            }
            highScoresModal.style.display = 'flex';
        }
    }

    // Power-up functions
    function freezeTime() {
        if (powerUps.freezeTime.count <= 0 || powerUps.freezeTime.active) return;
        
        powerUps.freezeTime.count--;
        powerUps.freezeTime.active = true;
        playSound('powerup');
        
        // Update button state
        const freezeBtn = document.getElementById('freezeTimeBtn');
        if (freezeBtn) {
            freezeBtn.classList.add('active');
            freezeBtn.innerHTML = `<i class="fas fa-snowflake"></i><span>${powerUps.freezeTime.count}</span>`;
        }
        
        // Stop timer for 10 seconds
        clearInterval(gameTimer);
        setTimeout(() => {
            powerUps.freezeTime.active = false;
            if (!gameOver) startTimer();
            if (freezeBtn) {
                freezeBtn.classList.remove('active');
            }
        }, 10000);
    }

    function doublePoints() {
        if (powerUps.doublePoints.count <= 0 || powerUps.doublePoints.active) return;
        
        powerUps.doublePoints.count--;
        powerUps.doublePoints.active = true;
        playSound('powerup');
        
        // Update button state
        const doubleBtn = document.getElementById('doublePointsBtn');
        if (doubleBtn) {
            doubleBtn.classList.add('active');
            doubleBtn.innerHTML = `<i class="fas fa-times-circle">2x</i><span>${powerUps.doublePoints.count}</span>`;
        }
        
        // Double points for 15 seconds
        setTimeout(() => {
            powerUps.doublePoints.active = false;
            if (doubleBtn) {
                doubleBtn.classList.remove('active');
            }
        }, 15000);
    }

    function skipWord() {
        if (powerUps.skipWord.count <= 0) return;
        
        powerUps.skipWord.count--;
        playSound('powerup');
        
        // Update button state
        const skipBtn = document.getElementById('skipWordBtn');
        if (skipBtn) {
            skipBtn.innerHTML = `<i class="fas fa-forward"></i><span>${powerUps.skipWord.count}</span>`;
        }
        
        // Start new game with new word
        initGame();
    }

    // Add power-up display update function
    function updatePowerUpDisplays() {
        const freezeBtn = document.getElementById('freezeTimeBtn');
        const doubleBtn = document.getElementById('doublePointsBtn');
        const skipBtn = document.getElementById('skipWordBtn');
        
        if (freezeBtn) {
            freezeBtn.innerHTML = `<i class="fas fa-snowflake"></i><span>${powerUps.freezeTime.count}</span>`;
            freezeBtn.disabled = powerUps.freezeTime.count <= 0;
        }
        
        if (doubleBtn) {
            doubleBtn.innerHTML = `<i class="fas fa-times-circle">2x</i><span>${powerUps.doublePoints.count}</span>`;
            doubleBtn.disabled = powerUps.doublePoints.count <= 0;
        }
        
        if (skipBtn) {
            skipBtn.innerHTML = `<i class="fas fa-forward"></i><span>${powerUps.skipWord.count}</span>`;
            skipBtn.disabled = powerUps.skipWord.count <= 0;
        }
    }

    function showShareLinkModal(shareUrl) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'shareLinkModal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Share Link</h2>
                <div class="share-link-container">
                    <input type="text" id="shareLinkInput" value="${shareUrl}" readonly />
                    <button onclick="copyShareLink()" class="btn primary-btn">Copy</button>
                </div>
                <button class="close-btn" onclick="this.closest('.modal').remove()">×</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    function copyShareLink() {
        const input = document.getElementById('shareLinkInput');
        if (!input) return;
        
        input.select();
        input.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            showNotification('Share link copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy using execCommand:', err);
            showNotification('Failed to copy link', 'error');
        }
    }

    function generateCustomLink() {
        if (DEBUG) console.log('Generating share link for words:', customWordList);
        
        if (customWordList.length === 0) {
            showNotification('Please add words to your custom list first', 'error');
            return;
        }
        
        try {
            const baseUrl = window.location.href.split('?')[0];
            // Double encode to handle special characters properly
            const encodedWords = encodeURIComponent(btoa(encodeURIComponent(JSON.stringify(customWordList))));
            const shareUrl = `${baseUrl}?words=${encodedWords}`;
            
            if (DEBUG) console.log('Share URL:', shareUrl);
            
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    showNotification('Share link copied to clipboard!', 'success');
                })
                .catch(() => {
                    showShareLinkModal(shareUrl);
                });
        } catch (error) {
            console.error('Error generating share link:', error);
            showNotification('Failed to generate share link', 'error');
        }
    }

    function checkForCustomWords() {
        if (DEBUG) console.log('Checking URL for custom words...');
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const encodedWords = urlParams.get('words');
            
            if (encodedWords) {
                if (DEBUG) console.log('Found encoded words:', encodedWords);
                
                // Double decode to handle special characters properly
                const decodedWords = JSON.parse(decodeURIComponent(atob(decodeURIComponent(encodedWords))));
                if (Array.isArray(decodedWords) && decodedWords.length > 0) {
                    customWordList = decodedWords;
                    if (DEBUG) console.log('Loaded custom words:', customWordList);
                    
                    // Start the game with the custom words
                    startCustomWordList();
                    showNotification(`Loaded ${decodedWords.length} custom words!`, 'success');
                }
            }
        } catch (error) {
            console.error('Failed to parse custom words:', error);
            showNotification('Failed to load custom words from link', 'error');
        }
    }

    function startCustomWordList() {
        if (DEBUG) console.log('Starting custom word list game with words:', customWordList);
        
        if (!customWordList || customWordList.length === 0) {
            showNotification('Please add words to your custom list first', 'error');
            return;
        }

        // Reset game state
        currentWordIndex = 0;
        wins = 0;
        losses = 0;
        currentStreak = 0;
        
        // Start with first word
        selectedWord = customWordList[currentWordIndex];
        initGame(selectedWord);

        // Hide the settings/input section and show the game area
        const gameSettings = document.querySelector('.game-settings');
        const gamePlayArea = document.querySelector('.game-play-area');
        if (gameSettings) gameSettings.style.display = 'none';
        if (gamePlayArea) gamePlayArea.style.display = 'grid';

        // Close the custom list modal if it's open
        const customListModal = document.getElementById('customListModal');
        if (customListModal) {
            customListModal.style.display = 'none';
        }

        showNotification(`Starting game with ${customWordList.length} words!`, 'success');
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function toggleTheme() {
        const root = document.documentElement;
        const icon = document.querySelector('#themeToggleBtn i');
        
        if (root.getAttribute('data-theme') === 'dark') {
            root.removeAttribute('data-theme');
            icon.className = 'fas fa-moon';
        } else {
            root.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
        }
    }

    function speakWord(word) {
        if (!speechSynthesis) {
            showNotification('Text-to-speech is not supported in your browser', 'error');
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'es-ES'; // Set Spanish language
        utterance.rate = 0.8; // Slightly slower rate for better clarity
        speechSynthesis.speak(utterance);
    }

    function shareScore() {
        const score = document.getElementById('currentScore').textContent;
        const shareText = `🎮 I just scored ${score} points in Ultimate Hangman Challenge! Can you beat my score? 🏆`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Ultimate Hangman Challenge',
                text: shareText,
                url: window.location.origin + window.location.pathname
            }).catch(console.error);
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText + ' ' + window.location.href)
                .then(() => showNotification('Score copied to clipboard!', 'success'))
                .catch(() => showNotification('Failed to copy score', 'error'));
        }
    }

    function handleHint() {
        if (!selectedWord || gameOver) return;
        
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn.classList.contains('used')) {
            showNotification('Hint already used!', 'info');
            return;
        }
        
        // Get all unguessed letters in the word (excluding spaces)
        const unguessedIndices = selectedWord.split('')
            .map((char, index) => char !== ' ' && displayWord[index] === '_' ? index : -1)
            .filter(index => index !== -1);
        
        if (unguessedIndices.length === 0) {
            showNotification('No more letters to reveal!', 'info');
            return;
        }

        // Select a random unguessed letter position
        const randomIndex = unguessedIndices[Math.floor(Math.random() * unguessedIndices.length)];
        const hintLetter = selectedWord[randomIndex];
        
        // Find and update the letter button
        const letterButtons = document.querySelectorAll('.letter');
        const letterButton = Array.from(letterButtons)
            .find(btn => btn.textContent.toLowerCase() === hintLetter.toLowerCase());
        
        if (letterButton) {
            letterButton.classList.add('used', 'correct');
            
            // Update the display word
            const displayArray = displayWord.split('');
            displayArray[randomIndex] = selectedWord[randomIndex]; // Use original case
            displayWord = displayArray.join('');
            
            // Update display with proper spacing
            gameElements.displayWord.textContent = displayWord.split('').map(char => 
                char === ' ' ? '   ' : char
            ).join(' ');
            
            playSound('correct');
            
            // Mark hint as used
            hintBtn.classList.add('used');
        }
        
        // Check for win condition
        if (!displayWord.includes('_')) {
            handleVictory();
        }
    }

    // Add formatTime function
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function updateCustomWordDisplay() {
        const customWordDisplay = document.getElementById('customWordDisplay');
        if (!customWordDisplay) return;
        
        // Clear existing display
        customWordDisplay.innerHTML = '';
        
        // Display the word list
        customWordList.forEach((word, index) => {
            const wordItem = document.createElement('div');
            wordItem.className = 'word-item';
            wordItem.innerHTML = `
                <span>${word}</span>
                <button class="remove-word-btn" onclick="removeCustomWord(${index})" title="Remove word">×</button>
            `;
            customWordDisplay.appendChild(wordItem);
        });
    }

    function removeCustomWord(index) {
        customWordList.splice(index, 1);
        updateCustomWordDisplay();
    }

    function copyWord(index) {
        const word = customWordList[index];
        navigator.clipboard.writeText(word)
            .then(() => showNotification(`Copied: ${word}`, 'success'))
            .catch(() => showNotification('Failed to copy word', 'error'));
    }

    function getCustomWords() {
        const input = document.getElementById('wordInput'); // Verify matching ID
        console.log('[INPUT] Raw value:', input?.value); // Add this line
        
        // Existing logic
        return input?.value
            ?.split(/[,]+/).filter(Boolean)
            ?.map(word => word.trim()) || [];
    }

    // Later in file - actual implementation
    window.initializeNewWord = function(word) {
        // ... your existing implementation ...
    };

    // Add this with other game initialization variables
    const CONFETTI_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];

    // Add this function with other game effect functions
    function showConfetti() {
        const container = document.querySelector('.confetti-container');
        if (!container) return;

        // Clear previous confetti
        container.innerHTML = '';

        // Create 50 confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 1 + 's';
            container.appendChild(confetti);

            // Remove element after animation
            confetti.addEventListener('animationend', () => {
                confetti.remove();
            });
        }
    }

    // Add this function to handle audio pausing
    function pauseAllAudio() {
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
        });
    }

    // Add this at the top level of your script (not inside any other function)
    window.closeModal = function(modalId = 'victoryModal') {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
            // Reset game state if needed
            if (modalId === 'victoryModal') {
                resetGame();
            }
        }
    };

    // Add this with other game initialization functions
    window.resetGame = function(preserveWord = false) {
        if (guessedLetters) guessedLetters = [];
        mistakes = 0;
        gameOver = false;

        // Safe DOM manipulation
        if (gameElements.wordDisplay) gameElements.wordDisplay.innerHTML = '';
        if (gameElements.guessedLettersDisplay) gameElements.guessedLettersDisplay.textContent = '';
        if (gameElements.hangmanImage) gameElements.hangmanImage.src = `images/hangman-0.png`;
        if (gameElements.messageDisplay) gameElements.messageDisplay.textContent = '';

        document.querySelectorAll('.letter-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('disabled');
        });

        if (!preserveWord) {
            currentWord = '';
        }
    };

    // Update your "Next Word" button handler
    document.getElementById('nextWordBtn').addEventListener('click', () => {
        resetGame();
        startNewGame(); // If you have this function
    });
} catch (error) {
    console.error('Script initialization failed:', error);
    alert('Critical error: ' + error.message);
}