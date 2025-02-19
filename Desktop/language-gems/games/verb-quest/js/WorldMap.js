import { regions, DEV_MODE } from './data/regions.js';

export class WorldMap {
    constructor(game) {
        this.game = game;
        this.container = document.createElement('div');
        this.container.className = 'world-map';
    }

    initialize() {
        try {
            // Validate region data
            this.validateRegionsData();

            // Create and append map container
            const mapContainer = document.createElement('div');
            mapContainer.className = 'map-container';
            
            // Create connections between nodes first
            const connectionsHtml = Object.entries(regions).map(([id, region]) => {
                if (!region.connections) return '';
                
                return region.connections.map(targetId => {
                    const targetRegion = regions[targetId];
                    if (!targetRegion) return '';
                    
                    const isUnlocked = DEV_MODE || 
                        (this.game.unlockedRegions.includes(id) && this.game.unlockedRegions.includes(targetId));
                    
                    const distance = this.calculateDistance(region.position, targetRegion.position);
                    const angle = this.calculateAngle(region.position, targetRegion.position);
                    
                    return `
                        <div class="region-connection ${!isUnlocked ? 'locked' : ''}"
                             style="
                                left: ${region.position.x}%;
                                top: ${region.position.y}%;
                                width: ${distance}px;
                                transform: rotate(${angle}deg);
                             ">
                        </div>
                    `;
                }).join('');
            }).join('');

            // Create HTML for region nodes
            const regionsHtml = Object.entries(regions).map(([id, region]) => {
                const isUnlocked = DEV_MODE || this.game.unlockedRegions.includes(id);
                const isCompleted = this.game.getRegionProgress(id) === 100;
                
                return `
                    <div class="region-node ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}"
                         data-region-id="${id}"
                         style="left: ${region.position.x}%; top: ${region.position.y}%">
                        <div class="region-circle">
                            <div class="region-number">Level ${region.number}</div>
                        </div>
                        <div class="region-name">${region.name}</div>
                        ${!isUnlocked ? '<div class="region-status">Locked</div>' : ''}
                        <div class="region-info">
                            <h3>${region.name}</h3>
                            <p>${region.description}</p>
                            ${!isUnlocked ? `<p class="required-level">Requires Level ${region.requiredLevel}</p>` : ''}
                        </div>
                    </div>
                `;
            }).join('');

            // Set content and return
            mapContainer.innerHTML = connectionsHtml + regionsHtml;
            this.container.appendChild(mapContainer);
            this.setupEventListeners();
            
            console.log('World map initialized with:', {
                regions: Object.keys(regions),
                connections: connectionsHtml.length,
                nodes: regionsHtml.length
            });
            
            return this.container;

        } catch (error) {
            console.error('Error initializing WorldMap:', error);
            return document.createElement('div');
        }
    }

    calculateDistance(pos1, pos2) {
        const dx = (pos2.x - pos1.x) * window.innerWidth / 100;
        const dy = (pos2.y - pos1.y) * window.innerHeight / 100;
        return Math.sqrt(dx * dx + dy * dy);
    }

    calculateAngle(pos1, pos2) {
        return Math.atan2(
            (pos2.y - pos1.y) * window.innerHeight / 100,
            (pos2.x - pos1.x) * window.innerWidth / 100
        ) * 180 / Math.PI;
    }

    validateRegionsData() {
        Object.entries(regions).forEach(([id, region]) => {
            if (!region.position || region.position.x == null || region.position.y == null) {
                console.error(`Region ${id} is missing position data:`, region);
            }
            if (!region.requiredLevel || region.requiredLevel <= 0) {
                console.error(`Region ${id} has invalid requiredLevel:`, region);
            }
            if (!Array.isArray(region.connections)) {
                console.error(`Region ${id} connections should be an array:`, region);
            }
        });
    }

    setupEventListeners() {
        const nodes = this.container.querySelectorAll('.region-node');
        
        nodes.forEach(node => {
            node.addEventListener('click', (e) => {
                const regionId = node.dataset.regionId;
                
                // In dev mode, all regions are accessible
                if (DEV_MODE || this.game.unlockedRegions.includes(regionId)) {
                    this.game.enterRegion(regionId);
                } else {
                    const region = regions[regionId];
                    if (region) {
                        this.game.showMessage(`Requires Level ${region.requiredLevel}`);
                    }
                }
            });
        });
    }
}