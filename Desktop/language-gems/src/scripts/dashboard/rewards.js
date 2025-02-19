class RewardSystem {
    constructor(user) {
        this.user = user;
        this.gems = user.gems || 0;
        this.rewards = {
            dailyStreak: { days: 5, gems: 50 },
            wordsMastered: { count: 10, gems: 20 },
            perfectGame: { gems: 30 }
        };
    }

    awardGems(amount, reason) {
        this.gems += amount;
        this.saveGems();
        this.showRewardAnimation(amount, reason);
    }

    showRewardAnimation(amount, reason) {
        const rewardDiv = document.createElement('div');
        rewardDiv.className = 'reward-popup';
        rewardDiv.innerHTML = `
            <span class="gem-icon">💎</span>
            <span class="gem-amount">+${amount}</span>
            <span class="reward-reason">${reason}</span>
        `;
        document.body.appendChild(rewardDiv);
        setTimeout(() => rewardDiv.remove(), 3000);
    }

    saveGems() {
        // Update local storage and sync with backend
        localStorage.setItem('userGems', this.gems);
        this.syncWithServer();
    }

    async syncWithServer() {
        // Mock API call - replace with real backend
        try {
            await fetch('your-api/update-gems', {
                method: 'POST',
                body: JSON.stringify({ userId: this.user.id, gems: this.gems })
            });
        } catch (e) {
            console.error('Failed to sync gems:', e);
        }
    }
}
