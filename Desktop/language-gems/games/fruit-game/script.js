// Game Constants
const VOCABULARY_DATA = [];

const GAME_SETTINGS = {
  TIMED_MODE_DURATION: 60, // 1 minute for timed mode
  MIN_CUSTOM_WORDS: 2,
  GEM_COLORS: ["#E74C3C", "#F1C40F", "#E67E22", "#2ECC71", "#9B59B6", "#3498DB"],
  HINT_COST: 1, // Points deducted for using a hint
  STREAK_THRESHOLD: 3 // Consecutive matches needed for streak bonus
};

// Game State
let gameState = {
  mode: "normal",  // Default mode is normal
  score: 0,
  correctMatches: 0,
  hintCount: 3,
  timeElapsed: 0,
  timeLeft: GAME_SETTINGS.TIMED_MODE_DURATION,
  streak: 0,
  customWords: [],
  timer: null,
  activeDraggable: null,
  droppedAnswers: new Map(),
  audioContext: null,
  sounds: null
};

// Theme functionality
const themes = [
    { name: 'Forest', path: '../assets/backgrounds/forest.jpg' },
    { name: 'Cave', path: '../assets/backgrounds/cave.jpg' },
    { name: 'Classroom', path: '../assets/backgrounds/classroom.jpg' },
    { name: 'Spanish Theme', path: '../assets/backgrounds/everything spanish.jpg' },
    { name: 'Temple', path: '../assets/backgrounds/temple_of_chaos.jpg' },
    { name: 'French Theme', path: '../assets/backgrounds/everything france.jpg' }
];

let currentTheme = null;

function showThemeModal() {
    const modal = document.getElementById('themeModal');
    const themeGrid = document.getElementById('themeGrid');
    themeGrid.innerHTML = '';

    themes.forEach(theme => {
        const themeOption = document.createElement('div');
        themeOption.className = 'theme-option';
        if (currentTheme === theme.path) {
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
        themeGrid.appendChild(themeOption);

        themeOption.addEventListener('click', () => setTheme(theme.path));
    });

    modal.style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function setTheme(themePath) {
    currentTheme = themePath;
    
    // Hide the default background elements when a theme is applied
    const gameBg = document.querySelector('.game-background');
    if (gameBg) {
        gameBg.style.display = 'none';
    }
    
    const gameWrapper = document.querySelector('.game-wrapper');
    if (gameWrapper) {
        gameWrapper.style.backgroundImage = `url(${themePath})`;
        gameWrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        gameWrapper.style.backgroundBlendMode = 'overlay';
        gameWrapper.style.backgroundSize = 'cover';
        gameWrapper.style.backgroundPosition = 'center';
    }
    
    localStorage.setItem('fruitGameTheme', themePath);

    // Update selected state in theme grid
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        option.classList.toggle('selected', option.querySelector('img').src === themePath);
    });
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('fruitGameTheme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        // Show default background if no theme is saved
        const gameBg = document.querySelector('.game-background');
        if (gameBg) {
            gameBg.style.display = 'block';
        }
    }
}

async function handleThemeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const reader = new FileReader();
        reader.onload = (e) => {
            const customThemePath = e.target.result;
            setTheme(customThemePath);
            
            // Add the custom theme to the themes array
            themes.push({
                name: 'Custom Theme',
                path: customThemePath
            });
            
            // Refresh the theme grid
            showThemeModal();
        };
        reader.readAsDataURL(file);
    } catch (error) {
        console.error('Error uploading theme:', error);
        alert('Failed to upload theme image. Please try again.');
    }
}

// DOM Elements
const elements = {
  gameBoard: document.getElementById("gameBoard"),
  answers: document.getElementById("answers"),
  scoreDisplay: document.getElementById("score"),
  totalPairsDisplay: document.getElementById("totalPairs"),
  timerDisplay: document.getElementById("timer"),
  hintCount: document.getElementById("hintCount"),
  modalOverlay: document.getElementById("modalOverlay"),
  customWordsModal: document.getElementById("customWordsModal"),
  timeSelectModal: document.getElementById("timeSelectModal"),
  spanishInput: document.getElementById("spanishInput"),
  englishInput: document.getElementById("englishInput"),
  addWordBtn: document.getElementById("addWordBtn"),
  importWordsBtn: document.getElementById("importWordsBtn"),
  startGameBtn: document.getElementById("startGameBtn"),
  wordList: document.getElementById("wordList"),
  fullscreenBtn: document.getElementById("fullscreenBtn")
};

class WordMatchGame {
    constructor() {
        this.gameId = Date.now().toString();
        this.score = 0;
        this.totalPairs = 0;
        this.hintsRemaining = 3;
        this.selectedCards = [];
        this.matchedPairs = new Set();
        this.gameMode = 'normal';
        this.timeLimit = 0;
        this.timer = null;
        this.customWords = [];
        this.setupEventListeners();
        this.loadGameState();
    }

