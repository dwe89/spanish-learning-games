export class GameMenu {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.menuElement = document.getElementById('menu');
    }

    toggle() {
        this.visible = !this.visible;
        if (this.menuElement) {
            this.menuElement.style.display = this.visible ? 'block' : 'none';
        }
        this.updateMenuContent();
    }

    show() {
        this.visible = true;
        if (this.menuElement) {
            this.menuElement.style.display = 'block';
        }
        this.updateMenuContent();
    }

    hide() {
        this.visible = false;
        if (this.menuElement) {
            this.menuElement.style.display = 'none';
        }
    }

    updateMenuContent() {
        // Base method to be overridden by child classes
        if (!this.menuElement) return;
        this.menuElement.innerHTML = '<div class="menu-content"></div>';
    }
}