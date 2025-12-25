/* ============================================
   Snowflakes Effect
   Active from Dec 25 00:00 to Jan 1 23:59 every year
   ============================================ */

(function () {
    // Check if we're in the snowfall period
    function isSnowfallPeriod() {
        const now = new Date();
        const month = now.getMonth(); // 0-11
        const day = now.getDate();

        // December 25-31 (month = 11, day >= 25)
        if (month === 11 && day >= 25) return true;

        // January 1 (month = 0, day = 1)
        if (month === 0 && day === 1) return true;

        return false;
    }

    // Only run snowflakes during the period
    if (!isSnowfallPeriod()) return;

    // Create snowflakes container
    const snowContainer = document.createElement('div');
    snowContainer.className = 'snowflakes-container';
    snowContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(snowContainer);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .snowflakes-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        }

        .snowflake {
            position: absolute;
            top: -20px;
            color: white;
            font-size: 1rem;
            text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
            animation: snowfall linear infinite;
            opacity: 0.9;
        }

        @keyframes snowfall {
            0% {
                transform: translateY(-20px) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(360deg);
                opacity: 0.5;
            }
        }

        @keyframes sway {
            0%, 100% {
                transform: translateX(0);
            }
            50% {
                transform: translateX(20px);
            }
        }
    `;
    document.head.appendChild(style);

    // Snowflake characters
    const snowflakes = ['❄', '❅', '❆', '✻', '✼', '❉', '✿'];

    // Create snowflakes
    function createSnowflake() {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];

        // Random position
        flake.style.left = Math.random() * 100 + 'vw';

        // Random size
        const size = Math.random() * 1.5 + 0.5;
        flake.style.fontSize = size + 'rem';

        // Random animation duration
        const duration = Math.random() * 5 + 5; // 5-10 seconds
        flake.style.animationDuration = duration + 's';

        // Random delay
        flake.style.animationDelay = Math.random() * 3 + 's';

        // Random opacity
        flake.style.opacity = Math.random() * 0.6 + 0.4;

        snowContainer.appendChild(flake);

        // Remove after animation
        setTimeout(() => {
            flake.remove();
        }, (duration + 3) * 1000);
    }

    // Create initial batch
    for (let i = 0; i < 30; i++) {
        setTimeout(() => createSnowflake(), i * 200);
    }

    // Continue creating snowflakes
    setInterval(createSnowflake, 300);
})();
