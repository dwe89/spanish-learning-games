const CATEGORIES = {
    fruits: [
      { spanish: "Manzana", emoji: "🍎" },
      { spanish: "Plátano", emoji: "🍌" },
      { spanish: "Naranja", emoji: "🍊" },
      { spanish: "Piña", emoji: "🍍" },
      { spanish: "Uva", emoji: "🍇" },
      { spanish: "Mango", emoji: "🥭" },
      { spanish: "Durazno", emoji: "🍑" },
      { spanish: "Pera", emoji: "🍐" },
      { spanish: "Fresa", emoji: "🍓" },
      { spanish: "Sandía", emoji: "🍉" }
    ],
    animals: [
      { spanish: "Perro", emoji: "🐶" },
      { spanish: "Gato", emoji: "🐱" },
      { spanish: "León", emoji: "🦁" },
      { spanish: "Elefante", emoji: "🐘" },
      { spanish: "Mono", emoji: "🐒" },
      { spanish: "Pingüino", emoji: "🐧" },
      { spanish: "Caballo", emoji: "🐎" },
      { spanish: "Oso", emoji: "🐻" },
      { spanish: "Tigre", emoji: "🐯" },
      { spanish: "Conejo", emoji: "🐰" }
    ],
    sports: [
      { spanish: "Fútbol", emoji: "⚽" },
      { spanish: "Baloncesto", emoji: "🏀" },
      { spanish: "Béisbol", emoji: "⚾" },
      { spanish: "Tenis", emoji: "🎾" },
      { spanish: "Voleibol", emoji: "🏐" },
      { spanish: "Natación", emoji: "🏊" },
      { spanish: "Ciclismo", emoji: "🚴" },
      { spanish: "Correr", emoji: "🏃" },
      { spanish: "Surf", emoji: "🏄" },
      { spanish: "Golf", emoji: "⛳" }
    ]
  };
  
  // Add emoji API key
  const EMOJI_API_KEY = 'f0692e3024d3d4885552d40253ace1acb6ce797b';
  
  // Global State Variables
  let customWords = [];
  let gameMode = "normal";
  let currentCategory = "fruits";
  let score = 0;
  let correctMatches = 0;
  let timer;
  let timeLeft = 0;
  let streak = 0;
  
  // Global variables and functions
  let currentTheme = localStorage.getItem('emoji-game-theme') || 'default';
  
  // Music control variables
  let musicEnabled = false;
  let currentMusic = 'background';
  const AUDIO_URLS = {
    background: 'https://cdn.jsdelivr.net/gh/manastalukdar/emoji-game@main/assets/music/background.mp3',
    click: 'https://cdn.jsdelivr.net/gh/manastalukdar/emoji-game@main/assets/sounds/click.mp3',
    correct: 'https://cdn.jsdelivr.net/gh/manastalukdar/emoji-game@main/assets/sounds/correct.mp3',
    incorrect: 'https://cdn.jsdelivr.net/gh/manastalukdar/emoji-game@main/assets/sounds/incorrect.mp3'
  };
  
  const audioElements = {
    background: new Audio(AUDIO_URLS.background),
    click: new Audio(AUDIO_URLS.click),
    correct: new Audio(AUDIO_URLS.correct),
    incorrect: new Audio(AUDIO_URLS.incorrect)
  };
  
  // Initialize all music tracks
  Object.values(audioElements).forEach(track => {
      track.loop = true;
      track.volume = 0.3;
  });
  
  // DOM Elements
  const gameBoard = document.getElementById("gameBoard");
  const answers = document.getElementById("answers");
  const scoreDisplay = document.getElementById("score");
  const timerDisplay = document.getElementById("timer");
  const streakIndicator = document.getElementById("streakIndicator");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const modalOverlay = document.getElementById("modalOverlay");
  const customWordsModal = document.getElementById("customModal");
  const addWordBtn = document.getElementById("addWordBtn");
  const spanishInput = document.getElementById("spanishWord");
  const customWordList = document.getElementById("customWordList");
  const startCustomGameBtn = document.getElementById("startCustomGameBtn");
  const bulkWords = document.getElementById("bulkWords");
  const importWordsBtn = document.getElementById("importWordsBtn");
  const goBackBtn = document.getElementById("goBackBtn");
  const categoryBtns = document.querySelectorAll(".category-btn");
  const imageInput = document.getElementById("imageInput");
  const mediaPreview = document.getElementById("mediaPreview");
  const backBtn = document.getElementById("backBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  
  // Sound effects
  const soundEffects = {
    drop: './assets/sounds/drop.mp3'
  };
  
  // Preload all sounds
  function preloadSounds() {
    const sounds = [soundEffects.drop];
    sounds.forEach(sound => {
        const audio = new Audio(sound);
        audio.load();
        // Set volume to a comfortable level
        audio.volume = 0.5;
    });
  }
  
  // Initialize music controls
  function initMusicControls() {
    const musicToggleBtn = document.getElementById('musicToggleBtn');
    const musicSelect = document.getElementById('musicSelect');
    if (!musicToggleBtn || !musicSelect) return;

    // Handle music selection change
    musicSelect.addEventListener('change', () => {
        if (musicEnabled) {
            // Stop current music
            audioElements[currentMusic].pause();
            audioElements[currentMusic].currentTime = 0;
            
            // Start new music
            currentMusic = musicSelect.value;
            audioElements[currentMusic].play().catch(err => {
                console.log('Music change failed:', err);
            });
        } else {
            currentMusic = musicSelect.value;
        }
    });

    // Handle music toggle
    musicToggleBtn.addEventListener('click', () => {
        musicEnabled = !musicEnabled;
        const icon = musicToggleBtn.querySelector('i');
        if (icon) {
            icon.className = musicEnabled ? 'fas fa-music' : 'fas fa-music-slash';
        }
        
        if (musicEnabled) {
            audioElements[currentMusic].play()
                .then(() => {
                    console.log('Music started successfully');
                })
                .catch(error => {
                    console.log('Music autoplay failed:', error);
                    showNotification('Click the music button again to start playing', 'info');
                    musicEnabled = false;
                    if (icon) {
                        icon.className = 'fas fa-music-slash';
                    }
                });
        } else {
            audioElements[currentMusic].pause();
        }
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (musicEnabled) {
                audioElements[currentMusic].pause();
            }
        } else if (musicEnabled) {
            audioElements[currentMusic].play().catch(err => console.log('Music play failed:', err));
        }
    });

    // Add click handler for autoplay restrictions
    document.addEventListener('click', () => {
        if (musicEnabled && audioElements[currentMusic].paused) {
            audioElements[currentMusic].play().catch(err => console.log('Music play failed:', err));
        }
    }, { once: true });
  }
  
  // Update the playSound function to handle all sound effects
  function playSound(soundId) {
    const sound = document.getElementById(soundId);
    if (!sound) {
        console.log('Sound not found:', soundId);
        switch(soundId) {
            case 'clickSound':
                return audioElements.click.play().catch(err => console.log('Error playing click sound:', err));
            case 'dropSound':
                return audioElements.drop.play().catch(err => console.log('Error playing drop sound:', err));
            case 'correctSound':
                return audioElements.correct.play().catch(err => console.log('Error playing correct sound:', err));
            case 'incorrectSound':
                return audioElements.incorrect.play().catch(err => console.log('Error playing incorrect sound:', err));
            default:
                console.log('Unknown sound:', soundId);
                return;
        }
    }
    
    try {
        sound.currentTime = 0;
        sound.play().catch(err => {
            console.log('Could not play sound:', err.message);
            sound.load();
            sound.play().catch(err => {
                console.log('Second attempt failed:', err.message);
            });
        });
    } catch (err) {
        console.log('Error playing sound:', err.message);
    }
  }
  
  // Game Functions
  function startGame() {
    console.log('Starting game with mode:', gameMode, 'category:', currentCategory);
    
    // Reset game state
    gameBoard.innerHTML = "";
    answers.innerHTML = "";
    score = 0;
    correctMatches = 0;
    timeLeft = 0;
    streak = 0;
    
    // Update displays
    scoreDisplay.textContent = score;
    timerDisplay.textContent = `00:00`;
  
    // Get game data
    let gameData;
    if (gameMode === "custom" || currentCategory === "custom") {
      console.log('Using custom words:', customWords);
      if (!customWords || customWords.length === 0) {
        showCustomWordsModal();
        return;
      }
      gameData = [...customWords]; // Create copy of custom words
    } else {
      gameData = CATEGORIES[currentCategory];
    }
  
    console.log('Game data to use:', gameData);
  
    // Create game elements
    createGameBoard(gameData);
    startTimer();
  }
  
  function createGameBoard(gameData) {
    const gameBoard = document.getElementById('gameBoard');
    const answers = document.getElementById('answers');
    
    if (!gameBoard || !answers) return;
    
    // Clear previous content
    gameBoard.innerHTML = '';
    answers.innerHTML = '';
    
    // Create cells for emojis with letter labels (A, B, C, etc.)
    gameData.forEach((item, index) => {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.spanish = item.spanish;
        
        // Add letter label (A, B, C, etc.)
        const letterLabel = document.createElement('div');
        letterLabel.className = 'cell-label';
        letterLabel.textContent = String.fromCharCode(65 + index); // A=65, B=66, etc.
        cell.appendChild(letterLabel);
        
        const emojiContainer = document.createElement('div');
        emojiContainer.className = 'emoji-container';
        
        // Check if the emoji is a URL (Pixabay image) or an emoji character
        if (item.emoji.startsWith('http') || item.emoji.startsWith('data:')) {
            const img = document.createElement('img');
            img.src = item.emoji;
            img.alt = item.spanish;
            emojiContainer.appendChild(img);
        } else {
            emojiContainer.textContent = item.emoji;
        }
        
        cell.appendChild(emojiContainer);
        
        // Add drag and drop event listeners
        cell.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!cell.classList.contains('matched')) {
                cell.classList.add('drag-over');
            }
        });
        
        cell.addEventListener('dragleave', () => {
            cell.classList.remove('drag-over');
        });
        
        cell.addEventListener('drop', (e) => handleDrop(e, cell));
        
        gameBoard.appendChild(cell);
    });
    
    // Create draggable answers with numbers (1, 2, 3, etc.)
    const shuffledItems = shuffleArray([...gameData]);
    shuffledItems.forEach((item, index) => {
        const answer = document.createElement('div');
        answer.className = 'draggable';
        answer.draggable = true;
        
        // Add number label and word
        const numberLabel = document.createElement('span');
        numberLabel.className = 'answer-number';
        numberLabel.textContent = `${index + 1}. `;
        answer.appendChild(numberLabel);
        
        const wordSpan = document.createElement('span');
        wordSpan.textContent = item.spanish;
        answer.appendChild(wordSpan);
        
        // Add drag event listeners and click sound
        answer.addEventListener('mousedown', () => {
            playSound('clickSound');
        });
        
        answer.addEventListener('dragstart', () => {
            answer.classList.add('dragging');
            playSound('clickSound');
        });
        
        answer.addEventListener('dragend', () => {
            answer.classList.remove('dragging');
            document.querySelectorAll('.cell').forEach(cell => {
                cell.classList.remove('drag-over');
            });
        });
        
        answers.appendChild(answer);
    });
  }
  
  function getMaxWidth(itemCount) {
      if (itemCount === 1) return '400px';
      if (itemCount === 2) return '800px';
      if (itemCount <= 4) return '900px';
      if (itemCount <= 6) return '1000px';
      if (itemCount <= 8) return '1100px';
      return '1200px';
  }
  
  // Drag and Drop Functions
  function handleDragStart(element) {
    element.classList.add("dragging");
  }
  
  function handleDragEnd(element) {
    element.classList.remove("dragging");
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('drag-over');
    });
  }
  
  function handleDrop(e, cell) {
    e.preventDefault();
    cell.classList.remove('drag-over');
    
    const draggedWord = document.querySelector('.dragging');
    if (!draggedWord || cell.classList.contains('matched')) return;
    
    // Play drop sound
    playSound('dropSound');
    
    // Add the word to the cell without checking correctness yet
    const droppedAnswer = document.createElement('div');
    droppedAnswer.classList.add('dropped-answer');
    droppedAnswer.innerHTML = draggedWord.innerHTML; // Use innerHTML to preserve number
    cell.appendChild(droppedAnswer);
    cell.dataset.answer = draggedWord.querySelector('span:last-child').textContent; // Store only the word
    draggedWord.remove();

    // Check if all cells have answers
    const totalCells = document.querySelectorAll('.cell').length;
    const answeredCells = document.querySelectorAll('.cell .dropped-answer').length;
    
    if (totalCells === answeredCells) {
        checkAllAnswers();
    }
  }
  
  function checkAllAnswers() {
    const cells = document.querySelectorAll('.cell');
    let allCorrect = true;
    const answers = document.getElementById('answers');
    
    cells.forEach(cell => {
        const answer = cell.dataset.answer;
        const correctAnswer = cell.dataset.spanish;
        
        if (answer === correctAnswer) {
            cell.classList.add('correct');
            const droppedAnswer = cell.querySelector('.dropped-answer');
            if (droppedAnswer) {
                droppedAnswer.style.background = 'rgba(72, 187, 120, 0.95)';
            }
        } else {
            allCorrect = false;
            // Return incorrect answer to the list
            const droppedAnswer = cell.querySelector('.dropped-answer');
            if (droppedAnswer) {
                const newDraggable = document.createElement('div');
                newDraggable.className = 'draggable';
                newDraggable.draggable = true;
                newDraggable.textContent = answer;
                
                // Add drag event listeners
                newDraggable.addEventListener('dragstart', () => {
                    newDraggable.classList.add('dragging');
                });
                
                newDraggable.addEventListener('dragend', () => {
                    newDraggable.classList.remove('dragging');
                    document.querySelectorAll('.cell').forEach(c => {
                        c.classList.remove('drag-over');
                    });
                });
                
                answers.appendChild(newDraggable);
                droppedAnswer.remove();
            }
            delete cell.dataset.answer;
        }
    });

    if (!allCorrect) {
        playSound('incorrectSound');
    } else {
        playSound('correctSound');
        showWinMessage();
    }
  }
  
  function showWinMessage() {
    const overlay = document.createElement('div');
    overlay.className = 'win-overlay';
    
    const content = document.createElement('div');
    content.className = 'win-content';
    
    const text = document.createElement('div');
    text.className = 'win-text';
    text.innerHTML = `¡Felicitaciones! 🎉<br>
        <div class="win-score">You matched all words correctly!</div>
        <div class="win-time">Time: ${timerDisplay.textContent}</div>`;
    
    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'btn btn-primary';
    playAgainBtn.textContent = 'Play Again';
    playAgainBtn.onclick = () => {
        overlay.remove();
        startGame();
    };
    
    content.appendChild(text);
    content.appendChild(playAgainBtn);
    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Send game completion to API
    const token = localStorage.getItem('auth_token');
    if (token) {
        const gameData = {
            gameType: 'emoji-match',
            score: correctMatches,
            timeSpent: timeLeft,
            xpEarned: Math.floor(correctMatches * 10 + (timeLeft > 0 ? timeLeft/10 : 0)), // XP based on correct matches and time left
            completed: true,
            stats: {
                correctMatches,
                totalMatches: document.querySelectorAll('.cell').length,
                timeSpent: timeLeft,
                streak: streak
            }
        };

        fetch('/api/games/complete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(gameData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Game completion recorded:', data);
            // Show XP earned notification
            showNotification(`¡Excelente! You earned ${gameData.xpEarned} XP!`, 'success');
        })
        .catch(error => {
            console.error('Error recording game completion:', error);
            showNotification('Could not save your progress', 'error');
        });
    }
  }
  
  // Add drop event listener to answers container
  answers.addEventListener('dragover', e => e.preventDefault());
  answers.addEventListener('drop', e => {
    e.preventDefault();
    const draggedAnswer = document.querySelector(".dragging");
    if (!draggedAnswer || !draggedAnswer.classList.contains('dropped-answer')) return;
    
    const newDraggable = document.createElement('div');
    newDraggable.classList.add('draggable');
    newDraggable.setAttribute('draggable', true);
    newDraggable.textContent = draggedAnswer.textContent;
    newDraggable.addEventListener('dragstart', () => handleDragStart(newDraggable));
    newDraggable.addEventListener('dragend', () => handleDragEnd(newDraggable));
    
    const cell = draggedAnswer.parentElement;
    delete cell.dataset.answer;
    draggedAnswer.remove();
    
    answers.appendChild(newDraggable);
  });
  
  // Custom Words Functions
  function showCustomWordsModal() {
    showModal('customModal');
    updateCustomWordList();
  }
  
  function hideCustomWordsModal() {
    hideModal('customModal');
  }
  
  function addCustomWord(word, imageUrl) {
      word = word ? word.trim() : '';
      
      if (!word || word === '') {
          if (customWords.length === 0) {
              showNotification('Please enter a word first', 'error');
          }
          return false;
      }

      const exists = customWords.some(item => item.spanish.toLowerCase() === word.toLowerCase());
      if (exists) {
          showNotification('This word already exists in the list', 'error');
          return false;
      }

      // Add the word to the list
      customWords.push({
          spanish: word,
          emoji: imageUrl || '❓'
      });

      // Update UI and clear input
      updateCustomWordList();
      if (spanishInput) {
          spanishInput.value = '';
      }
      
      // Show layout guidance based on word count
      const currentCount = customWords.length;
      if (currentCount === 1) {
          showNotification('Add 1 more word to start playing', 'info');
      } else if (currentCount === 2) {
          showNotification('You can now start playing! Add more words for a bigger challenge', 'success');
      } else if (currentCount === 4) {
          showNotification('Perfect for a 2x2 grid! Add more for a bigger challenge', 'info');
      } else if (currentCount === 6) {
          showNotification('Great for a 2x3 grid! Add more if you want', 'info');
      } else if (currentCount === 9) {
          showNotification('Perfect 3x3 grid achieved!', 'success');
      } else if (currentCount > 10) {
          showNotification('Adding more words may affect the layout', 'warning');
      } else {
          showNotification('Word added successfully!', 'success');
      }
      return true;
  }
  
  function getNextIdealCount(current) {
      const idealCounts = [2, 4, 6, 8, 10];
      return idealCounts.find(n => n > current) || 10;
  }
  
  // Add new function to handle button state
  function enableStartButton() {
    const startBtn = document.getElementById('startCustomGameBtn');
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.classList.remove('btn-disabled');
      console.log('Start button enabled');
    }
  }
  
  function checkCustomWordsReady() {
    const startBtn = document.getElementById('startCustomGameBtn');
    if (!startBtn) return;
    
    if (customWords.length > 0) {
      startBtn.disabled = false;
      startBtn.classList.remove('btn-disabled');
    } else {
      startBtn.disabled = true;
      startBtn.classList.add('btn-disabled');
    }
  }
  
  // Game Logic Functions
  function returnIncorrectAnswers(cells) {
    cells.forEach(cell => {
      const answer = cell.dataset.answer;
      if (answer !== cell.dataset.fruit) {
        const newDraggable = document.createElement('div');
        newDraggable.classList.add('draggable');
        newDraggable.setAttribute('draggable', true);
        newDraggable.textContent = answer;
        newDraggable.addEventListener('dragstart', () => handleDragStart(newDraggable));
        newDraggable.addEventListener('dragend', () => handleDragEnd(newDraggable));
        
        cell.querySelector('.dropped-answer').remove();
        delete cell.dataset.answer;
        
        answers.appendChild(newDraggable);
        
        cell.classList.add('incorrect');
        setTimeout(() => cell.classList.remove('incorrect'), 500);
      }
    });
  }
  
  // Utility Functions
  function showWinAnimation() {
    const winOverlay = document.createElement('div');
    winOverlay.classList.add('win-overlay');
    const totalQuestions = gameMode === 'custom' ? customWords.length : CATEGORIES[currentCategory].length;
    winOverlay.innerHTML = `
      <div class="win-text">
        YOU WON! 🎉
        <div class="win-score">Score: ${correctMatches}/${totalQuestions}</div>
        <button class="btn btn-primary" onclick="location.reload()">Play Again</button>
      </div>
    `;
    document.body.appendChild(winOverlay);
  }
  
  function showAddedFeedback() {
    const feedback = document.createElement('div');
    feedback.textContent = "Word Added! ✅";
    feedback.style.color = "#4CAF50";
    feedback.style.marginTop = "5px";
    spanishInput.parentNode.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }
  
  function showError(message) {
    const error = document.createElement('div');
    error.textContent = message;
    error.style.color = "#ff4444";
    error.style.marginTop = "5px";
    spanishInput.parentNode.appendChild(error);
    setTimeout(() => error.remove(), 3000);
  }
  
  function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft++;
      timerDisplay.textContent = `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}`;
  
      if (timeLeft >= 60) {
        clearInterval(timer);
        checkAllAnswers();
      }
    }, 1000);
  }
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  function handleImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      mediaPreview.innerHTML = `<img src="${e.target.result}" class="preview-image">`;
    };
    reader.readAsDataURL(file);
  }
  
  // Move updateCustomWordList to global scope
  function updateCustomWordList() {
      const customWordList = document.getElementById('customWordList');
      const startCustomGameBtn = document.getElementById('startCustomGameBtn');
      
      customWordList.innerHTML = '';
      
      if (customWords && customWords.length > 0) {
          customWords.forEach((word, index) => {
              const wordItem = document.createElement('div');
              wordItem.classList.add('word-item');
              
              const mediaDisplay = word.emoji.startsWith('data:') || word.emoji.startsWith('http') 
                  ? `<img src="${word.emoji}" style="width: 30px; height: 30px; object-fit: contain;">`
                  : word.emoji;
                  
              wordItem.innerHTML = `
                  <div class="word-content">
                      ${mediaDisplay}
                      <span>${word.spanish}</span>
                  </div>
                  <button onclick="removeCustomWord(${index})" class="delete-btn">×</button>
              `;
              customWordList.appendChild(wordItem);
          });
          
          // Enable start button
          startCustomGameBtn.disabled = false;
          startCustomGameBtn.classList.remove('btn-disabled');
      } else {
          // Disable start button if no words
          startCustomGameBtn.disabled = true;
          startCustomGameBtn.classList.add('btn-disabled');
      }
  }
  
  // Define removeCustomWord in global scope
  function removeCustomWord(index) {
    customWords.splice(index, 1);
    updateCustomWordList();
    checkCustomWordsReady();
  }
  
  // Theme and fullscreen functions
  function setTheme(theme) {
    currentTheme = theme;
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;
    localStorage.setItem('emoji-game-theme', theme);
    
    // Update theme options UI
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.theme === theme);
    });
  }
  
  function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            // First remove any existing theme classes and add fullscreen
            document.body.className = 'fullscreen';
            
            // Update theme UI
            document.querySelectorAll('.theme-option').forEach(opt => {
                opt.classList.remove('active');
                if (opt.dataset.theme === 'default') {
                    opt.classList.add('active');
                }
            });
            
            // Save theme to localStorage
            localStorage.setItem('emoji-game-theme', 'default');
            
            // Update fullscreen button
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            }
        }).catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen().then(() => {
            document.body.classList.remove('fullscreen');
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }).catch(err => {
            console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
    }
  }
  
  // Initialize theme and fullscreen handlers
  document.addEventListener('DOMContentLoaded', () => {
    // Theme initialization
    setTheme(currentTheme);
    
    // Theme button handlers
    const themeBtn = document.getElementById('themeBtn');
    const closeThemeBtn = document.getElementById('closeThemeBtn');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (themeBtn) {
        themeBtn.addEventListener('click', () => showModal('themeModal'));
    }
    
    if (closeThemeBtn) {
        closeThemeBtn.addEventListener('click', () => hideModal('themeModal'));
    }
    
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            setTheme(theme);
            hideModal('themeModal');
        });
    });
    
    // Fullscreen handlers
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullScreen);
    }
    
    // Fullscreen change event
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            document.body.classList.remove('fullscreen');
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }
    });
  });
  
  document.addEventListener("DOMContentLoaded", () => {
      const addWordBtn = document.getElementById('addWordBtn');
      const spanishInput = document.getElementById('spanishWord');
      const startCustomGameBtn = document.getElementById('startCustomGameBtn');
      const generateLinkBtn = document.getElementById('generateLinkBtn');
      const goBackBtn = document.getElementById('goBackBtn');
      const customBtn = document.querySelector('[data-category="custom"]');
      const fullscreenBtn = document.getElementById('fullscreenBtn');
      const categoryBtns = document.querySelectorAll('.category-btn');
  
      // Initialize game
      startGame();
  
      // Category button listeners
      categoryBtns.forEach(btn => {
          btn.addEventListener('click', () => {
              categoryBtns.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              currentCategory = btn.dataset.category;
              
              if (currentCategory === 'custom') {
                  gameMode = 'custom';
                  if (customWords.length >= 2) {
                      startGame();
                  } else {
                      showCustomWordsModal();
                  }
              } else {
                  gameMode = "normal";
                  startGame();
              }
          });
      });
  
      // Add word button click handler
      if (addWordBtn) {
          addWordBtn.addEventListener('click', () => {
              const word = spanishInput.value.trim();
              addCustomWord(word);
          });
      }
  
      // Enter key handler for word input
      if (spanishInput) {
          spanishInput.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                  const word = spanishInput.value.trim();
                  addCustomWord(word);
              }
          });
      }
  
      // Generate share link button handler
      if (generateLinkBtn) {
          generateLinkBtn.addEventListener('click', generateShareLink);
      }
  
      // Load shared words if any
      loadFromShareLink();
  
      // Initialize custom words list
      updateCustomWordList();
  
      // Set up image search functionality
      setupImageSearch();
  
      // Update goBackBtn event listener
      if (goBackBtn) {
          goBackBtn.addEventListener("click", () => {
              hideCustomWordsModal();
              currentCategory = "fruits";
              gameMode = "normal";
              
              categoryBtns.forEach(btn => {
                  btn.classList.remove("active");
                  if (btn.dataset.category === "fruits") {
                      btn.classList.add("active");
                  }
              });
              
              startGame();
          });
      }
  
      // Add fullscreen button listener
      if (fullscreenBtn) {
          fullscreenBtn.addEventListener("click", toggleFullScreen);
          document.addEventListener("fullscreenchange", handleFullscreenChange);
      }
  
      // Add start custom game button handler
      if (startCustomGameBtn) {
          startCustomGameBtn.addEventListener('click', () => {
              console.log('Custom words count:', customWords.length); // Debug log
              if (Array.isArray(customWords) && customWords.length >= 2) {
                  hideModal('customModal');
                  currentCategory = 'custom';
                  gameMode = 'custom';
                  startGame();
              } else {
                  showNotification(`Please add at least 2 words (current: ${customWords.length})`, 'error');
              }
          });
      }
  
      // Add help button click handler
      if (helpBtn) {
          helpBtn.addEventListener('click', () => {
              helpModal.style.display = 'block';
              document.querySelector('.modal-overlay').style.display = 'block';
          });
      }
  
      // Add close help button click handler
      if (closeHelpBtn) {
          closeHelpBtn.addEventListener('click', () => {
              helpModal.style.display = 'none';
              document.querySelector('.modal-overlay').style.display = 'none';
          });
      }
  
      // Add custom button click handler
      if (customBtn) {
          customBtn.addEventListener('click', () => {
              currentCategory = 'custom';
              gameMode = 'custom';
              if (customWords.length >= 2) {
                  startGame();
              } else {
                  showCustomWordsModal();
              }
          });
      }
  });
  
  // Fix style template literal closing
  const style = document.createElement('style');
  style.textContent = `
    .cell-image {
      max-width: 80%;
      max-height: 80%;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .cell {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 10px;
      position: relative;
    }
    
    .dropped-answer {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      text-align: center;
    }
  `; // Add proper closing backtick
  document.head.appendChild(style);
  
  // Remove unused emoji picker code
  
  function setupBulkUpload() {
      const bulkWords = document.getElementById('bulkWords');
      const bulkImages = document.getElementById('bulkImages');
      const bulkAddBtn = document.getElementById('bulkAddBtn');
      const dropZone = document.querySelector('.bulk-images-drop');
  
      // Handle drag and drop
      dropZone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropZone.classList.add('drag-over');
      });
  
      dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('drag-over');
      });
  
      dropZone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropZone.classList.remove('drag-over');
          bulkImages.files = e.dataTransfer.files;
      });
  
      bulkAddBtn.addEventListener('click', async () => {
          const words = bulkWords.value.split('\n').filter(word => word.trim());
          const files = Array.from(bulkImages.files);
  
          if (words.length !== files.length) {
              showError('Number of words must match number of images');
              return;
          }
  
          for (let i = 0; i < words.length; i++) {
              const word = words[i].trim();
              const file = files[i];
              
              // Convert image to base64
              const base64 = await fileToBase64(file);
              
              customWords.push({
                  spanish: word,
                  emoji: base64
              });
          }
  
          updateCustomWordList();
          bulkWords.value = '';
          bulkImages.value = '';
          showAddedFeedback(`Added ${words.length} words with images`);
      });
  }
  
  function fileToBase64(file) {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }
  
  // Add function to generate shareable link
  function generateShareLink() {
      try {
          const gameState = {
              category: currentCategory,
              score: score,
              time: timeLeft
          };
          const base64State = btoa(encodeURIComponent(JSON.stringify(gameState)));
          return `${window.location.origin}${window.location.pathname}?game=${base64State}`;
      } catch (error) {
          console.error('Share link error:', error);
          return window.location.href;
      }
  }
  
  // Add function to load from shared link
  function loadFromShareLink() {
      const urlParams = new URLSearchParams(window.location.search);
      const data = urlParams.get('data');
      
      if (data) {
          try {
              const decoded = JSON.parse(atob(data));
              customWords = decoded.words;
              updateCustomWordList();
              showNotification('Loaded shared words!');
          } catch (error) {
              console.error('Error loading shared data:', error);
          }
      }
  }
  
  async function setupImageSearch() {
      const imageSearchTrigger = document.getElementById('imageSearchTrigger');
      const imageSearchModal = document.getElementById('imageSearchModal');
      const imageSearchInput = document.getElementById('imageSearchInput');
      const searchImagesBtn = document.getElementById('searchImagesBtn');
      const closeImageSearch = document.getElementById('closeImageSearch');
      const imageSearchResults = document.getElementById('imageSearchResults');
      const loadingSpinner = document.getElementById('imageSearchLoading');
      let selectedWord = '';
  
      // Add file input for custom image upload
      const wordEntry = document.querySelector('.word-entry');
      const spanishInput = document.getElementById('spanishWord');
      spanishInput.placeholder = 'Enter word then click image, emoji or upload';
      
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      fileInput.id = 'customImageInput';
      
      // Add emoji button
      const emojiBtn = document.createElement('button');
      emojiBtn.className = 'emoji-search-btn';
      emojiBtn.innerHTML = '😊';
      emojiBtn.title = 'Add Emoji';
      
      const uploadBtn = document.createElement('button');
      uploadBtn.className = 'image-upload-btn';
      uploadBtn.innerHTML = '<i class="fas fa-upload"></i>';
      uploadBtn.title = 'Upload your own image';
      
      // Add buttons in correct order
      wordEntry.insertBefore(emojiBtn, imageSearchTrigger);
      wordEntry.appendChild(fileInput);
      wordEntry.appendChild(uploadBtn);
  
      // Create emoji picker modal
      const emojiPickerModal = document.createElement('div');
      emojiPickerModal.className = 'modal';
      emojiPickerModal.id = 'emojiPickerModal';
      emojiPickerModal.innerHTML = `
          <div class="modal-content">
              <h3>Search Emojis</h3>
              <div class="search-controls">
                  <input type="text" id="emojiSearchInput" placeholder="Search for emojis...">
                  <button class="btn btn-primary" id="searchEmojisBtn">
                      <i class="fas fa-search"></i> Search
                  </button>
              </div>
              <div class="emoji-results" id="emojiSearchResults"></div>
              <div id="emojiSearchLoading" class="loading-spinner" style="display: none;">
                  Searching...
              </div>
              <div class="modal-buttons">
                  <button class="btn btn-secondary" id="closeEmojiSearch">Close</button>
              </div>
          </div>
      `;
      document.body.appendChild(emojiPickerModal);
  
      // Add emoji button click handler
      emojiBtn.addEventListener('click', () => {
          const wordInput = document.getElementById('spanishWord');
          const word = wordInput.value.trim();
          
          if (!word) {
              showNotification('Please enter a word first', 'error');
              return;
          }
          
          emojiPickerModal.style.display = 'block';
          document.querySelector('.modal-overlay').style.display = 'block';
          searchEmojis(word);
      });
  
      // Add emoji search functionality
      const closeEmojiSearch = document.getElementById('closeEmojiSearch');
      const searchEmojisBtn = document.getElementById('searchEmojisBtn');
      const emojiSearchInput = document.getElementById('emojiSearchInput');
      const emojiSearchResults = document.getElementById('emojiSearchResults');
      const emojiSearchLoading = document.getElementById('emojiSearchLoading');
  
      closeEmojiSearch.addEventListener('click', () => {
          emojiPickerModal.style.display = 'none';
          document.querySelector('.modal-overlay').style.display = 'none';
      });
  
      searchEmojisBtn.addEventListener('click', () => {
          const searchTerm = emojiSearchInput.value.trim();
          if (searchTerm) {
              searchEmojis(searchTerm);
          }
      });
  
      emojiSearchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              const searchTerm = e.target.value.trim();
              if (searchTerm) {
                  searchEmojis(searchTerm);
              }
          }
      });
  
      async function searchEmojis(query) {
          emojiSearchLoading.style.display = 'block';
          emojiSearchResults.innerHTML = '';
  
          try {
              const response = await fetch(`https://emoji-api.com/emojis?search=${encodeURIComponent(query)}&access_key=${EMOJI_API_KEY}`);
              const emojis = await response.json();
              
              emojiSearchLoading.style.display = 'none';
              
              if (!Array.isArray(emojis) || emojis.length === 0) {
                  emojiSearchResults.innerHTML = '<div class="no-results">No emojis found</div>';
                  return;
              }
  
              const emojiGrid = document.createElement('div');
              emojiGrid.className = 'emoji-grid';
              
              emojis.slice(0, 20).forEach(emoji => {
                  const emojiItem = document.createElement('div');
                  emojiItem.className = 'emoji-item';
                  emojiItem.textContent = emoji.character;
                  
                  emojiItem.addEventListener('click', () => {
                      const word = document.getElementById('spanishWord').value.trim();
                      addCustomWord(word, emoji.character);
                      emojiPickerModal.style.display = 'none';
                      document.querySelector('.modal-overlay').style.display = 'none';
                  });
                  
                  emojiGrid.appendChild(emojiItem);
              });
              
              emojiSearchResults.appendChild(emojiGrid);
          } catch (error) {
              console.error('Error fetching emojis:', error);
              emojiSearchLoading.style.display = 'none';
              emojiSearchResults.innerHTML = '<div class="error">Error loading emojis</div>';
          }
      }
  
      // Handle file upload
      uploadBtn.addEventListener('click', () => {
          fileInput.click();
      });
  
      fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (file) {
              const word = document.getElementById('spanishWord').value.trim();
              if (!word) {
                  showNotification('Please enter a word first', 'error');
                  return;
              }
  
              try {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                      addWordWithImage(word, e.target.result);
                      fileInput.value = ''; // Reset file input
                  };
                  reader.readAsDataURL(file);
              } catch (error) {
                  showNotification('Error processing image', 'error');
              }
          }
      });
  
      // Show image search modal
      imageSearchTrigger.addEventListener('click', () => {
          const wordInput = document.getElementById('spanishWord');
          selectedWord = wordInput.value.trim();
          
          if (!selectedWord) {
              showNotification('Please enter a word first', 'error');
              return;
          }
          
          imageSearchInput.value = selectedWord;
          imageSearchModal.style.display = 'block';
          document.querySelector('.modal-overlay').style.display = 'block';
          searchImages(selectedWord);
      });
  
      // Handle image search
      async function searchImagesAPI(query) {
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
                      previewUrl: image.previewURL,
                      width: image.webformatWidth,
                      height: image.webformatHeight
                  }));
              } else {
                  showNotification('No images found. Try a different search term.', 'error');
                  return [];
              }
          } catch (error) {
              console.error('Error fetching images:', error);
              throw new Error('Failed to fetch images from Pixabay');
          }
      }
  
      async function searchImages(query) {
          loadingSpinner.style.display = 'block';
          imageSearchResults.innerHTML = '';
  
          try {
              const images = await searchImagesAPI(query);
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
                      
                      // First load the preview (smaller) image
                      const img = document.createElement('img');
                      img.src = image.previewUrl;
                      img.className = 'image-result';
                      img.alt = query;
                      
                      // Then load the full webformat image
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
                      
                      // Add click handler
                      img.addEventListener('click', () => {
                          addWordWithImage(selectedWord, image.url);
                          imageSearchModal.style.display = 'none';
                          document.querySelector('.modal-overlay').style.display = 'none';
                      });
                  });
                  
                  imageSearchResults.appendChild(imageGrid);
              }
          } catch (error) {
              loadingSpinner.style.display = 'none';
              showNotification('Error searching for images. Please try again.', 'error');
          }
      }
  
      // Close image search modal
      closeImageSearch.addEventListener('click', () => {
          imageSearchModal.style.display = 'none';
          document.querySelector('.modal-overlay').style.display = 'none';
      });
  
      // Search on enter key
      imageSearchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
              const searchTerm = imageSearchInput.value.trim();
              if (searchTerm) {
                  searchImages(searchTerm);
              }
          }
      });
  
      function addWordWithImage(word, imageUrl) {
          if (!word) {
              showNotification('Please enter a word first', 'error');
              return;
          }
  
          // Check if word already exists
          const exists = customWords.some(item => item.spanish.toLowerCase() === word.toLowerCase());
          if (exists) {
              showNotification('This word already exists in the list', 'error');
              return;
          }
  
          customWords.push({
              spanish: word,
              emoji: imageUrl
          });
  
          updateCustomWordList();
          document.getElementById('spanishWord').value = '';
          showNotification('Word added successfully!', 'success');
      }
  }
  
  // Modal functions (global scope)
  function showModal(modalId) {
      const modal = document.getElementById(modalId);
      const overlay = document.querySelector('.modal-overlay');
      if (modal && overlay) {
          overlay.style.display = 'block';
          modal.style.display = 'block';
      }
  }
  
  function hideModal(modalId) {
      const modal = document.getElementById(modalId);
      const overlay = document.querySelector('.modal-overlay');
      if (modal && overlay) {
          overlay.style.display = 'none';
          modal.style.display = 'none';
      }
  }
  
  // Show notification function (global scope)
  function showNotification(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);
  
      setTimeout(() => {
          notification.remove();
      }, 3000);
  }
  
  // Add touch support initialization
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
        getData: () => draggable.dataset.emoji
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
  
  // Initialize touch support when document loads
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize touch support
    if ('ontouchstart' in window) {
      document.body.classList.add('touch-device');
      
      const draggables = document.querySelectorAll('.draggable');
      draggables.forEach(draggable => {
        draggable.addEventListener('touchstart', handleTouchStart, { passive: false });
        draggable.addEventListener('touchmove', handleTouchMove, { passive: false });
        draggable.addEventListener('touchend', handleTouchEnd);
      });
    }

    // Start the game
    startGame();
  });

  // Add theme and fullscreen functionality
  document.addEventListener('DOMContentLoaded', () => {
    // Theme handling
    const themeBtn = document.getElementById('themeBtn');
    const themeModal = document.getElementById('themeModal');
    const closeThemeBtn = document.getElementById('closeThemeBtn');
    const themeOptions = document.querySelectorAll('.theme-option');
    const modalOverlay = document.querySelector('.modal-overlay');

    // Fullscreen handling
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    // Theme functions
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.querySelector('.modal-overlay');
        if (modal && overlay) {
            overlay.style.display = 'block';
            modal.style.display = 'block';
        }
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.querySelector('.modal-overlay');
        if (modal && overlay) {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        }
    }

    function setTheme(theme) {
        document.body.className = theme === 'default' ? '' : `theme-${theme}`;
        localStorage.setItem('emoji-game-theme', theme);
    }

    // Load saved theme
    const savedTheme = localStorage.getItem('emoji-game-theme');
    if (savedTheme) {
        setTheme(savedTheme);
        document.querySelector(`[data-theme="${savedTheme}"]`)?.classList.add('active');
    }

    // Theme event listeners
    themeBtn.addEventListener('click', () => showModal('themeModal'));
    closeThemeBtn.addEventListener('click', () => hideModal('themeModal'));
    modalOverlay.addEventListener('click', () => hideModal('themeModal'));

    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            themeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            setTheme(theme === 'default' ? '' : theme);
        });
    });

    // Fullscreen functions
    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                // First remove any existing theme classes and add fullscreen
                document.body.className = 'fullscreen';
                
                // Update theme UI
                document.querySelectorAll('.theme-option').forEach(opt => {
                    opt.classList.remove('active');
                    if (opt.dataset.theme === 'default') {
                        opt.classList.add('active');
                    }
                });
                
                // Save theme to localStorage
                localStorage.setItem('emoji-game-theme', 'default');
                
                // Update fullscreen button
                const fullscreenBtn = document.getElementById('fullscreenBtn');
                if (fullscreenBtn) {
                    fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                }
            }).catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                document.body.classList.remove('fullscreen');
                const fullscreenBtn = document.getElementById('fullscreenBtn');
                if (fullscreenBtn) {
                    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                }
            }).catch(err => {
                console.error(`Error attempting to exit fullscreen: ${err.message}`);
            });
        }
    }

    // Handle fullscreen change events
    function handleFullscreenChange() {
        if (!document.fullscreenElement) {
            document.body.classList.remove('fullscreen');
            const fullscreenBtn = document.getElementById('fullscreenBtn');
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        }
    }

    fullscreenBtn.addEventListener('click', toggleFullScreen);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Show notification function
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
  });

  // Add custom button functionality
  document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements
    const customBtn = document.getElementById('customBtn');
    const customWordsModal = document.getElementById('customModal');
    const imageSearchModal = document.getElementById('imageSearchModal');
    const imageSearchTrigger = document.getElementById('imageSearchTrigger');
    const closeImageSearch = document.getElementById('closeImageSearch');
    const addWordBtn = document.getElementById('addWordBtn');
    const goBackBtn = document.getElementById('goBackBtn');
    const startCustomGameBtn = document.getElementById('startCustomGameBtn');
    const generateLinkBtn = document.getElementById('generateLinkBtn');
    const spanishInput = document.getElementById('spanishWord');
    const customWordList = document.getElementById('customWordList');
    const imageSearchInput = document.getElementById('imageSearchInput');
    const searchImagesBtn = document.getElementById('searchImagesBtn');
    const imageSearchResults = document.getElementById('imageSearchResults');
    const imageSearchLoading = document.getElementById('imageSearchLoading');

    // Custom words functions
    function showCustomWordsModal() {
        hideModal('themeModal');
        showModal('customModal');
        updateCustomWordList(); // Make sure list is up to date
    }

    function addCustomWord(word, imageUrl) {
        word = word ? word.trim() : '';
        
        if (!word || word === '') {
            if (customWords.length === 0) {
                showNotification('Please enter a word first', 'error');
            }
            return false;
        }

        const exists = customWords.some(item => item.spanish.toLowerCase() === word.toLowerCase());
        if (exists) {
            showNotification('This word already exists in the list', 'error');
            return false;
        }

        // Add the word to the list
        customWords.push({
            spanish: word,
            emoji: imageUrl || '❓'
        });

        // Update UI and clear input
        updateCustomWordList();
        if (spanishInput) {
            spanishInput.value = '';
        }
        
        // Show layout guidance based on word count
        const currentCount = customWords.length;
        if (currentCount === 1) {
            showNotification('Add 1 more word to start playing', 'info');
        } else if (currentCount === 2) {
            showNotification('You can now start playing! Add more words for a bigger challenge', 'success');
        } else if (currentCount === 4) {
            showNotification('Perfect for a 2x2 grid! Add more for a bigger challenge', 'info');
        } else if (currentCount === 6) {
            showNotification('Great for a 2x3 grid! Add more if you want', 'info');
        } else if (currentCount === 9) {
            showNotification('Perfect 3x3 grid achieved!', 'success');
        } else if (currentCount > 10) {
            showNotification('Adding more words may affect the layout', 'warning');
        } else {
            showNotification('Word added successfully!', 'success');
        }
        return true;
    }

    function updateCustomWordList() {
        if (customWordList) {
            customWordList.innerHTML = customWords.map((word, index) => `
                <div class="word-item">
                    <div class="word-content">
                        ${word.emoji.startsWith('data:') || word.emoji.startsWith('http') 
                            ? `<img src="${word.emoji}" alt="${word.spanish}">` 
                            : word.emoji}
                        <span>${word.spanish}</span>
                    </div>
                    <button class="delete-btn" onclick="removeCustomWord(${index})">×</button>
                </div>
            `).join('');

            // Update start button state
            if (startCustomGameBtn) {
                startCustomGameBtn.disabled = customWords.length < 2;
                startCustomGameBtn.classList.toggle('btn-disabled', customWords.length < 2);
            }
        }
    }

    // Event listeners
    if (customBtn) {
        customBtn.addEventListener('click', showCustomWordsModal);
    }

    if (imageSearchTrigger) {
        imageSearchTrigger.addEventListener('click', () => {
            const word = spanishInput ? spanishInput.value.trim() : '';
            if (word && word !== '') {
                showModal('imageSearchModal');
                if (imageSearchInput) {
                    imageSearchInput.value = word;
                    searchImages(word);
                }
            }
        });
    }

    if (closeImageSearch) {
        closeImageSearch.addEventListener('click', () => hideModal('imageSearchModal'));
    }

    if (addWordBtn) {
        addWordBtn.addEventListener('click', () => {
            const word = spanishInput ? spanishInput.value.trim() : '';
            addCustomWord(word);
        });
    }

    if (spanishInput) {
        spanishInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const word = spanishInput.value.trim();
                addCustomWord(word);
            }
        });
    }

    if (goBackBtn) {
        goBackBtn.addEventListener('click', () => hideModal('customModal'));
    }

    if (generateLinkBtn) {
        generateLinkBtn.addEventListener('click', generateShareLink);
    }

    if (startCustomGameBtn) {
        startCustomGameBtn.addEventListener('click', () => {
            console.log('Custom words count:', customWords.length); // Debug log
            if (Array.isArray(customWords) && customWords.length >= 2) {
                hideModal('customModal');
                currentCategory = 'custom';
                gameMode = 'custom';
                startGame();
            } else {
                showNotification(`Please add at least 2 words (current: ${customWords.length})`, 'error');
            }
        });
    }

    // Load shared words if any
    loadFromShareLink();
  });

  // Add window.removeCustomWord for the onclick handler
  window.removeCustomWord = function(index) {
    const customWordList = document.getElementById('customWordList');
    const startCustomGameBtn = document.getElementById('startCustomGameBtn');
    
    customWords.splice(index, 1);
    
    customWordList.innerHTML = customWords.map((word, idx) => `
        <div class="word-item">
            <div class="word-content">
                ${word.emoji.startsWith('data:') || word.emoji.startsWith('http') 
                    ? `<img src="${word.emoji}" alt="${word.spanish}">` 
                    : word.emoji}
                <span>${word.spanish}</span>
            </div>
            <button class="delete-btn" onclick="removeCustomWord(${idx})">×</button>
        </div>
    `).join('');
    
    startCustomGameBtn.disabled = customWords.length < 2;
  };

  // Image search functions
  async function searchImages(query) {
    if (imageSearchLoading && imageSearchResults) {
        imageSearchLoading.style.display = 'block';
        imageSearchResults.innerHTML = '';

        try {
            const images = await searchImagesAPI(query);
            imageSearchLoading.style.display = 'none';
            
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
                    img.alt = query;
                    
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
                        addCustomWord(spanishInput.value.trim(), image.url);
                        hideModal('imageSearchModal');
                    });
                });
                
                imageSearchResults.appendChild(imageGrid);
            }
        } catch (error) {
            imageSearchLoading.style.display = 'none';
            showNotification('Error searching for images. Please try again.', 'error');
        }
    }
  }

  async function searchImagesAPI(query) {
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
            showNotification('No images found. Try a different search term.', 'error');
            return [];
        }
    } catch (error) {
        console.error('Error fetching images:', error);
        throw new Error('Failed to fetch images from Pixabay');
    }
  }

  // Add search button click handler
  if (searchImagesBtn) {
    searchImagesBtn.addEventListener('click', () => {
        const searchTerm = imageSearchInput.value.trim();
        if (searchTerm) {
            searchImages(searchTerm);
        }
    });
  }

  // Add search input enter key handler
  if (imageSearchInput) {
    imageSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = imageSearchInput.value.trim();
            if (searchTerm) {
                searchImages(searchTerm);
            }
        }
    });
  }

  // Initialize everything when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    initMusicControls();
    preloadSounds();
    
    // Add search input enter key handler
    if (imageSearchInput) {
        imageSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const searchTerm = imageSearchInput.value.trim();
                if (searchTerm) {
                    searchImages(searchTerm);
                }
            }
        });
    }

    // Start the game
    startGame();
  });

  async function saveGameProgress() {
    if (!auth.currentUser) {
        console.warn('User not authenticated, progress will not be saved');
        return;
    }

    const gameProgress = {
        score: score,
        level: 1, // Assuming a single level for simplicity
        timestamp: new Date(),
        // Add any other relevant game data
    };

    await progressTracker.saveProgress(gameProgress);
  }

  async function loadGameProgress() {
    if (!auth.currentUser) {
        console.warn('User not authenticated, no progress to load');
        return;
    }

    const progress = await progressTracker.loadProgress();
    if (progress) {
        score = progress.score || 0;
        updateUI();
    }
  }

  // Initialize game with auth check
  async function initializeGame() {
    try {
        // Wait for auth state to be determined
        await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });

        // Load progress if user is authenticated
        if (auth.currentUser) {
            await loadGameProgress();
        }

        // Start the game
        startGame();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
  }

  // Update event listeners
  document.addEventListener('DOMContentLoaded', initializeGame);
  // Add auth state change listener
  auth.onAuthStateChanged((user) => {
    const authStatus = document.getElementById('auth-status');
    if (authStatus) {
        if (user) {
            authStatus.textContent = `Logged in as: ${user.email}`;
            loadGameProgress(); // Load progress when user logs in
        } else {
            authStatus.textContent = 'Not logged in';
        }
    }
  });