    setupEventListeners() {
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.id === 'homeBtn') {
                    window.location.href = '../index.html';
                    return;
                }
                if (btn.id === 'fullscreenBtn') {
                    this.toggleFullscreen();
                    return;
                }
                const mode = btn.dataset.mode;
                if (mode) {
                    this.setGameMode(mode);
                }
            });
        });

        // Save game state before unload
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });

        // Listen for save game state events
        window.addEventListener('saveGameState', () => {
            this.saveGameState();
        });

        // Listen for resume game events
        window.addEventListener('resumeGame', (e) => {
            if (e.detail.game === 'wordMatch' && e.detail.gameId === this.gameId) {
                this.resumeGame(e.detail.state);
            }
        });
    }

    setGameMode(mode) {
        this.gameMode = mode;
        this.resetGame();

        switch (mode) {
            case 'timed':
                this.showTimeSelectModal();
                break;
            case 'custom':
                this.showCustomWordsModal();
                break;
            default:
                this.startGame();
        }
    }

    startGame() {
        this.clearBoard();
        this.score = 0;
        this.updateScore();
        
        const words = this.gameMode === 'custom' ? this.customWords : this.getDefaultWords();
        this.totalPairs = words.length;
        document.getElementById('totalPairs').textContent = this.totalPairs;
        
        this.createBoard(words);
        
        if (this.gameMode === 'timed' && this.timeLimit > 0) {
            this.startTimer();
        }

        // Notify progress tracker
        window.dispatchEvent(new CustomEvent('gameStarted', {
            detail: {
                game: 'wordMatch',
                mode: this.gameMode
            }
        }));
    }

    resumeGame(state) {
        this.gameMode = state.gameMode;
        this.score = state.score;
        this.totalPairs = state.totalPairs;
        this.hintsRemaining = state.hintsRemaining;
        this.matchedPairs = new Set(state.matchedPairs);
        this.timeLimit = state.timeLimit;
        this.customWords = state.customWords;

        this.updateScore();
        document.getElementById('totalPairs').textContent = this.totalPairs;
        document.getElementById('hintCount').textContent = this.hintsRemaining;

        if (this.gameMode === 'timed' && state.timeRemaining > 0) {
            this.timeLimit = state.timeRemaining;
            this.startTimer();
        }

        this.createBoard(state.words, state.matchedPairs);
    }

    saveGameState() {
        const state = {
            gameId: this.gameId,
            gameMode: this.gameMode,
            score: this.score,
            totalPairs: this.totalPairs,
            hintsRemaining: this.hintsRemaining,
            matchedPairs: Array.from(this.matchedPairs),
            timeLimit: this.timeLimit,
            timeRemaining: this.timeLimit - (this.timer ? this.getElapsedTime() : 0),
            customWords: this.customWords,
            words: this.getVisibleWords()
        };

        // Save game state
        window.gameStateManager.saveGameState('wordMatch', this.gameId, state);

        // Update progress
        this.updateProgress();
    }

    loadGameState() {
        const state = window.gameStateManager.loadGameState('wordMatch', this.gameId);
        if (state) {
            this.resumeGame(state);
        }
    }

    updateProgress() {
        // Calculate progress percentage
        const progressPercentage = (this.score / (this.totalPairs * 2)) * 100;

        // Update progress tracker
        window.dispatchEvent(new CustomEvent('gameProgress', {
            detail: {
                game: 'wordMatch',
                score: this.score,
                totalPossible: this.totalPairs * 2,
                percentage: progressPercentage
            }
        }));

        // Check for achievements
        if (this.score === this.totalPairs * 2) {
            window.dispatchEvent(new CustomEvent('gameCompleted', {
                detail: {
                    game: 'wordMatch',
                    score: this.score,
                    perfect: this.score === this.totalPairs * 2
                }
            }));
        }
    }

    handleMatch(card1, card2) {
        this.score += 2;
        this.updateScore();
        
        this.matchedPairs.add(card1.dataset.word);
        card1.classList.add('matched');
        card2.classList.add('matched');
        
        // Play success sound
        document.getElementById('correctSound')?.play();
        
        if (this.matchedPairs.size === this.totalPairs) {
            this.handleGameComplete();
        }
    }

    handleGameComplete() {
        const perfect = this.score === this.totalPairs * 2;
        const timeBonusPoints = this.calculateTimeBonus();
        this.score += timeBonusPoints;
        this.updateScore();

        // Stop timer if it's running
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // Show completion message
        setTimeout(() => {
            alert(`Congratulations! You've completed the game!\nFinal Score: ${this.score}${timeBonusPoints ? `\nTime Bonus: +${timeBonusPoints}` : ''}`);
        }, 500);

        // Update progress and achievements
        window.dispatchEvent(new CustomEvent('gameCompleted', {
            detail: {
                game: 'wordMatch',
                score: this.score,
                perfect: perfect,
                timeBonus: timeBonusPoints
            }
        }));
    }

    // ... rest of existing code ...
}

// Initialize game
const game = new WordMatchGame();

// Game Board Creation
function createGameBoard() {

  const words = shuffleArray([...getCurrentWordSet()]);
  
  words.forEach(word => {
    const cell = createCell(word);
    elements.gameBoard.appendChild(cell);
  });
}

