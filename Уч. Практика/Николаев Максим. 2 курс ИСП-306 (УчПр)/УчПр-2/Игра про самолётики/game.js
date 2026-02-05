let gameStarted = false;
let score = 0;
let gameTime = 0;
let lives = 3;
let player;
let gameField;
let enemyPlanes = [];
let bullets = [];
let explosions = [];
let gameInterval;
let enemyInterval;
let timeInterval;
let keys = {};

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameOverScreen = document.getElementById('game-over');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const livesDisplay = document.getElementById('lives');
const finalScore = document.getElementById('final-score');
const finalTime = document.getElementById('final-time');
const gameOverRestart = document.getElementById('game-over-restart');

function initGame() {
    player = document.getElementById('player-plane');
    gameField = document.getElementById('game-field');
    
    score = 0;
    gameTime = 0;
    lives = 3;
    enemyPlanes = [];
    bullets = [];
    explosions = [];
    gameStarted = false;
    
    gameField.innerHTML = '<div id="player-plane" class="player-plane"></div>';
    player = document.getElementById('player-plane');
    
    updateScore();
    updateTime();
    updateLives();
    
    gameOverScreen.classList.add('hidden');
    
    startBtn.disabled = false;
    restartBtn.disabled = true;
    
    createClouds();
}

function createClouds() {
    for (let i = 0; i < 10; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.width = `${Math.random() * 100 + 50}px`;
        cloud.style.height = `${Math.random() * 50 + 30}px`;
        cloud.style.left = `${Math.random() * 100}%`;
        cloud.style.top = `${Math.random() * 100}%`;
        cloud.style.opacity = Math.random() * 0.3 + 0.1;
        gameField.appendChild(cloud);
    }
}

function startGame() {
    if (gameStarted) return;
    
    gameStarted = true;
    startBtn.disabled = true;
    restartBtn.disabled = false;
    
    player.style.top = '50%';
    
    clearIntervals();
    
    gameInterval = setInterval(updateGame, 16);
    
    // УВЕЛИЧЕНО КОЛИЧЕСТВО ВРАЖЕСКИХ САМОЛЁТОВ НА 50%
    // Интервал уменьшен с 1500мс до 1000мс
    enemyInterval = setInterval(createEnemyPlane, 1000);
    
    timeInterval = setInterval(updateTimer, 1000);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
    keys[event.key] = true;
    
    if (event.key === ' ' || event.key === 'f' || event.key === 'F') {
        shoot();
    }
    
    movePlayer();
}

function handleKeyUp(event) {
    keys[event.key] = false;
}

function movePlayer() {
    if (!gameStarted) return;
    
    const playerRect = player.getBoundingClientRect();
    const gameFieldRect = gameField.getBoundingClientRect();
    const playerSpeed = 6;
    let newTop = parseInt(player.style.top) || 50;
    
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
        newTop -= playerSpeed;
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
        newTop += playerSpeed;
    }
    
    const minTop = 0;
    const maxTop = 100 - (player.offsetHeight / gameFieldRect.height * 100);
    newTop = Math.max(minTop, Math.min(maxTop, newTop));
    
    player.style.top = `${newTop}%`;
}

function shoot() {
    if (!gameStarted) return;
    
    const bullet = document.createElement('div');
    bullet.className = 'bullet';
    
    const playerRect = player.getBoundingClientRect();
    const gameFieldRect = gameField.getBoundingClientRect();
    
    bullet.style.left = `${playerRect.right - gameFieldRect.left}px`;
    bullet.style.top = `${playerRect.top + playerRect.height / 2 - gameFieldRect.top}px`;
    
    gameField.appendChild(bullet);
    bullets.push(bullet);
}

function createEnemyPlane() {
    if (!gameStarted) return;
    
    const enemy = document.createElement('div');
    enemy.className = 'enemy-plane';
    
    const maxTop = gameField.offsetHeight - 60;
    const top = Math.floor(Math.random() * maxTop);
    
    enemy.style.left = `${gameField.offsetWidth}px`;
    enemy.style.top = `${top}px`;
    
    const speed = Math.random() * 3 + 2;
    enemy.dataset.speed = speed;
    
    const size = Math.random() * 20 + 50;
    enemy.style.width = `${size}px`;
    enemy.style.height = `${size * 0.7}px`;
    
    gameField.appendChild(enemy);
    enemyPlanes.push(enemy);
}

function updateGame() {
    if (!gameStarted) return;
    
    moveBullets();
    moveEnemyPlanes();
    
    checkBulletCollisions();
    checkPlayerCollisions();
    updateExplosions();
}

