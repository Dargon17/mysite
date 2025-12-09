/**
 * Hidden Snake Game Easter Egg
 * Triggers:
 * 1. Desktop: Konami Code (Up, Up, Down, Down, Left, Right, Left, Right, B, A)
 * 2. Mobile: Tap profile picture 5 times rapidly
 */

class SnakeGame {
    constructor() {
        this.isActive = false;
        this.score = 0;
        this.highScore = localStorage.getItem('snake-highscore') || 0;
        this.gameInterval = null;
        this.gridSize = 20;
        this.snake = [];
        this.food = { x: 0, y: 0 };
        this.direction = 'right';
        this.nextDirection = 'right';
        this.speed = 100;

        this.touchStartX = 0;
        this.touchStartY = 0;

        // Setup triggers
        this.setupTriggers();
    }

    setupTriggers() {
        // Konami Code
        const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let konamiIndex = 0;

        document.addEventListener('keydown', (e) => {
            if (this.isActive) return;

            if (e.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    this.start();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        });

        // Mobile Tap Trigger
        const profilePic = document.querySelector('.profile-pic');
        if (profilePic) {
            let tapCount = 0;
            let tapTimer = null;

            profilePic.addEventListener('click', (e) => {
                // Prevent default behavior if needed, or let it pass?
                // For a link tree, the profile might not be a link, but check parent.
                // In the HTML provided, it's inside a .profile-wrapper inside a .profile-card. Not a link.

                tapCount++;
                if (tapCount === 1) {
                    tapTimer = setTimeout(() => {
                        tapCount = 0;
                    }, 2000); // 2 seconds to tap 5 times
                }

                if (tapCount >= 5) {
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    this.start();
                }
            });
        }
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'snake-overlay';
        overlay.innerHTML = `
            <div class="game-container">
                <canvas id="snake-canvas"></canvas>
                <div class="game-ui">
                    <div class="score-board">
                        <span>Score: <span id="current-score">0</span></span>
                        <span>High Score: <span id="high-score">${this.highScore}</span></span>
                    </div>
                    <div class="start-hint">Press any arrow key to start moving</div>
                    <button class="close-btn" aria-label="Close Game">×</button>
                </div>
                <div class="game-over-modal hidden">
                    <h2>Game Over</h2>
                    <p>Score: <span id="final-score">0</span></p>
                    <button id="restart-btn">Play Again</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Initial resize
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Close button
        overlay.querySelector('.close-btn').addEventListener('click', () => this.stop());

        // Restart button
        document.getElementById('restart-btn').addEventListener('click', () => {
            document.querySelector('.game-over-modal').classList.add('hidden');
            this.resetGame();
        });

        // Controls
        document.addEventListener('keydown', this.handleInput.bind(this));

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (!this.isActive) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe(this.touchStartX, this.touchStartY, touchEndX, touchEndY);
        });
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;

        // Prevent background scrolling
        document.body.style.overflow = 'hidden';

        this.createOverlay();
        this.resetGame();

        // Fade in animation handled by CSS on #snake-overlay
    }

    stop() {
        this.isActive = false;
        if (this.gameInterval) clearInterval(this.gameInterval);

        const overlay = document.getElementById('snake-overlay');
        if (overlay) {
            overlay.remove();
        }

        document.body.style.overflow = '';
    }

    resetGame() {
        this.score = 0;
        this.updateScore();
        this.direction = 'right';
        this.nextDirection = 'right';
        this.snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];
        this.spawnFood();

        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => this.update(), this.speed);
    }

    spawnFood() {
        // Calculate max grid items based on screen size
        const maxX = Math.floor(this.canvas.width / this.gridSize);
        const maxY = Math.floor(this.canvas.height / this.gridSize);

        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY)
            };

            // Make sure food doesn't spawn on snake
            valid = !this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y);
        }
    }

    handleInput(e) {
        if (!this.isActive) return;

        const key = e.key;
        if (key === 'ArrowUp' && this.direction !== 'down') this.nextDirection = 'up';
        else if (key === 'ArrowDown' && this.direction !== 'up') this.nextDirection = 'down';
        else if (key === 'ArrowLeft' && this.direction !== 'right') this.nextDirection = 'left';
        else if (key === 'ArrowRight' && this.direction !== 'left') this.nextDirection = 'right';
    }

    handleSwipe(startX, startY, endX, endY) {
        const diffX = endX - startX;
        const diffY = endY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal
            if (diffX > 0 && this.direction !== 'left') this.nextDirection = 'right';
            else if (diffX < 0 && this.direction !== 'right') this.nextDirection = 'left';
        } else {
            // Vertical
            if (diffY > 0 && this.direction !== 'up') this.nextDirection = 'down';
            else if (diffY < 0 && this.direction !== 'down') this.nextDirection = 'up';
        }
    }

    update() {
        this.direction = this.nextDirection;
        const head = { ...this.snake[0] };

        if (this.direction === 'right') head.x++;
        else if (this.direction === 'left') head.x--;
        else if (this.direction === 'up') head.y--;
        else if (this.direction === 'down') head.y++;

        // Canvas dimensions in grid units
        const gridW = Math.floor(this.canvas.width / this.gridSize);
        const gridH = Math.floor(this.canvas.height / this.gridSize);

        // Wrap around walls
        if (head.x >= gridW) head.x = 0;
        else if (head.x < 0) head.x = gridW - 1;
        if (head.y >= gridH) head.y = 0;
        else if (head.y < 0) head.y = gridH - 1;

        // Collision with self
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Eat food
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScore();
            this.spawnFood();
            // Subtle speed increase
            // clearInterval(this.gameInterval);
            // this.speed = Math.max(50, this.speed - 1);
            // this.gameInterval = setInterval(() => this.update(), this.speed);
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(5, 5, 5, 0.9)'; // Fade trail slightly if desired, or traverse opaque
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Food (Glow effect)
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#6366f1';
        this.ctx.fillStyle = '#6366f1';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Draw Snake
        this.ctx.fillStyle = '#c4f82a';
        this.snake.forEach((segment, index) => {
            // Head glows
            if (index === 0) {
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = '#c4f82a';
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
        this.ctx.shadowBlur = 0;
    }

    updateScore() {
        const currentScoreEl = document.getElementById('current-score');
        const finalScoreEl = document.getElementById('final-score');
        if (currentScoreEl) currentScoreEl.innerText = this.score;
        if (finalScoreEl) finalScoreEl.innerText = this.score;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake-highscore', this.highScore);
            const highScoreEl = document.getElementById('high-score');
            if (highScoreEl) highScoreEl.innerText = this.highScore;
        }
    }

    gameOver() {
        clearInterval(this.gameInterval);
        document.querySelector('.game-over-modal').classList.remove('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