function createCell(word) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.spanish = word.spanish;
  cell.style.setProperty('--gem-color', word.gemColor);
  
  // Create a container for the Spanish word
  const spanishWord = document.createElement("div");
  spanishWord.classList.add("spanish-word");
  spanishWord.textContent = word.spanish;
  cell.appendChild(spanishWord);
  
  cell.addEventListener("dragover", handleDragOver);
  cell.addEventListener("dragleave", handleDragLeave);
  cell.addEventListener("drop", handleDrop);
  
  return cell;
}

function createAnswerOptions() {
  
  const words = shuffleArray([...getCurrentWordSet()]);
  
  words.forEach(word => {
    const answer = createDraggable(word);
    elements.answers.appendChild(answer);
  });
}

function createDraggable(word) {
  const draggable = document.createElement("div");
  draggable.classList.add("draggable");
  draggable.setAttribute("draggable", true);
  draggable.dataset.english = word.english;
  draggable.style.setProperty('--gem-color', word.gemColor);
  
  draggable.innerHTML = word.english;
  
  draggable.addEventListener("dragstart", handleDragStart);
  draggable.addEventListener("dragend", handleDragEnd);
  
  return draggable;
}

// Drag and Drop Handlers
function handleDragStart(e) {
  initAudio();
  if (gameState.sounds) gameState.sounds.drag();
  gameState.activeDraggable = e.target;
  e.target.classList.add("dragging");
  e.dataTransfer.setData("text/plain", e.target.dataset.english);
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");
  const trail = document.querySelector('.drag-trail');
  if (trail) trail.remove();
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("dragover");
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove("dragover");
}

function handleDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove("dragover");
  
  const englishWord = e.dataTransfer.getData("text/plain");
  const spanishWord = e.currentTarget.dataset.spanish;
  
  // Clear existing content
  e.currentTarget.innerHTML = '';
  
  // Create matched pair display
  const matchedPair = document.createElement("div");
  matchedPair.className = "matched-pair";
  matchedPair.innerHTML = `
    <span class="spanish-word">${spanishWord}</span>
    <span class="match-arrow">⇄</span>
    <span class="english-word">${englishWord}</span>
  `;
  
  e.currentTarget.appendChild(matchedPair);
  
  // Mark the dragged word as used
  if (gameState.activeDraggable) {
    gameState.activeDraggable.classList.add('used');
    gameState.activeDraggable.setAttribute('draggable', 'false');
  }
  
  // Store the match in game state
  gameState.droppedAnswers.set(e.currentTarget, {
    draggable: gameState.activeDraggable,
    english: englishWord,
    isCorrect: checkMatch(englishWord, spanishWord)
  });
  
  // Check if all cells have answers
  const allCellsFilled = Array.from(document.querySelectorAll('.cell'))
    .every(cell => gameState.droppedAnswers.has(cell));
  
  if (allCellsFilled) {
    checkAllAnswers();
  }
}

function checkMatch(englishWord, spanishWord) {
  const wordSet = getCurrentWordSet();
  const match = wordSet.find(word => 
    word.english.toLowerCase() === englishWord.toLowerCase() && 
    word.spanish.toLowerCase() === spanishWord.toLowerCase()
  );
  return !!match;
}

function checkAllAnswers() {
  let allCorrect = true;
  const cells = document.querySelectorAll('.cell');
  const incorrectAnswers = [];
  
  cells.forEach(cell => {
    const answer = gameState.droppedAnswers.get(cell);
    if (!answer.isCorrect) {
      allCorrect = false;
      incorrectAnswers.push({
        cell: cell,
        draggable: answer.draggable
      });
    }
  });
  
  if (allCorrect) {
    // Play victory sound and show victory screen
    if (gameState.sounds) gameState.sounds.win();
    cells.forEach(cell => cell.classList.add('correct'));
    setTimeout(showVictoryScreen, 1000);
  } else {
    // Play error sound
    if (gameState.sounds) gameState.sounds.incorrect();
    
    // Return incorrect answers to the right side
    incorrectAnswers.forEach(({ cell, draggable }) => {
      // Animate the cell
      cell.classList.add('incorrect');
      setTimeout(() => cell.classList.remove('incorrect'), 500);
      
      // Reset the cell content
      cell.innerHTML = `<div class="spanish-word">${cell.dataset.spanish}</div>`;
      
      // Return the draggable
      draggable.classList.remove('used');
      draggable.setAttribute('draggable', 'true');
      elements.answers.appendChild(draggable);
      
      // Remove from game state
      gameState.droppedAnswers.delete(cell);
    });
  }
}

// Game Initialization
function initGame() {
  resetGameState();
  updateUI();
  createGameBoard();
  createAnswerOptions();
  
  // Start timer immediately in normal mode
    startTimer();
  
  // Highlight normal mode button
  updateModeButtons();
}

// Initialize game when document is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadSharedWords();
  initGame();
  initEventListeners();
  initTouchSupport();
});

