// ========== UI MANAGER ==========
const UI = {
    elements: {},

    init() {
        this.elements = {
            hpBar: document.getElementById('hp-fill'),
            hpText: document.getElementById('hp-text'),
            thirstBar: document.getElementById('thirst-fill'),
            thirstText: document.getElementById('thirst-text'),
            thirstContainer: document.getElementById('thirst-bar'),
            coldBar: document.getElementById('cold-fill'),
            coldText: document.getElementById('cold-text'),
            coldContainer: document.getElementById('cold-bar'),
            score: document.getElementById('score-val'),
            zombies: document.getElementById('zombie-count'),
            speed: document.getElementById('speed-val'),
            weapon: document.getElementById('weapon-val'),
            coins: document.getElementById('coins-val'),
            mapBadge: document.getElementById('map-badge'),
            bossWarning: document.getElementById('boss-warning'),
            damageOverlay: document.getElementById('damage-overlay'),
            comboText: document.getElementById('combo-text')
        };
    },

    updateHealthBar() {
        const pct = (GameState.health / CONFIG.maxHealth) * 100;
        this.elements.hpBar.style.width = pct + '%';
        this.elements.hpText.textContent = Math.ceil(GameState.health) + '/100';
        if (pct > 50) this.elements.hpBar.style.background = 'linear-gradient(90deg,#e74c3c,#f39c12)';
        else if (pct > 25) this.elements.hpBar.style.background = 'linear-gradient(90deg,#e67e22,#f1c40f)';
        else this.elements.hpBar.style.background = 'linear-gradient(90deg,#c0392b,#e74c3c)';
    },

    updateThirstBar() {
        this.elements.thirstBar.style.width = GameState.thirst + '%';
        this.elements.thirstText.textContent = '💧 ' + Math.ceil(GameState.thirst) + '%';
        if (GameState.thirst < 30) this.elements.thirstBar.style.background = 'linear-gradient(90deg,#c0392b,#e74c3c)';
        else this.elements.thirstBar.style.background = 'linear-gradient(90deg,#2980b9,#3498db)';
    },

    updateColdBar() {
        this.elements.coldBar.style.width = GameState.cold + '%';
        this.elements.coldText.textContent = '🔥 ' + Math.ceil(GameState.cold) + '%';
        if (GameState.cold < 30) this.elements.coldBar.style.background = 'linear-gradient(90deg,#c0392b,#e74c3c)';
        else this.elements.coldBar.style.background = 'linear-gradient(90deg,#e67e22,#f39c12)';
    },

    updateHUD() {
        this.elements.score.textContent = Math.floor(GameState.score);
        this.elements.zombies.textContent = '☠️ ' + GameState.zombiesKilled;
        this.elements.speed.textContent = '⚡ ' + GameState.speedMult.toFixed(1) + 'x';
        this.elements.coins.textContent = '💰 ' + GameState.coins;
    },

    updateWeaponDisplay() {
        const w = CONFIG.weapons[GameState.currentWeapon];
        this.elements.weapon.textContent = w.emoji + ' ' + w.name;
    },

    updateMapDisplay() {
        const m = CONFIG.maps[GameState.currentMap];
        this.elements.mapBadge.textContent = m.emoji + ' ' + m.name;
    },

    showMapBars() {
        const map = CONFIG.maps[GameState.currentMap];
        this.elements.thirstContainer.style.display = map.special === 'thirst' ? 'block' : 'none';
        this.elements.thirstText.style.display = map.special === 'thirst' ? 'block' : 'none';
        this.elements.coldContainer.style.display = map.special === 'cold' ? 'block' : 'none';
        this.elements.coldText.style.display = map.special === 'cold' ? 'block' : 'none';
    },

    showBossWarning() {
        this.elements.bossWarning.style.display = 'block';
        setTimeout(() => this.elements.bossWarning.style.display = 'none', 3000);
    },

    hideBossWarning() {
        this.elements.bossWarning.style.display = 'none';
    },

    showCombo(combo) {
        this.elements.comboText.textContent = '🔥 COMBO x' + combo + '!';
        this.elements.comboText.style.opacity = '1';
        setTimeout(() => this.elements.comboText.style.opacity = '0', 1500);
    },

    flashDamage() {
        this.elements.damageOverlay.classList.add('active');
        setTimeout(() => this.elements.damageOverlay.classList.remove('active'), 200);
    },

    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        const screen = document.getElementById(id);
        if (screen) screen.style.display = 'flex';

        // Show/hide pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.style.display = (id === '' && GameState.running) ? 'block' : 'none';
        }
    },

    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    },

    updateGameOver() {
        const earned = Math.floor(GameState.score / CONFIG.coinRate);
        const highScore = parseInt(localStorage.getItem('zombieHighScore') || '0');

        document.getElementById('final-score').textContent = Math.floor(GameState.score);
        document.getElementById('final-zombies').textContent = GameState.zombiesKilled;
        document.getElementById('final-coins').textContent = earned;

        // Update total coins display
        const totalCoinsEl = document.getElementById('final-total-coins');
        if (totalCoinsEl) totalCoinsEl.textContent = GameState.coins;

        const highScoreEl = document.getElementById('final-highscore');
        if (highScoreEl) highScoreEl.textContent = highScore;
    }
};

// ========== INPUT ==========
const Input = {
    keys: {},
    mobile: { left: false, right: false, jump: false },
    tiltX: 0,
    isMobile: false,

    init() {
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.code === 'Space') e.preventDefault();
            if (e.key === '1' && CONFIG.weapons[0].owned) Shop.equip(0);
            if (e.key === '2' && CONFIG.weapons[1].owned) Shop.equip(1);
            if (e.key === '3' && CONFIG.weapons[2].owned) Shop.equip(2);
            if (e.key === '4' && CONFIG.weapons[3].owned) Shop.equip(3);
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });

        window.addEventListener('mousedown', (e) => {
            if (GameState.running && e.target.tagName === 'CANVAS') Weapons.shoot();
        });

        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                if (e.gamma !== null) this.tiltX = Math.max(-30, Math.min(30, e.gamma)) / 30;
            });
        }

        if (this.isMobile) {
            document.getElementById('mobile-controls').style.display = 'block';
            this.setupMobileButtons();
        }
    },

    setupMobileButtons() {
        const setup = (id, start, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (start) {
                el.addEventListener('touchstart', (e) => { e.preventDefault(); this.mobile[key] = true; });
                el.addEventListener('touchend', (e) => { e.preventDefault(); this.mobile[key] = false; });
            } else {
                el.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (key === 'shoot') Weapons.shoot();
                    if (key === 'shop' && GameState.running) { Game.pause(); Shop.show(); }
                });
            }
        };
        setup('mb-left', true, 'left');
        setup('mb-right', true, 'right');
        setup('mb-jump', true, 'jump');
        setup('mb-shoot', false, 'shoot');
        setup('mb-shop', false, 'shop');
    }
};
