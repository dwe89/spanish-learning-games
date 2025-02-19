// Game Constants
const wordList = {
    fruits: {
        words: ["manzana", "plátano", "naranja", "piña", "uva", "mango", "pera", "fresa"],
        hints: ["Red fruit", "Yellow curved fruit", "Orange citrus", "Tropical spiky fruit", "Small purple fruit", "Sweet tropical fruit", "Green teardrop fruit", "Red berry"]
    },
    animals: {
        words: ["perro", "gato", "león", "tigre", "oso", "mono", "pájaro", "pez"],
        hints: ["Man's best friend", "Independent pet", "King of jungle", "Striped big cat", "Large forest animal", "Playful primate", "Flying creature", "Lives in water"]
    },
    colors: {
        words: ["rojo", "azul", "verde", "amarillo", "negro", "blanco", "morado", "gris"],
        hints: ["Color of fire", "Color of sky", "Color of grass", "Color of sun", "Darkest color", "Color of snow", "Color of royalty", "Color of clouds"]
    }
};

// Game Variables  
let scrambledWord;  
let answer;  
let score = 0;  
let guesses = 5;  
let time = 60;  
let intervalId;  
let chosenWord;  
let customWords = [];
let useCustomWords = false;

// Sound effects
const correctSound = new Audio('assets/sounds/win.mp3');
const wrongSound = new Audio('assets/sounds/lose.mp3');
const gameOverSound = new Audio('assets/sounds/gameover.mp3');

// DOM Elements
const elements = {
    scrambledWord: document.getElementById("scrambledWord"),
    answerInput: document.getElementById("answerInput"),
    submitBtn: document.getElementById("submitBtn"),
    skipBtn: document.getElementById("skipBtn"),
    scoreDisplay: document.getElementById("score"),
    guessesDisplay: document.getElementById("guesses"),
    timeDisplay: document.getElementById("time"),
    restartBtn: document.getElementById("restartBtn"),
    hintBtn: document.getElementById("hintBtn"),
    statsBtn: document.getElementById("statsBtn"),
    leaderboardBtn: document.getElementById("leaderboardBtn"),
    teacherModeBtn: document.getElementById("teacherModeBtn"),
    wordChoiceModal: document.getElementById("wordChoiceModal"),
    wordInput: document.getElementById("wordInput"),
    saveWordBtn: document.getElementById("saveWordBtn"),
    closeWordChoiceBtn: document.getElementById("closeWordChoiceBtn"),
    customWord: document.getElementById("customWord"),
    customHint: document.getElementById("customHint"),
    addWordBtn: document.getElementById("addWordBtn"),
    wordListElement: document.getElementById("wordList"),
    closeTeacherBtn: document.getElementById("closeTeacherBtn"),
    confettiContainer: document.getElementById("confettiContainer"),
    congratsModal: document.getElementById("congratsModal"),
    closeCongratsBtn: document.getElementById("closeCongratsBtn"),
    toggleWordSourceBtn: document.getElementById("toggleWordSourceBtn"),
    hintModal: document.getElementById("hintModal"),
    hintText: document.getElementById("hintText"),
    closeHintBtn: document.getElementById("closeHintBtn"),
    statsModal: document.getElementById("statsModal"),
    statsText: document.getElementById("statsText"),
    closeStatsBtn: document.getElementById("closeStatsBtn"),
    leaderboardModal: document.getElementById("leaderboardModal"),
    leaderboardText: document.getElementById("leaderboardText"),
    closeLeaderboardBtn: document.getElementById("closeLeaderboardBtn"),
    teacherModal: document.getElementById("teacherModal"),
    gameOverModal: document.getElementById("gameOverModal"),
    finalScore: document.getElementById("finalScore"),
    playAgainBtn: document.getElementById("playAgainBtn"),
};

// Core Game Functions
function getScrambledWord(word) {
    if (!word) return '';
    let letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const scrambled = letters.join('');
    return scrambled === word ? getScrambledWord(word) : scrambled;
}

function displayScrambledWord(word) {
    if (!elements.scrambledWord) return;
    elements.scrambledWord.style.opacity = '0';
    elements.scrambledWord.classList.remove('shuffle');
    setTimeout(() => {
        elements.scrambledWord.textContent = word;
        elements.scrambledWord.style.opacity = '1';
        elements.scrambledWord.classList.add('shuffle');
    }, 300);
}

function getRandomWord() {
    if (useCustomWords && customWords.length > 0) {
        return customWords[Math.floor(Math.random() * customWords.length)];
    }
    const categories = Object.keys(wordList);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const wordIndex = Math.floor(Math.random() * wordList[category].words.length);
    return {
        word: wordList[category].words[wordIndex],
        hint: wordList[category].hints[wordIndex]
    };
}