// Event Listeners Initialization
function initEventListeners() {
  // Mode buttons
  document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === 'custom') {
        showCustomWordsModal();
      } else if (mode === 'timed') {
        showTimeSelector();
      } else if (mode === 'normal') {
        gameState.mode = 'normal';
        resetGame();
        updateModeButtons();
      }
    });
  });

  // Theme functionality
  document.getElementById('themeBtn').addEventListener('click', showThemeModal);
  document.getElementById('closeThemeBtn').addEventListener('click', () => {
    document.getElementById('themeModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
  });
  document.getElementById('uploadThemeBtn').addEventListener('click', () => {
    document.getElementById('themeImageInput').click();
  });
  document.getElementById('themeImageInput').addEventListener('change', handleThemeUpload);

  // Load saved theme
  loadSavedTheme();

  // Time selector buttons
  document.querySelectorAll('.time-option').forEach(btn => {
    btn.onclick = () => {
      const time = parseInt(btn.dataset.time || document.getElementById('customTime').value);
      if (time && time >= 10) {
        GAME_SETTINGS.TIMED_MODE_DURATION = time;
        hideModal('timeSelectModal');
        startTimedGame();
      }
    };
  });

  // Custom words modal
  elements.addWordBtn.addEventListener('click', addCustomWord);
  elements.startGameBtn.addEventListener('click', () => {
    if (gameState.customWords.length >= GAME_SETTINGS.MIN_CUSTOM_WORDS) {
      hideModal('customWordsModal');
      resetGame('custom');
    }
  });

  // Modal overlay click to close
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
      hideModal('customWordsModal');
      hideModal('timeSelectModal');
    }
  });

  // Fullscreen
  elements.fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Import functionality
  elements.importWordsBtn.addEventListener('click', showImportModal);
  document.getElementById('confirmImportBtn').addEventListener('click', handleImportWords);
  document.getElementById('cancelImportBtn').addEventListener('click', () => hideModal('importModal'));

  // Home button
  document.getElementById('homeBtn').addEventListener('click', () => {
    if (confirm('Return to main menu? Current progress will be lost.')) {
      window.location.href = '../index.html';  // Navigate to main menu
    }
  });
}

// Utility Functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getCurrentWordSet() {
  return gameState.mode === "custom" ? gameState.customWords : VOCABULARY_DATA;
}

function resetGameState() {
  gameState.score = 0;
  gameState.correctMatches = 0;
  gameState.hintCount = 3;
  gameState.timeElapsed = 0;
  gameState.timeLeft = GAME_SETTINGS.TIMED_MODE_DURATION;
  gameState.streak = 0;
  gameState.droppedAnswers.clear();
  clearInterval(gameState.timer);
}

function updateUI() {
  if (elements.scoreDisplay) {
  elements.scoreDisplay.textContent = gameState.score;
  }
  
  if (elements.totalPairsDisplay) {
  elements.totalPairsDisplay.textContent = getCurrentWordSet().length;
  }
  
  if (elements.timerDisplay) {
  elements.timerDisplay.textContent = formatTime(gameState.timeLeft);
  }
  
  if (elements.hintCount) {
    elements.hintCount.textContent = gameState.hintCount;
  }
}

function resetGame(mode) {
  if (mode) {
    gameState.mode = mode;
  }
  
  // Clear both boards
  elements.gameBoard.innerHTML = '';
  elements.answers.innerHTML = '';
  
  // Reset game state
  resetGameState();
  
  // Create new game
  createGameBoard();
  createAnswerOptions();
  updateUI();
  
  // Start timer for both normal and timed modes
  startTimer();
  
  // Update mode buttons
  updateModeButtons();
}

// Initialize audio after user interaction
function initAudio() {
  if (!gameState.audioContext) {
    gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    gameState.sounds = {
      correct: createOscillator(523.25, 'sine', 0.2), // C5
      incorrect: createOscillator(277.18, 'square', 0.3), // C#4
      drag: createOscillator(440, 'sine', 0.1), // A4
      drop: createOscillator(880, 'sine', 0.15), // A5
      win: createWinSound()
    };
  }
}

function createOscillator(frequency, type, duration) {
  return () => {
    if (!gameState.audioContext) return;
    
    const oscillator = gameState.audioContext.createOscillator();
    const gainNode = gameState.audioContext.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, gameState.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.5, gameState.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, gameState.audioContext.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(gameState.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(gameState.audioContext.currentTime + duration);
  };
}

function createWinSound() {
  return () => {
    if (!gameState.audioContext) return;
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => createOscillator(freq, 'sine', 0.3)(), i * 200);
    });
  };
}

// Visual Effects
function createSparkle(x, y) {
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.style.left = x + 'px';
  sparkle.style.top = y + 'px';
  sparkle.style.width = '5px';
  sparkle.style.height = '5px';
  document.body.appendChild(sparkle);
  
  setTimeout(() => document.body.removeChild(sparkle), 1000);
}

