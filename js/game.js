// ========== MAIN GAME LOGIC ==========
const Game = {
    lastTime: 0,
    spawnTimers: {},

    init() {
        Scene3D.init();
        Player.init();
        UI.init();
        Input.init();

        // Load saved coins
        GameState.coins = parseInt(localStorage.getItem('zombieCoins') || '0');

        UI.showScreen('start-screen');
    },

    start() {
        resetGameState();
        GameState.running = true;

        // Apply map
        const mapConfig = CONFIG.maps[GameState.currentMap];
        Scene3D.setMapColors(mapConfig);
        Environment.generate();

        // Reset entities
        Player.reset();
        Zombies.clear();
        Obstacles.clear();
        Items.clear();
        Weapons.clear();
        Particles.clear();

        // Setup auto-fire if needed
        if (CONFIG.weapons[GameState.currentWeapon].auto) {
            Weapons.startAutoFire();
        }

        // Reset timers
        this.spawnTimers = {
            zombie: 0,
            obstacle: 0,
            health: 0,
            water: 0,
            fire: 0
        };

        // Lock orientation
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }

        UI.hideAllScreens();
        UI.updateHealthBar();
        UI.updateHUD();
        UI.updateWeaponDisplay();
        UI.updateMapDisplay();
        UI.showMapBars();

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    pause() {
        GameState.running = false;
        Weapons.stopAutoFire();
        // Save current progress
        GameState.paused = true;
    }

    resume() {
        if (!GameState.paused) return;
        GameState.running = true;
        GameState.paused = false;
        if (CONFIG.weapons[GameState.currentWeapon].auto) {
            Weapons.startAutoFire();
        }
        UI.hideAllScreens();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    },

    loop(currentTime) {
        if (!GameState.running) return;

        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        this.lastTime = currentTime;
        GameState.time += dt;

        // Progression
        GameState.speedMult = 1 + GameState.time * CONFIG.speedMultGrowth;
        GameState.speed = CONFIG.baseSpeed + GameState.time * CONFIG.speedGrowth;
        GameState.score += dt * CONFIG.scorePerSecond * GameState.speedMult;

        // Map special effects
        this.handleMapEffects(dt);

        // Updates
        Player.update(dt, Input.keys, Input.mobile.left, Input.mobile.right, Input.mobile.jump, Input.tiltX, Input.isMobile);
        Weapons.update(dt);
        Zombies.update(dt);
        Obstacles.update(dt);
        Items.update(dt);
        Particles.update(dt);
        Environment.update(dt);
        this.spawnManager(dt);

        // Combo decay
        if (GameState.combo > 0) {
            GameState.comboTimer -= dt;
            if (GameState.comboTimer <= 0) GameState.combo = 0;
        }

        // Camera follow
        const pPos = Player.getPosition();
        Scene3D.camera.position.x += (pPos.x * 0.3 - Scene3D.camera.position.x) * 2 * dt;
        Scene3D.camera.position.z = pPos.z + 12;
        Scene3D.camera.lookAt(pPos.x, 2, pPos.z - 10);

        UI.updateHUD();
        Scene3D.render();

        requestAnimationFrame((t) => this.loop(t));
    },

    handleMapEffects(dt) {
        if (GameState.currentMap === 'desert') {
            GameState.thirst -= dt * CONFIG.thirstDrain;
            if (GameState.thirst <= 0) {
                GameState.thirst = 0;
                GameState.score -= dt * CONFIG.scorePenalty;
                if (GameState.thirst < 20) this.takeDamage(dt * CONFIG.thirstDamage);
            }
            UI.updateThirstBar();
        }

        if (GameState.currentMap === 'snow') {
            GameState.cold -= dt * CONFIG.coldDrain;
            if (GameState.cold <= 0) {
                GameState.cold = 0;
                GameState.score -= dt * CONFIG.scorePenalty;
                if (GameState.cold < 20) this.takeDamage(dt * CONFIG.coldDamage);
            }
            UI.updateColdBar();
        }
    },

    spawnManager(dt) {
        this.spawnTimers.zombie += dt;
        this.spawnTimers.obstacle += dt;
        this.spawnTimers.health += dt;
        this.spawnTimers.water += dt;
        this.spawnTimers.fire += dt;

        const zInterval = Math.max(CONFIG.zombieMinInterval, CONFIG.zombieBaseInterval - GameState.speedMult * 0.15);
        if (this.spawnTimers.zombie > zInterval) {
            if (GameState.score >= GameState.bossThreshold && !GameState.bossActive) {
                Zombies.spawn(true);
            } else {
                Zombies.spawn(false);
            }
            this.spawnTimers.zombie = 0;
        }

        const oInterval = Math.max(CONFIG.obstacleMinInterval, CONFIG.obstacleBaseInterval - GameState.speedMult * 0.1);
        if (this.spawnTimers.obstacle > oInterval) {
            Obstacles.spawn();
            this.spawnTimers.obstacle = 0;
        }

        if (this.spawnTimers.health > CONFIG.healthInterval) {
            Items.spawnHealth();
            this.spawnTimers.health = 0;
        }

        if (GameState.currentMap === 'desert' && this.spawnTimers.water > CONFIG.waterInterval) {
            Items.spawnWater();
            this.spawnTimers.water = 0;
        }

        if (GameState.currentMap === 'snow' && this.spawnTimers.fire > CONFIG.fireInterval) {
            Items.spawnFire();
            this.spawnTimers.fire = 0;
        }
    },

    takeDamage(amount) {
        GameState.health -= amount;
        if (GameState.health < 0) GameState.health = 0;
        UI.flashDamage();
        UI.updateHealthBar();
        if (GameState.health <= 0) this.gameOver();
    },

    gameOver() {
        GameState.running = false;
        Weapons.stopAutoFire();

        // Calculate coins earned THIS ROUND
        const earned = Math.floor(GameState.score / CONFIG.coinRate);
        GameState.coins += earned;
        saveCoins();

        // Save high score
        const highScore = parseInt(localStorage.getItem('zombieHighScore') || '0');
        if (GameState.score > highScore) {
            localStorage.setItem('zombieHighScore', Math.floor(GameState.score));
        }

        UI.updateGameOver();
        UI.showScreen('game-over-screen');

        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }
};

// ========== NAVIGATION ==========
function showMapSelect() {
    UI.showScreen('map-screen');
}

function selectMap(map) {
    GameState.currentMap = map;
    document.querySelectorAll('.map-card').forEach(el => el.classList.remove('selected'));
    document.getElementById('map-' + map).classList.add('selected');
}

function startGame() {
    Game.start();
}

function showShop() {
    Shop.show();
}

function showShopFromGameOver() {
    Shop.show();
}

function backToStart() {
    UI.showScreen('start-screen');
}

function restartGame() {
    Game.start();
}

// ========== INIT ==========
window.addEventListener('load', () => {
    Game.init();
});

// Auto-save every 5s
setInterval(() => {
    if (GameState.running) saveCoins();
}, 5000);