function moveBullets() {
    const bulletsToRemove = [];
    
    bullets.forEach((bullet, index) => {
        if (!bullet.parentElement) {
            bulletsToRemove.push(index);
            return;
        }
        
        const currentLeft = parseInt(bullet.style.left) || 0;
        const newLeft = currentLeft + 10;
        
        bullet.style.left = `${newLeft}px`;
        
        if (newLeft > gameField.offsetWidth) {
            bulletsToRemove.push(index);
            bullet.remove();
        }
    });
    
    bulletsToRemove.reverse().forEach(index => {
        bullets.splice(index, 1);
    });
}

function moveEnemyPlanes() {
    const enemiesToRemove = [];
    
    enemyPlanes.forEach((enemy, index) => {
        if (!enemy.parentElement) {
            enemiesToRemove.push(index);
            return;
        }
        
        const currentLeft = parseInt(enemy.style.left) || gameField.offsetWidth;
        const speed = parseFloat(enemy.dataset.speed);
        const newLeft = currentLeft - speed;
        
        enemy.style.left = `${newLeft}px`;
        
        if (newLeft < -100) {
            enemiesToRemove.push(index);
            enemy.remove();
        }
    });
    
    enemiesToRemove.reverse().forEach(index => {
        enemyPlanes.splice(index, 1);
    });
}

function checkBulletCollisions() {
    const bulletsToRemove = [];
    const enemiesToRemove = [];
    
    bullets.forEach((bullet, bulletIndex) => {
        const bulletRect = bullet.getBoundingClientRect();
        
        enemyPlanes.forEach((enemy, enemyIndex) => {
            if (!enemy.parentElement) return;
            
            const enemyRect = enemy.getBoundingClientRect();
            
            if (checkCollision(bulletRect, enemyRect)) {
                bulletsToRemove.push(bulletIndex);
                enemiesToRemove.push(enemyIndex);
                
                createExplosion(enemyRect);
                enemy.remove();
                bullet.remove();
                
                score += 100;
                updateScore();
            }
        });
    });
    
    bulletsToRemove.reverse().forEach(index => {
        bullets.splice(index, 1);
    });
    
    enemiesToRemove.reverse().forEach(index => {
        enemyPlanes.splice(index, 1);
    });
}

function checkPlayerCollisions() {
    const playerRect = player.getBoundingClientRect();
    
    enemyPlanes.forEach(enemy => {
        const enemyRect = enemy.getBoundingClientRect();
        
        if (checkCollision(playerRect, enemyRect)) {
            createExplosion(playerRect);
            lives--;
            updateLives();
            
            if (lives <= 0) {
                endGame();
            } else {
                enemy.remove();
            }
        }
    });
}

function createExplosion(rect) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    
    const gameFieldRect = gameField.getBoundingClientRect();
    explosion.style.left = `${rect.left + rect.width / 2 - gameFieldRect.left - 30}px`;
    explosion.style.top = `${rect.top + rect.height / 2 - gameFieldRect.top - 30}px`;
    
    gameField.appendChild(explosion);
    explosions.push(explosion);
    
    setTimeout(() => {
        if (explosion.parentElement) {
            explosion.remove();
        }
    }, 500);
}

function updateExplosions() {
    explosions = explosions.filter(explosion => explosion.parentElement);
}

function checkCollision(rect1, rect2) {
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

function updateTimer() {
    if (!gameStarted) return;
    
    gameTime++;
    updateTime();
    
    score += 1;
    updateScore();
}

function updateScore() {
    scoreDisplay.textContent = score;
}

function updateTime() {
    timeDisplay.textContent = `${gameTime}с`;
}

function updateLives() {
    livesDisplay.textContent = lives;
}

function endGame() {
    gameStarted = false;
    
    clearIntervals();
    
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    finalScore.textContent = score;
    finalTime.textContent = `${gameTime}с`;
    gameOverScreen.classList.remove('hidden');
    
    startBtn.disabled = true;
    restartBtn.disabled = false;
}

function clearIntervals() {
    clearInterval(gameInterval);
    clearInterval(enemyInterval);
    clearInterval(timeInterval);
}

function restartGame() {
    gameStarted = false;
    clearIntervals();
    
    initGame();

    setTimeout(() => {
        startGame();
    }, 100);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', restartGame);
gameOverRestart.addEventListener('click', restartGame);

document.addEventListener('DOMContentLoaded', initGame);

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
});