function checkAnswer() {
    const userAnswer = elements.answerInput.value.trim().toLowerCase();
    const currentWord = chosenWord || unscrambleWord(scrambledWord);
    
    if (userAnswer === currentWord) {
        correctSound.play().catch(err => console.log('Sound play failed:', err));
        score++;
        elements.scoreDisplay.textContent = score;
        showCongrats();
        
        // If it was a chosen word, keep using it
        if (!chosenWord) {
            setTimeout(initGame, 1500);
        } else {
            // Just scramble the same word again
            setTimeout(() => {
                scrambledWord = getScrambledWord(chosenWord);
                displayScrambledWord(scrambledWord);
                elements.answerInput.value = '';
            }, 1500);
        }
    } else {
        wrongSound.play().catch(err => console.log('Sound play failed:', err));
        guesses--;
        elements.guessesDisplay.textContent = guesses;
        elements.answerInput.classList.add('shake');
        setTimeout(() => elements.answerInput.classList.remove('shake'), 500);
        
        if (guesses <= 0) {
            guesses = 0;
            elements.guessesDisplay.textContent = guesses;
            showGameOver();
        }
    }
    elements.answerInput.value = '';
}

function unscrambleWord(scrambled) {
    if (chosenWord) {
        return chosenWord;
    }
    
    if (useCustomWords && customWords.length > 0) {
        const customWord = customWords.find(w => isAnagram(scrambled, w.word));
        if (customWord) return customWord.word;
    }
    
    for (const category in wordList) {
        const word = wordList[category].words.find(w => isAnagram(scrambled, w));
        if (word) return word;
    }
    return scrambled;
}

function isAnagram(str1, str2) {
    return str1.split('').sort().join('') === str2.split('').sort().join('');
}

function updateTime() {
    time--;
    elements.timeDisplay.textContent = time;
    if (time <= 0) {
        time = 0;
        elements.timeDisplay.textContent = time;
        clearInterval(intervalId);
        showGameOver();
    }
}

// Modal Functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateHint() {
    const currentWord = unscrambleWord(scrambledWord);
    let hint = "No hint available";
    
    if (useCustomWords) {
        const customWord = customWords.find(w => w.word === currentWord);
        if (customWord && customWord.hint) {
            hint = customWord.hint;
        }
    } else {
        for (const category in wordList) {
            const index = wordList[category].words.indexOf(currentWord);
            if (index !== -1) {
                hint = wordList[category].hints[index];
                break;
            }
        }
    }
    
    elements.hintText.textContent = hint;
}

function showGameOver() {
    clearInterval(intervalId);
    
    // Play game over sound
    gameOverSound.play().catch(err => console.log('Sound play failed:', err));
    
    // Update final score
    elements.finalScore.textContent = score;
    
    // Show game over modal
    showModal('gameOverModal');
    
    // Save score to leaderboard
    saveScore(score);
    
    // Disable input during game over
    elements.answerInput.disabled = true;
}

function showCongrats() {
    elements.congratsModal.classList.add('active');
    createConfetti();
}

function createConfetti() {
    elements.confettiContainer.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        elements.confettiContainer.appendChild(confetti);
    }
}

