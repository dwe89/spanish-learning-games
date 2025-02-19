export class Enemy {
    constructor(config) {
        this.name = config.name;
        this.type = config.type;
        this.region = config.region;
        this.level = config.level;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.abilities = config.abilities || [];
        this.isBoss = config.isBoss || false;
        this.currentPhase = 1;
        this.enraged = false;
        this.damageMultiplier = 1;
        this.phaseThresholds = config.isBoss ? {
            1: 1.0,
            2: 0.6,
            3: 0.3
        } : null;
    }

    useSpecialAbility() {
        if (this.abilities.length === 0) return null;
        // Boss enemies use phase-specific abilities
        if (this.isBoss) {
            const phaseAbilities = this.abilities.filter(a => a.phase === this.currentPhase);
            return phaseAbilities[Math.floor(Math.random() * phaseAbilities.length)];
        }
        return this.abilities[Math.floor(Math.random() * this.abilities.length)];
    }
}