function createCelebrationSparkles() {
  const colors = GAME_SETTINGS.GEM_COLORS;
  
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'celebration-sparkle';
      sparkle.style.left = Math.random() * window.innerWidth + 'px';
      sparkle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      sparkle.style.animationDuration = (Math.random() * 1 + 0.5) + 's';
      sparkle.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(sparkle);
      
      setTimeout(() => sparkle.remove(), 2000);
    }, i * 50);
  }
}

function playWinSound() {
  if (!gameState.audioContext) return;
  
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  const gainNode = gameState.audioContext.createGain();
  gainNode.connect(gameState.audioContext.destination);
  gainNode.gain.value = 0.2;
  
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const oscillator = gameState.audioContext.createOscillator();
      oscillator.connect(gainNode);
      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      oscillator.start();
      oscillator.stop(gameState.audioContext.currentTime + 0.2);
    }, i * 200);
  });
}

// Add sharing functionality
function generateShareLink() {
  const customWords = gameState.customWords;
  const wordData = btoa(JSON.stringify(customWords));
  const url = new URL(window.location.href);
  url.searchParams.set('words', wordData);
  return url.toString();
}

function loadSharedWords() {
  const url = new URL(window.location.href);
  const wordData = url.searchParams.get('words');
  if (wordData) {
    try {
      const customWords = JSON.parse(atob(wordData));
      gameState.customWords = customWords;
      gameState.mode = 'custom';
      initGame();
    } catch (e) {
      console.error('Invalid share link');
    }
  }
}

// Update showWinScreen function
function showWinScreen() {
  // Clear any existing win overlay
  const existingOverlay = document.querySelector('.win-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }

  const overlay = document.createElement('div');
  overlay.className = 'win-overlay';
  
  const content = document.createElement('div');
  content.className = 'win-content';
  
  const title = document.createElement('h1');
  title.className = 'win-title';
  title.innerHTML = '🎉 ¡Fantástico! 🎉';
  
  const subtitle = document.createElement('div');
  subtitle.className = 'win-subtitle';
  subtitle.innerHTML = '✨ You matched all the words perfectly! ✨';
  
  const score = document.createElement('div');
  score.className = 'win-score';
  score.innerHTML = `
    <div class="score-value">💎 ${gameState.score}/${getCurrentWordSet().length}</div>
    <div class="time-bonus">⏱️ Time Bonus: ${formatTime(gameState.timeLeft)}</div>
  `;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'win-buttons';
  
  const playAgainBtn = document.createElement('button');
  playAgainBtn.className = 'win-btn play-again';
  playAgainBtn.innerHTML = '🎮 Play Again';
  playAgainBtn.onclick = () => {
    overlay.remove();
    resetGame();
  };
  
  const shareBtn = document.createElement('button');
  shareBtn.className = 'win-btn share';
  shareBtn.innerHTML = '🔗 Share Victory';
  shareBtn.onclick = () => {
    const shareText = `I matched all ${getCurrentWordSet().length} word pairs in Word Match! Can you beat my time of ${formatTime(GAME_SETTINGS.DEFAULT_TIME - gameState.timeLeft)}? 🎮✨`;
    navigator.clipboard.writeText(shareText).then(() => {
      shareBtn.innerHTML = '✅ Copied!';
      setTimeout(() => {
        shareBtn.innerHTML = '🔗 Share Victory';
      }, 2000);
    });
  };
  
  buttonContainer.appendChild(playAgainBtn);
    buttonContainer.appendChild(shareBtn);
  
  content.appendChild(title);
  content.appendChild(subtitle);
  content.appendChild(score);
  content.appendChild(buttonContainer);
  overlay.appendChild(content);
  
  // Create celebration effects
  createCelebrationSparkles();
  playWinSound();
  
  document.body.appendChild(overlay);
}

// Add event listeners for sharing
document.getElementById('shareBtn').addEventListener('click', () => {
  const shareLink = generateShareLink();
  const shareLinkInput = document.getElementById('shareLink');
  shareLinkInput.value = shareLink;
  navigator.clipboard.writeText(shareLink).then(() => {
    const shareBtn = document.getElementById('shareBtn');
    shareBtn.textContent = '✅ Link Copied!';
    setTimeout(() => {
      shareBtn.textContent = '🔗 Share Game';
    }, 2000);
  });
});

// Add fullscreen support
const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', toggleFullscreen);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    document.querySelector('.game-wrapper').classList.add('fullscreen');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      document.querySelector('.game-wrapper').classList.remove('fullscreen');
    }
  }
}

// Custom Words Functions
function showModal(modalId) {
  elements.modalOverlay.style.display = "flex";
  document.getElementById(modalId).style.display = "block";
}

function hideModal(modalId) {
  elements.modalOverlay.style.display = "none";
  document.getElementById(modalId).style.display = "none";
}

function showCustomWordsModal() {
  showModal('customWordsModal');
  updateWordList();
}

function showTimeSelector() {
  showModal('timeSelectModal');
}