// Initialize Game
function initGame() {
    clearInterval(intervalId);
    
    // Only reset chosen word if restart button is clicked
    if (document.activeElement === elements.restartBtn) {
        chosenWord = null;
    }
    
    // Re-enable input
    elements.answerInput.disabled = false;
    
    // Reset game state
    guesses = 5;
    time = 60;
    elements.guessesDisplay.textContent = guesses;
    elements.timeDisplay.textContent = time;
    elements.answerInput.value = "";
    
    // Hide any active modals
    hideModal('gameOverModal');
    hideModal('congratsModal');
    
    // If we have a chosen word, use it, otherwise get random word
    if (chosenWord) {
        scrambledWord = getScrambledWord(chosenWord);
    } else {
        const newWord = getRandomWord();
        scrambledWord = getScrambledWord(newWord.word);
    }
    displayScrambledWord(scrambledWord);
    
    // Start timer
    intervalId = setInterval(updateTime, 1000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    
    // Game controls
    elements.submitBtn?.addEventListener("click", checkAnswer);
    elements.skipBtn?.addEventListener("click", () => {
        alert(`Score: ${score}`);
        initGame();
    });
    elements.restartBtn?.addEventListener("click", initGame);
    elements.answerInput?.addEventListener('keydown', e => {
        if (e.key === 'Enter') checkAnswer();
    });
    
    // Modal controls
    elements.hintBtn?.addEventListener("click", () => {
        updateHint();
        showModal('hintModal');
    });
    elements.closeHintBtn?.addEventListener("click", () => hideModal('hintModal'));
    
    // Teacher Mode
    elements.teacherModeBtn?.addEventListener("click", () => {
        showModal('teacherModal');
    });

    elements.addWordBtn?.addEventListener("click", () => {
        const word = elements.customWord.value.trim();
        const hint = elements.customHint.value.trim();
        if (word && hint) {
            addCustomWord(word, hint);
            elements.customWord.value = '';
            elements.customHint.value = '';
        }
    });

    elements.wordListElement?.addEventListener("click", (e) => {
        if (e.target.closest('.delete-btn')) {
            const index = parseInt(e.target.closest('.delete-btn').dataset.index);
            deleteCustomWord(index);
        }
    });

    elements.closeTeacherBtn?.addEventListener("click", () => {
        hideModal('teacherModal');
    });

    // Choose Word
    elements.chooseWordBtn?.addEventListener("click", () => {
        showModal('wordChoiceModal');
    });

    elements.saveWordBtn?.addEventListener("click", () => {
        const word = elements.wordInput.value.trim();
        if (word) {
            // Set the chosen word directly
            chosenWord = word.toLowerCase();
            
            // Create scrambled version
            scrambledWord = getScrambledWord(chosenWord);
            
            // Display the scrambled word
            displayScrambledWord(scrambledWord);
            
            // Reset game state for new word
            guesses = 5;
            time = 60;
            score = 0;
            elements.guessesDisplay.textContent = guesses;
            elements.timeDisplay.textContent = time;
            elements.scoreDisplay.textContent = score;
            elements.answerInput.value = '';
            elements.answerInput.disabled = false;
            
            // Clear input and hide modal
            elements.wordInput.value = '';
            hideModal('wordChoiceModal');
            
            // Reset and start timer
            clearInterval(intervalId);
            intervalId = setInterval(updateTime, 1000);
        }
    });

    elements.closeWordChoiceBtn?.addEventListener("click", () => {
        hideModal('wordChoiceModal');
    });

    // Toggle Word Source
    elements.toggleWordSourceBtn?.addEventListener("click", () => {
        useCustomWords = !useCustomWords;
        elements.toggleWordSourceBtn.innerHTML = `
            <i class="fas fa-exchange-alt"></i> 
            ${useCustomWords ? 'Use Default Words' : 'Use Custom Words'}
        `;
        initGame();
    });

    // Stats
    elements.statsBtn?.addEventListener("click", () => {
        updateStats();
        showModal('statsModal');
    });

    elements.closeStatsBtn?.addEventListener("click", () => {
        hideModal('statsModal');
    });

    // Leaderboard
    elements.leaderboardBtn?.addEventListener("click", () => {
        updateLeaderboard();
        showModal('leaderboardModal');
    });

    elements.closeLeaderboardBtn?.addEventListener("click", () => {
        hideModal('leaderboardModal');
    });

    // Load saved custom words
    const savedWords = localStorage.getItem('teacherWords');
    if (savedWords) {
        customWords = JSON.parse(savedWords);
        updateWordList();
    }

    // Update play again button listener with complete reset
    elements.playAgainBtn?.addEventListener("click", () => {
        hideModal('gameOverModal');
        // Reset all game state
        score = 0;
        guesses = 5;
        time = 60;
        elements.scoreDisplay.textContent = score;
        elements.guessesDisplay.textContent = guesses;
        elements.timeDisplay.textContent = time;
        elements.answerInput.value = "";
        
        // Clear any existing intervals
        clearInterval(intervalId);
        
        // Start fresh game
        initGame();
    });

    // Preload sounds
    [correctSound, wrongSound, gameOverSound].forEach(sound => {
        sound.load();
    });

    // Add teacher controls update
    updateTeacherControls();
    
    // Check for imported words on page load
    const importedWords = importWordsFromLink();
    if (importedWords) {
        const shouldImport = confirm('Would you like to import the shared custom words?');
        if (shouldImport) {
            customWords = importedWords;
            updateWordList();
            // Clear the URL to prevent reimporting on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
});

// Add saveScore function if not exists
function saveScore(score) {
    const leaderboard = JSON.parse(localStorage.getItem('wordScrambleLeaderboard') || '[]');
    leaderboard.push({
        score,
        date: new Date().toLocaleDateString()
    });
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem('wordScrambleLeaderboard', JSON.stringify(leaderboard.slice(0, 10)));
}

// Teacher Mode Functions
function updateWordList() {
    if (!elements.wordListElement) return;
    elements.wordListElement.innerHTML = '';
    customWords.forEach((wordObj, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span>Word: ${wordObj.word} - Hint: ${wordObj.hint}</span>
            <button class="delete-btn" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        elements.wordListElement.appendChild(wordItem);
    });

    // Update local storage
    localStorage.setItem('teacherWords', JSON.stringify(customWords));
}

function addCustomWord(word, hint) {
    if (!word || !hint) return;
    customWords.push({ word: word.toLowerCase(), hint });
    updateWordList();
}

function deleteCustomWord(index) {
    customWords.splice(index, 1);
    updateWordList();
}

// Leaderboard Functions
function updateLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('wordScrambleLeaderboard') || '[]');
    const leaderboardHTML = leaderboard.map((entry, index) => `
        <div class="leaderboard-entry">
            <span class="rank">#${index + 1}</span>
            <span class="score">${entry.score} points</span>
            <span class="date">${entry.date}</span>
        </div>
    `).join('');
    
    elements.leaderboardText.innerHTML = leaderboardHTML || '<p>No scores yet!</p>';
}

