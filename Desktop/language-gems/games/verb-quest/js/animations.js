export const animations = {
    test: () => {
        console.log('Animations module is working');
    },
    startExploringAnimation: (element) => {
        if (!element) return;
        element.classList.add('exploring-animation');
    },
    regionTransition: (element) => {
        if (!element) return;
        element.classList.add('region-transition');
    },
    victory: (element) => {
        if (!element) return;
        element.classList.add('victory-animation');
    },
    defeat: (element) => {
        if (!element) return;
        element.classList.add('defeat-animation');
    },
    wrongAnswer: (element) => {
        if (!element) return;
        element.classList.add('wrong-answer-animation');
        setTimeout(() => {
            element.classList.remove('wrong-answer-animation');
        }, 1000);
    },
    spellCast: (element) => {
        if (!element) return;
        element.classList.add('spell-cast-animation');
        setTimeout(() => {
            element.classList.remove('spell-cast-animation');
        }, 1000);
    }
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .shake-animation {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }

    .correct-flash {
        animation: correctFlash 0.5s ease-out;
    }

    .wrong-flash {
        animation: wrongFlash 0.5s ease-out;
    }

    .enemy-attack {
        animation: enemyAttack 1s ease-in-out;
    }

    .boss-phase-transition {
        animation: bossPhaseTransition 1s ease-in-out;
    }

    .ability-effect {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100px;
        height: 100px;
        animation: ability-pulse 1s ease-out;
    }

    .region-transition {
        animation: regionTransition 1s ease-in-out;
    }

    @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
    }

    @keyframes correctFlash {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.5) sepia(1) hue-rotate(90deg); }
        100% { filter: brightness(1); }
    }

    @keyframes wrongFlash {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.5) sepia(1) hue-rotate(-45deg); }
        100% { filter: brightness(1); }
    }

    @keyframes enemyAttack {
        0% { transform: translateX(0); }
        25% { transform: translateX(-20px); }
        50% { transform: translateX(0); }
        75% { transform: translateX(20px); }
        100% { transform: translateX(0); }
    }

    @keyframes bossPhaseTransition {
        0% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.2); filter: brightness(1.5); }
        100% { transform: scale(1); filter: brightness(1); }
    }

    @keyframes ability-pulse {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
    }

    @keyframes regionTransition {
        0% { opacity: 0; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.2); }
    }

    .victory-sparkles {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        background: 
            radial-gradient(circle at 20% 20%, #fdbb2d 1px, transparent 3px),
            radial-gradient(circle at 80% 40%, #fdbb2d 1px, transparent 3px),
            radial-gradient(circle at 40% 60%, #fdbb2d 1px, transparent 3px),
            radial-gradient(circle at 70% 80%, #fdbb2d 1px, transparent 3px);
        animation: sparkle 2s ease-in-out;
    }

    @keyframes sparkle {
        0% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1.2); }
        100% { opacity: 0; transform: scale(1.5); }
    }
`;
document.head.appendChild(styleSheet);