// Update word list display
function updateWordList() {
  elements.wordList.innerHTML = "";
  gameState.customWords.forEach((word, index) => {
    const item = document.createElement("div");
    item.className = "word-pair";
    item.innerHTML = `
      ${word.spanish} - ${word.english}
      <button onclick="removeCustomWord(${index})" class="btn">×</button>
    `;
    elements.wordList.appendChild(item);
  });
  
  // Update start game button state
  elements.startGameBtn.disabled = gameState.customWords.length < GAME_SETTINGS.MIN_CUSTOM_WORDS;
}

function addCustomWord() {
  const spanish = elements.spanishInput.value.trim();
  const english = elements.englishInput.value.trim();
  
  if (!spanish || !english) {
    alert('Please enter both Spanish and English words');
    return;
  }
  
  gameState.customWords.push({
    spanish: spanish,
    english: english,
    gemColor: GAME_SETTINGS.GEM_COLORS[
      Math.floor(Math.random() * GAME_SETTINGS.GEM_COLORS.length)
    ]
  });
  
  // Clear inputs
  elements.spanishInput.value = '';
  elements.englishInput.value = '';
  
  // Update word display
  updateWordList();
}

function removeCustomWord(index) {
  gameState.customWords.splice(index, 1);
  updateWordList();
}

function importBulkWords() {
  const text = elements.bulkWords.value.trim();
  if (!text) return;
  
  const lines = text.split("\n");
  
  lines.forEach(line => {
    const [spanish, english] = line.split(",").map(str => str.trim());
    if (spanish && english) {
      const gemColors = ["#E74C3C", "#F1C40F", "#E67E22", "#2ECC71", "#9B59B6", "#3498DB"];
      const randomColor = gemColors[Math.floor(Math.random() * gemColors.length)];
      
      gameState.customWords.push({
        spanish,
        english,
        gemColor: randomColor
      });
    }
  });
  
  updateWordList();
  elements.bulkWords.value = "";
}

// Add event listeners for custom words
document.addEventListener('DOMContentLoaded', () => {
  // Existing event listeners...
  
  // Add custom words event listeners
  elements.addWordBtn.addEventListener('click', addCustomWord);
  elements.importWordsBtn.addEventListener('click', importBulkWords);
  elements.startGameBtn.addEventListener('click', () => {
    if (gameState.customWords.length >= GAME_SETTINGS.MIN_CUSTOM_WORDS) {
      hideModal('customWordsModal');
      resetGame('custom');
    }
  });
  
  // Add keyboard support for custom words
  elements.spanishInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (elements.spanishInput.value.trim()) {
        elements.englishInput.focus();
      }
    }
  });
  
  elements.englishInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (elements.englishInput.value.trim()) {
        addCustomWord();
      }
    }
  });
  
  // Close modal when clicking outside
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) {
      hideModal('customWordsModal');
    }
  });
});

// Make removeCustomWord available globally
window.removeCustomWord = removeCustomWord;

function showError(message, duration = 3000) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    errorDiv.remove();
  }, duration);
}

function startTimer() {
  clearInterval(gameState.timer);
  
  if (gameState.mode === "timed") {
    // Countdown timer for timed mode
    gameState.timeLeft = GAME_SETTINGS.TIMED_MODE_DURATION;
    gameState.timer = setInterval(() => {
      if (gameState.timeLeft > 0) {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 10) {
          elements.timerDisplay.classList.add('time-warning');
        }
      } else {
        endGame('timeUp');
      }
    }, 1000);
  } else {
    // Count up timer for normal mode
    gameState.timeElapsed = 0;
    gameState.timer = setInterval(() => {
      gameState.timeElapsed++;
      updateTimerDisplay();
    }, 1000);
  }
}

function updateTimerDisplay() {
  if (!elements.timerDisplay) return;
  
  if (gameState.mode === "timed") {
    elements.timerDisplay.textContent = formatTime(gameState.timeLeft);
    if (gameState.timeLeft > 10) {
      elements.timerDisplay.classList.remove('time-warning');
    }
  } else {
    elements.timerDisplay.textContent = formatTime(gameState.timeElapsed);
  }
}

function endGame(reason) {
  clearInterval(gameState.timer);
  
  if (reason === 'timeUp') {
    showGameOverScreen();
  } else if (reason === 'complete') {
    showWinScreen();
  }
}

function showGameOverScreen() {
  const existingScreen = document.querySelector('.game-over-screen');
  if (existingScreen) {
    existingScreen.remove();
  }

  const gameOverScreen = document.createElement('div');
  gameOverScreen.className = 'game-over-screen';
  
  gameOverScreen.innerHTML = `
    <div class="game-over-content">
      <div class="game-over-title">Time's Up!</div>
      <div class="game-over-message">
        ⏱️ The clock ran out
      </div>
      <div class="game-over-stats">
        You matched ${gameState.score} out of ${getCurrentWordSet().length} pairs
      </div>
      <button class="game-over-button" id="retryBtn">🔄 Try Again</button>
    </div>
  `;
  
  document.body.appendChild(gameOverScreen);
  
  document.getElementById('retryBtn').addEventListener('click', () => {
    gameOverScreen.remove();
    resetGame(gameState.mode);
  });
  
  if (gameState.sounds?.incorrect) {
    gameState.sounds.incorrect();
  }
}

