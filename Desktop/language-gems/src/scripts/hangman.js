const words = ['javascript', 'hangman', 'programming', 'language', 'gems'];
let selectedWord;
let guessedLetters = [];
let wrongGuesses = 0;

const maxWrongGuesses = 6;

function startGame() {
    selectedWord = words[Math.floor(Math.random() * words.length)];
    guessedLetters = [];
    wrongGuesses = 0;
    document.getElementById('message').textContent = '';
    document.getElementById('restart-button').style.display = 'none';
    updateWordDisplay();
    updateHangmanImage();
    setupLetterButtons();
}

function updateWordDisplay() {
    const wordContainer = document.getElementById('word-container');
    wordContainer.innerHTML = selectedWord.split('').map(letter => {
        return guessedLetters.includes(letter) ? letter : '_';
    }).join(' ');
}

function updateHangmanImage() {
    const hangmanImage = document.getElementById('hangman-image');
    hangmanImage.innerHTML = `Wrong guesses: ${wrongGuesses} / ${maxWrongGuesses}`;
}

function setupLetterButtons() {
    const lettersContainer = document.getElementById('letters-container');
    lettersContainer.innerHTML = '';
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    alphabet.split('').forEach(letter => {
        const button = document.createElement('button');
        button.textContent = letter;
        button.onclick = () => handleGuess(letter);
        lettersContainer.appendChild(button);
    });
}

function handleGuess(letter) {
    if (guessedLetters.includes(letter) || wrongGuesses >= maxWrongGuesses) return;

    guessedLetters.push(letter);
    if (!selectedWord.includes(letter)) {
        wrongGuesses++;
    }

    updateWordDisplay();
    updateHangmanImage();
    checkGameOver();
}

function checkGameOver() {
    if (wrongGuesses >= maxWrongGuesses) {
        document.getElementById('message').textContent = `Game Over! The word was "${selectedWord}".`;
        document.getElementById('restart-button').style.display = 'block';
    } else if (selectedWord.split('').every(letter => guessedLetters.includes(letter))) {
        document.getElementById('message').textContent = 'Congratulations! You guessed the word!';
        document.getElementById('restart-button').style.display = 'block';
    }
}

document.getElementById('restart-button').onclick = startGame;

// Start the game when the page loads
window.onload = startGame; 