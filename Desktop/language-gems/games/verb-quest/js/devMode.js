// Dev mode utilities
export const DevMode = {
    isEnabled: false,
    debugLevel: 0, // 0: errors only, 1: warnings, 2: info, 3: verbose

    enable() {
        this.isEnabled = true;
        this.debugLevel = 3;
        console.log('[DevMode] Enabled with debug level:', this.debugLevel);
        window.DEV_MODE = true;
        
        // Expose dev tools before using them
        this.exposeDevTools();
        
        // Create dev panel and ensure it's visible
        this.createDevPanel();
        
        // Force panel to be visible
        const panel = document.getElementById('devPanel');
        if (panel) {
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            panel.classList.add('visible');
        }
        
        // Unlock all regions when dev mode is enabled
        if (window.game) {
            window.devTools.unlockAllRegions();
            // Force game screen update
            window.game.updateGameScreen();
        }
        
        localStorage.setItem('devMode', 'true');
        console.log('[DevMode] Dev mode enabled successfully');
    },

    disable() {
        this.isEnabled = false;
        this.debugLevel = 0;
        console.log('[DevMode] Disabled');
        window.DEV_MODE = false;
        this.removeDevPanel();
        this.removeDebugOverlay();
        localStorage.removeItem('devMode');
        
        // Force game screen update
        if (window.game) {
            window.game.updateGameScreen();
        }
    },

    log(message, level = 2) {
        if (this.debugLevel >= level) {
            console.log(`[DevMode] ${message}`);
        }
    },

    error(message, error = null) {
        console.error(`[DevMode] Error: ${message}`, error || '');
    },

    warn(message) {
        if (this.debugLevel >= 1) {
            console.warn(`[DevMode] Warning: ${message}`);
        }
    },

    createDevPanel() {
        this.removeDevPanel(); // Remove existing panel if any

        const panel = document.createElement('div');
        panel.id = 'devPanel';
        panel.className = 'dev-panel visible';
        
        // Force panel styles
        panel.style.cssText = `
            position: fixed;
            top: 60px;
            right: 10px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #666;
            border-radius: 8px;
            padding: 15px;
            z-index: 9999;
            color: #fff;
            font-family: monospace;
            min-width: 250px;
            display: block !important;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        `;
        
        panel.innerHTML = `
            <h3>Dev Tools</h3>
            
            <div class="dev-panel-section">
                <div class="dev-stats">
                    Level: <span id="devStatsLevel">1</span><br>
                    XP: <span id="devStatsXP">0</span><br>
                    Region: <span id="devStatsRegion">None</span>
                </div>
            </div>

            <div class="dev-panel-section">
                <button class="dev-btn" id="toggleDebugBtn">Toggle Debug Overlay</button>
                <button class="dev-btn" id="showStateBtn">Show Game State</button>
            </div>

            <div class="dev-panel-section">
                <button class="dev-btn success" id="unlockRegionsBtn">Unlock All Regions</button>
                <button class="dev-btn success" id="skipBattleBtn">Skip Current Battle</button>
            </div>

            <div class="dev-panel-section">
                <button class="dev-btn" id="setLevelBtn">Set Level</button>
                <button class="dev-btn" id="completeRegionBtn">Complete Current Region</button>
            </div>

            <div class="dev-panel-section">
                <button class="dev-btn danger" id="resetBtn">Reset Progress</button>
            </div>
        `;

        document.body.appendChild(panel);
        this.startDevPanelUpdates();
        this.setupDevPanelButtons();
        
        // Force panel to be visible
        requestAnimationFrame(() => {
            panel.style.display = 'block';
            panel.style.visibility = 'visible';
            panel.style.opacity = '1';
            console.log('[DevMode] Dev panel created and made visible');
            
            // Style all buttons in the panel
            panel.querySelectorAll('.dev-btn').forEach(btn => {
                btn.style.cssText = `
                    display: block;
                    width: 100%;
                    padding: 8px;
                    margin: 5px 0;
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 4px;
                    color: #fff;
                    cursor: pointer;
                    font-size: 12px;
                    text-align: left;
                    transition: all 0.2s ease;
                `;
            });
        });
    },

    setupDevPanelButtons() {
        const panel = document.getElementById('devPanel');
        if (!panel) return;

        // Toggle Debug Overlay
        panel.querySelector('#toggleDebugBtn').addEventListener('click', () => {
            window.devTools.toggleDebugOverlay();
        });

        // Show Game State
        panel.querySelector('#showStateBtn').addEventListener('click', () => {
            window.devTools.showGameState();
        });

        // Unlock All Regions
        panel.querySelector('#unlockRegionsBtn').addEventListener('click', () => {
            window.devTools.unlockAllRegions();
        });

        // Skip Battle
        panel.querySelector('#skipBattleBtn').addEventListener('click', () => {
            window.devTools.skipBattle();
        });

        // Set Level
        panel.querySelector('#setLevelBtn').addEventListener('click', () => {
            const level = prompt('Enter level:', '1');
            window.devTools.setLevel(level);
        });

        // Complete Region
        panel.querySelector('#completeRegionBtn').addEventListener('click', () => {
            window.devTools.completeRegion(window.game?.currentRegion);
        });

        // Reset Progress
        panel.querySelector('#resetBtn').addEventListener('click', () => {
            window.devTools.resetProgress();
        });
    },

    removeDevPanel() {
        const panel = document.getElementById('devPanel');
        if (panel) {
            panel.remove();
        }
        if (this._devPanelInterval) {
            clearInterval(this._devPanelInterval);
        }
    },

    startDevPanelUpdates() {
        const updateStats = () => {
            if (!window.game?.player) return;
            
            const levelSpan = document.getElementById('devStatsLevel');
            const xpSpan = document.getElementById('devStatsXP');
            const regionSpan = document.getElementById('devStatsRegion');
            
            if (levelSpan) levelSpan.textContent = window.game.player.level;
            if (xpSpan) xpSpan.textContent = `${window.game.player.xp}/${window.game.player.xpToNextLevel}`;
            if (regionSpan) regionSpan.textContent = window.game.currentRegion || 'None';
        };

        updateStats();
        this._devPanelInterval = setInterval(updateStats, 1000);
    },

    exposeDevTools() {
        window.devTools = {
            setLevel: (level) => {
                if (!window.game?.player) return;
                level = parseInt(level);
                if (isNaN(level) || level < 1) return;
                window.game.player.level = level;
                window.game.player.xp = 0;
                window.game.player.xpToNextLevel = level * 100;
                window.game.player.updateUI();
                this.log(`Set player level to ${level}`);
            },

            unlockAllRegions: () => {
                if (!window.game) {
                    console.error('[DevMode] Game instance not found');
                    return;
                }
                console.log('[DevMode] Unlocking all regions...'); // Debug log
                
                // Get all region IDs
                const regionIds = Object.keys(window.game.regions);
                console.log('[DevMode] Found regions:', regionIds); // Debug log
                
                // Add each region to unlockedRegions if not already there
                regionIds.forEach(regionId => {
                    if (!window.game.unlockedRegions.includes(regionId)) {
                        console.log('[DevMode] Unlocking region:', regionId); // Debug log
                        window.game.unlockedRegions.push(regionId);
                    }
                });
                
                // Set player to max level to ensure access
                if (window.game.player) {
                    window.game.player.level = 20;
                    window.game.player.updateUI();
                }
                
                // Update the game screen
                window.game.updateGameScreen();
                this.log('All regions unlocked and player level set to max');
                
                // Show confirmation message
                window.game.showMessage('All regions unlocked!');
            },

            completeRegion: (regionId) => {
                if (!window.game || !regionId) {
                    console.log('No game or region ID provided'); // Debug log
                    return;
                }
                
                const region = window.game.regions[regionId];
                if (!region) {
                    console.log('Region not found:', regionId); // Debug log
                    return;
                }
                
                console.log('Completing region:', regionId); // Debug log
                console.log('Region enemies:', region.enemies); // Debug log
                
                region.enemies.forEach(enemy => {
                    console.log('Marking enemy as defeated:', enemy.name); // Debug log
                    window.game.defeatedEnemies.add(enemy.name);
                });
                
                window.game.player.levelUp();
                window.game.updateGameScreen();
                this.log(`Completed region: ${regionId}`);
            },

            resetProgress: () => {
                if (confirm('Are you sure you want to reset all progress?')) {
                    localStorage.removeItem('verbQuestSave');
                    localStorage.removeItem('devMode');
                    this.log('Progress reset. Refresh to start new game.');
                    location.reload();
                }
            },

            skipBattle: () => {
                if (!window.game?.currentBattle) {
                    console.log('No active battle found'); // Debug log
                    alert('No active battle to skip!');
                    return;
                }
                
                console.log('Skipping battle...'); // Debug log
                const battle = window.game.currentBattle;
                const enemy = battle.enemy;
                
                console.log('Enemy:', enemy); // Debug log
                window.game.defeatedEnemies.add(enemy.name);
                window.game.player.gainXP(enemy.xpReward);
                window.game.enterExplorationMode();
                this.log(`Skipped battle with ${enemy.name}`);
            },

            showGameState: () => {
                this.showGameState();
            },

            toggleDebugOverlay: () => {
                this.toggleDebugOverlay();
            }
        };

        this.log('Dev tools exposed to window.devTools');
    },

    showGameState() {
        if (!window.game) return;
        console.group('Game State');
        console.log('Player:', {
            level: window.game.player.level,
            xp: window.game.player.xp,
            xpToNextLevel: window.game.player.xpToNextLevel,
            hp: window.game.player.hp,
            maxHp: window.game.player.maxHp
        });
        console.log('Current Region:', window.game.currentRegion);
        console.log('Unlocked Regions:', [...window.game.unlockedRegions]);
        console.log('Defeated Enemies:', [...window.game.defeatedEnemies]);
        console.log('Game State:', window.game.gameState);
        console.groupEnd();
    },

    toggleDebugOverlay() {
        let overlay = document.getElementById('debug-overlay');
        if (overlay) {
            this.removeDebugOverlay();
        } else {
            this.createDebugOverlay();
        }
    },

    removeDebugOverlay() {
        const overlay = document.getElementById('debug-overlay');
        if (overlay) {
            overlay.remove();
        }
    },

    createDebugOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
        `;
        
        const updateOverlay = () => {
            if (!window.game?.player) return;
            
            overlay.innerHTML = `
                FPS: ${Math.round(1000 / (performance.now() - this._lastFrame))}
                Game State: ${window.game.gameState}
                Current Region: ${window.game.currentRegion || 'None'}
                Player Level: ${window.game.player.level}
                XP: ${window.game.player.xp}/${window.game.player.xpToNextLevel}
                HP: ${window.game.player.hp}/${window.game.player.maxHp}
                Dev Mode: ${this.isEnabled ? 'Enabled' : 'Disabled'}
                Debug Level: ${this.debugLevel}
            `.replace(/\n/g, '<br>');
            
            this._lastFrame = performance.now();
        };
        
        document.body.appendChild(overlay);
        this._lastFrame = performance.now();
        this._debugInterval = setInterval(updateOverlay, 1000 / 30); // 30 FPS updates
    }
};

// Initialize dev mode based on URL parameter or localStorage
if (window.location.search.includes('dev=true') || localStorage.getItem('devMode') === 'true') {
    DevMode.enable();
} 