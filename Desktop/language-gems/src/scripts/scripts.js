// ...existing code...

function showGameOver() {
    const gameOverScreen = document.createElement('div');
    gameOverScreen.className = 'game-over-screen';
    
    gameOverScreen.innerHTML = `
        <h2>Game Over!</h2>
        <p class="word-reveal">The word was: ${selectedWord}</p>
        <div class="stats">
            <p>Time: ${formatTime(timeElapsed)}</p>
            <p>Wrong guesses: ${wrongGuesses}</p>
        </div>
        <button class="next-button" onclick="location.reload()">Next Word</button>
    `;
    
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.innerHTML = '';
        gameContainer.appendChild(gameOverScreen);
    }
}

// ...existing code...

if (gameElements.startGameBtn) {
    gameElements.startGameBtn.addEventListener('click', () => {
        if (DEBUG) console.log('Start button clicked');
        
        // Get the custom word input
        const wordInput = document.getElementById('wordInput');
        const customWord = wordInput?.value.trim();
        
        // If custom word exists and is valid, use it
        if (customWord && customWord.length > 0) {
            // Update validation to allow letters, spaces and forward slashes
            if (!/^[a-zA-Z\s/]+$/.test(customWord)) {
                showNotification('Word can only contain letters, spaces and /', 'error');
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

// ...existing code...

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
    
    // Update display with proper spacing and show slashes
    gameElements.displayWord.textContent = displayWord.split('').map(char => {
        if (char === ' ') return '   ';
        if (char === '/') return ' / ';
        return char;
    }).join(' ');
}