// Stats Functions
function updateStats() {
    const leaderboard = JSON.parse(localStorage.getItem('wordScrambleLeaderboard') || '[]');
    const totalGames = leaderboard.length;
    const highScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
    const averageScore = leaderboard.length > 0 
        ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length) 
        : 0;

    elements.statsText.innerHTML = `
        <div class="stats-container">
            <div class="stat-item">
                <h3>Games Played</h3>
                <p>${totalGames}</p>
            </div>
            <div class="stat-item">
                <h3>High Score</h3>
                <p>${highScore}</p>
            </div>
            <div class="stat-item">
                <h3>Average Score</h3>
                <p>${averageScore}</p>
            </div>
        </div>
    `;
}

// Add these functions for word sharing
function generateShareableLink(words) {
    // Convert words array to base64 to make it URL-friendly
    const wordsData = btoa(JSON.stringify(words));
    // Create URL with data as parameter
    const baseUrl = window.location.href.split('?')[0];
    return `${baseUrl}?words=${wordsData}`;
}

function importWordsFromLink() {
    try {
        // Get words parameter from URL
        const urlParams = new URLSearchParams(window.location.search);
        const wordsData = urlParams.get('words');
        if (wordsData) {
            // Decode and parse the words data
            const importedWords = JSON.parse(atob(wordsData));
            return importedWords;
        }
    } catch (error) {
        console.error('Error importing words:', error);
    }
    return null;
}

// Update the teacher mode section in the HTML to add export/import buttons
function updateTeacherControls() {
    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn';
    exportBtn.innerHTML = '<i class="fas fa-share-alt"></i> Share Words';
    
    const importBtn = document.createElement('button');
    importBtn.className = 'btn';
    importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import Words';
    
    // Add buttons to teacher controls
    const teacherControls = document.getElementById('teacherControls');
    if (teacherControls) {
        teacherControls.appendChild(exportBtn);
        teacherControls.appendChild(importBtn);
    }
    
    // Export button click handler
    exportBtn.addEventListener('click', () => {
        const link = generateShareableLink(customWords);
        
        // Create a temporary input to copy the link
        const tempInput = document.createElement('input');
        tempInput.value = link;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        // Show confirmation
        alert('Shareable link copied to clipboard! Share this link to let others use your custom words.');
    });
    
    // Import button click handler
    importBtn.addEventListener('click', () => {
        const link = prompt('Paste the shareable link here:');
        if (link) {
            try {
                // Extract words data from the pasted link
                const url = new URL(link);
                const wordsData = url.searchParams.get('words');
                if (wordsData) {
                    const importedWords = JSON.parse(atob(wordsData));
                    // Ask user if they want to replace or merge
                    const shouldReplace = confirm('Do you want to replace your existing words? Click OK to replace, Cancel to merge.');
                    if (shouldReplace) {
                        customWords = importedWords;
                    } else {
                        // Merge words, avoiding duplicates
                        const existingWords = new Set(customWords.map(w => w.word));
                        importedWords.forEach(word => {
                            if (!existingWords.has(word.word)) {
                                customWords.push(word);
                                existingWords.add(word.word);
                            }
                        });
                    }
                    updateWordList();
                    alert('Words imported successfully!');
                }
            } catch (error) {
                alert('Invalid link. Please make sure you copied the entire link.');
            }
        }
    });
}
