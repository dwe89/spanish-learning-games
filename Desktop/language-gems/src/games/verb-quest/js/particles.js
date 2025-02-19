const ParticleSystem = {
    create(type, x, y) {
        const particle = document.createElement('div');
        particle.className = `particle ${type}`;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    }
};