function initTouchSupport() {
  if ('ontouchstart' in window) {
    document.body.classList.add('touch-device');
    
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
      draggable.addEventListener('touchstart', handleTouchStart, { passive: false });
      draggable.addEventListener('touchmove', handleTouchMove, { passive: false });
      draggable.addEventListener('touchend', handleTouchEnd);
    });
  }
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const draggable = e.target.closest('.draggable');
  
  if (!draggable || draggable.classList.contains('used')) return;
  
  gameState.activeDraggable = draggable;
  draggable.classList.add('dragging');
  
  gameState.touch = {
    startX: touch.clientX,
    startY: touch.clientY,
    element: draggable,
    offsetX: touch.clientX - draggable.getBoundingClientRect().left,
    offsetY: touch.clientY - draggable.getBoundingClientRect().top
  };
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!gameState.touch) return;
  
  const touch = e.touches[0];
  const draggable = gameState.touch.element;
  
  // Update draggable position
  draggable.style.position = 'fixed';
  draggable.style.left = `${touch.clientX - gameState.touch.offsetX}px`;
  draggable.style.top = `${touch.clientY - gameState.touch.offsetY}px`;
  draggable.style.zIndex = '1000';
  
  // Find the cell under the touch point
  const cell = document.elementFromPoint(
    touch.clientX,
    touch.clientY
  )?.closest('.cell');
  
  // Handle hover effect
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('dragover'));
  if (cell) {
    cell.classList.add('dragover');
  }
}

function handleTouchEnd(e) {
  if (!gameState.touch) return;
  
  const draggable = gameState.touch.element;
  const touch = e.changedTouches[0];
  
  // Find the cell under the release point
  const cell = document.elementFromPoint(
    touch.clientX,
    touch.clientY
  )?.closest('.cell');
  
  if (cell) {
    // Simulate drop event
    const dropEvent = new Event('drop');
    dropEvent.dataTransfer = {
      getData: () => draggable.dataset.english
    };
    handleDrop.call(cell, dropEvent);
  }
  
  // Reset draggable
  draggable.style.position = '';
  draggable.style.left = '';
  draggable.style.top = '';
  draggable.style.zIndex = '';
  draggable.classList.remove('dragging');
  
  // Clear touch state
  gameState.touch = null;
  
  // Remove hover effects
  document.querySelectorAll('.cell').forEach(c => c.classList.remove('dragover'));
}

// Add touch styles

// Add missing helper function
function clearInputs() {
  elements.spanishInput.value = "";
  elements.englishInput.value = "";
  elements.spanishInput.focus();
}

// Add missing share handler functions
function handleShare() {
  const shareLink = generateShareLink();
  navigator.clipboard.writeText(shareLink).then(() => {
    elements.shareBtn.textContent = '✅ Link Copied!';
    setTimeout(() => {
      elements.shareBtn.textContent = '🔗 Share Game';
    }, 2000);
  });
}

function handleCopyLink() {
  const shareLinkInput = document.getElementById('shareLink');
  shareLinkInput.select();
  navigator.clipboard.writeText(shareLinkInput.value).then(() => {
    elements.copyLinkBtn.textContent = '✅ Copied!';
    setTimeout(() => {
      elements.copyLinkBtn.textContent = 'Copy Link';
    }, 2000);
  });
}

// Add Hint System
function useHint() {
  if (gameState.hintCount > 0) {
    const unmatched = findUnmatchedPair();
    if (unmatched) {
      highlightPair(unmatched);
      gameState.hintCount--;
      updateUI();
      
      // Deduct points for using hint
      if (gameState.score >= GAME_SETTINGS.HINT_COST) {
        gameState.score -= GAME_SETTINGS.HINT_COST;
        updateUI();
      }
    }
  } else {
    showError('No hints remaining!');
  }
}

function findUnmatchedPair() {
  const wordSet = getCurrentWordSet();
  for (const word of wordSet) {
    const cell = Array.from(document.querySelectorAll('.cell'))
      .find(cell => cell.dataset.spanish === word.spanish);
    
    if (!cell || !gameState.droppedAnswers.has(cell) || 
        !gameState.droppedAnswers.get(cell).isCorrect) {
      return word;
    }
  }
  return null;
}

function highlightPair(word) {
  const spanishCell = Array.from(document.querySelectorAll('.cell'))
    .find(cell => cell.dataset.spanish === word.spanish);
  const englishDraggable = Array.from(document.querySelectorAll('.draggable'))
    .find(drag => drag.textContent === word.english);
    
  if (spanishCell && englishDraggable) {
    spanishCell.classList.add('hint-highlight');
    englishDraggable.classList.add('hint-highlight');
    
    setTimeout(() => {
      spanishCell.classList.remove('hint-highlight');
      englishDraggable.classList.remove('hint-highlight');
    }, 2000);
  }
}

// Update Score System
function updateScore(isCorrect) {
  if (isCorrect) {
    gameState.score++;
    gameState.streak++;
    
    // Bonus points for streaks
    if (gameState.streak >= GAME_SETTINGS.STREAK_THRESHOLD) {
      const bonus = Math.floor(gameState.streak / GAME_SETTINGS.STREAK_THRESHOLD);
      gameState.score += bonus;
      showStreakIndicator(bonus);
    }
  } else {
    gameState.streak = 0;
  }
  
  updateUI();
}

function showStreakIndicator(bonus) {
  const indicator = document.createElement('div');
  indicator.className = 'streak-indicator';
  indicator.innerHTML = `
    ${gameState.streak}x Streak! 🔥<br>
    <span class="bonus">+${bonus} Bonus Points!</span>
  `;
  document.body.appendChild(indicator);
  
  setTimeout(() => {
    indicator.classList.add('fade-out');
    setTimeout(() => indicator.remove(), 500);
  }, 1500);
}

function checkForVictory() {
    const totalPairs = getCurrentWordSet().length;
    const correctMatches = Array.from(gameState.droppedAnswers.values())
        .filter(answer => answer.isCorrect).length;

    if (correctMatches === totalPairs) {
        // Stop timer if in timed mode
        if (gameState.mode === 'timed') {
            clearInterval(gameState.timer);
        }
        
        // Small delay before showing victory screen
        setTimeout(() => {
            showVictoryScreen();
        }, 500);
        return true;
    }
    return false;
}

function showVictoryScreen() {
    const existingScreen = document.querySelector('.victory-screen');
    if (existingScreen) {
        existingScreen.remove();
    }

    const victoryScreen = document.createElement('div');
    victoryScreen.className = 'victory-screen';
    
    // Get appropriate time message based on mode
    const timeMessage = gameState.mode === "timed" 
        ? `with ${formatTime(gameState.timeLeft)} remaining!`
        : `in ${formatTime(gameState.timeElapsed)}!`;
    
    victoryScreen.innerHTML = `
        <div class="victory-content">
            <div class="victory-title">¡Fantástico!</div>
            <div class="victory-message">
                ✨ You matched all the words perfectly ${timeMessage}
            </div>
            <div class="victory-stats">
                <div>💎 Score: ${getCurrentWordSet().length}/${getCurrentWordSet().length}</div>
                <div>⏱️ ${gameState.mode === "timed" ? "Time Remaining" : "Time Taken"}: 
                    ${gameState.mode === "timed" 
                        ? formatTime(gameState.timeLeft)
                        : formatTime(gameState.timeElapsed)
                    }
                </div>
            </div>
            <button class="victory-button" id="playAgainBtn">🎮 Play Again</button>
        </div>
    `;
    
    document.body.appendChild(victoryScreen);
    
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        victoryScreen.remove();
        resetGame();
    });
    
    if (gameState.sounds?.win) {
        gameState.sounds.win();
    }
}

// Add new function to handle time selection
function showTimeSelector() {
  const modal = document.getElementById('timeSelectModal');
  modal.style.display = 'block';
  elements.modalOverlay.style.display = 'flex';

  // Handle time option clicks
  document.querySelectorAll('.time-option').forEach(btn => {
    btn.onclick = () => {
      const time = parseInt(btn.dataset.time || document.getElementById('customTime').value);
      if (time && time >= 10) {
        GAME_SETTINGS.TIMED_MODE_DURATION = time;
        modal.style.display = 'none';
        elements.modalOverlay.style.display = 'none';
        startTimedGame();
      }
    };
  });
}

function startTimedGame() {
  gameState.mode = 'timed';
  resetGame();
  updateModeButtons();
}

function updateModeButtons() {
  document.querySelectorAll('.mode-btn[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === gameState.mode);
  });
}

function showImportModal() {
  showModal('importModal');
}

function handleImportWords() {
  const text = document.getElementById('importTextarea').value.trim();
  if (!text) return;

  const lines = text.split('\n');
  let addedCount = 0;

  lines.forEach(line => {
    // Try comma first, then tab
    let parts = line.split(',');
    if (parts.length !== 2) {
      parts = line.split('\t');
    }

    if (parts.length === 2) {
      const [spanish, english] = parts.map(str => str.trim());
      if (spanish && english) {
        gameState.customWords.push({
          spanish,
          english,
          gemColor: GAME_SETTINGS.GEM_COLORS[
            Math.floor(Math.random() * GAME_SETTINGS.GEM_COLORS.length)
          ]
        });
        addedCount++;
      }
    }
  });

  // Clear textarea and hide modal
  document.getElementById('importTextarea').value = '';
  hideModal('importModal');
  
  // Update word list and show feedback
  updateWordList();
  showFeedback(`Added ${addedCount} word pairs successfully!`);
}

function showFeedback(message) {
  const feedback = document.createElement('div');
  feedback.className = 'feedback-message';
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.classList.add('fade-out');
    setTimeout(() => feedback.remove(), 500);
  }, 2000);
}

// ... rest of the existing code stays the same ...