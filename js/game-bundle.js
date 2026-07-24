
window.addEventListener('error', function(e) {
    console.error('GAME ERROR:', e.message, 'at', e.filename, 'line', e.lineno);
    document.body.innerHTML = '<div style="color:#fff;padding:20px;font-family:sans-serif;background:#0a0a0a;min-height:100vh;"><h2>⚠️ Game Error</h2><p style="color:#ff4444;">' + e.message + '</p><p>File: ' + e.filename + '</p><p>Line: ' + e.lineno + '</p><p style="color:#888;">Please refresh or try again.</p></div>';
});

// ===== config.js =====
// ========== GAME CONFIG ==========
const CONFIG = {
    // Player
    playerSpeed: 8,
    playerSnowSpeed: 3,
    jumpVelocity: 8,
    gravity: 20,

    // Health
    maxHealth: 100,
    zombieBiteDamage: 25,
    bossBiteDamage: 50,
    obstacleDamage: 50,

    // Thirst/Cold
    thirstDrain: 3,      // per second
    coldDrain: 3,        // per second
    thirstDamage: 10,    // per second when 0
    coldDamage: 10,      // per second when 0
    scorePenalty: 2,     // per second when 0

    // Speed progression
    baseSpeed: 20,
    speedGrowth: 0.8,    // per second
    speedMultGrowth: 0.03,

    // Spawning
    zombieBaseInterval: 2,
    zombieMinInterval: 0.4,
    obstacleBaseInterval: 2.5,
    obstacleMinInterval: 0.6,
    healthInterval: 12,
    waterInterval: 8,
    fireInterval: 8,

    // Boss
    bossScoreThreshold: 500,
    bossHealth: 30,
    bossDamage: 50,
    bossScore: 500,
    bossCoins: 200,

    // Weapons
    weapons: [
        { id: 0, name: 'Súng Cơ Bản', emoji: '🔫', damage: 1, fireRate: 300, auto: false, aoe: false, pierce: false, color: 0xffff00, price: 0, owned: true },
        { id: 1, name: 'Súng Liên Thanh', emoji: '🔫', damage: 1, fireRate: 80, auto: true, aoe: false, pierce: false, color: 0xffaa00, price: 500, owned: false },
        { id: 2, name: 'Súng Phóng Lựu', emoji: '🚀', damage: 3, fireRate: 600, auto: false, aoe: true, pierce: false, color: 0xff4400, price: 1500, owned: false },
        { id: 3, name: 'Súng Laser', emoji: '⚡', damage: 5, fireRate: 150, auto: true, aoe: false, pierce: true, color: 0x00ffff, price: 3000, owned: false }
    ],

    // Items
    itemPrices: { water: 200, fire: 200 },

    // Maps
    maps: {
        night:  { name: 'Đêm Mặc Định', emoji: '🌙', bg: 0x1a1a2e, fog: 0x1a1a2e, ground: 0x2d4a1e, road: 0x333333, ambient: 0x404060, ambientInt: 0.6, dir: 0xffaa44, dirInt: 0.8, special: null },
        desert: { name: 'Sa Mạc Nắng', emoji: '☀️', bg: 0xe8c880, fog: 0xe8c880, ground: 0xcc9944, road: 0xaa8855, ambient: 0xffddaa, ambientInt: 1.0, dir: 0xffffee, dirInt: 1.2, special: 'thirst' },
        snow:   { name: 'Băng Tuyết', emoji: '❄️', bg: 0xcceeff, fog: 0xcceeff, ground: 0xeeeeee, road: 0xcccccc, ambient: 0xaaccff, ambientInt: 0.9, dir: 0xffffff, dirInt: 0.9, special: 'cold' }
    },

    // Scoring
    zombieScore: 100,
    zombieCoins: 20,
    scorePerSecond: 15,
    coinRate: 10  // 1 coin per 10 score
};

// ========== STATE ==========
let GameState = {
    running: false,
    paused: false,
    score: 0,
    coins: parseInt(localStorage.getItem('zombieCoins') || '0'),
    zombiesKilled: 0,
    health: 100,
    thirst: 100,
    cold: 100,
    speed: 20,
    speedMult: 1,
    time: 0,
    currentMap: 'night',
    currentWeapon: 0,
    bossThreshold: 500,
    bossActive: false,
    combo: 0,
    comboTimer: 0
};

function saveCoins() {
    localStorage.setItem('zombieCoins', GameState.coins);
}

function resetGameState() {
    GameState.running = false;
    GameState.paused = false;
    GameState.score = 0;
    GameState.zombiesKilled = 0;
    GameState.health = 100;
    GameState.thirst = 100;
    GameState.cold = 100;
    GameState.speed = CONFIG.baseSpeed;
    GameState.speedMult = 1;
    GameState.time = 0;
    GameState.bossThreshold = CONFIG.bossScoreThreshold;
    GameState.bossActive = false;
    GameState.combo = 0;
    GameState.comboTimer = 0;
}


// ===== scene.js =====
// ========== THREE.JS SCENE SETUP ==========
const Scene3D = {
    scene: null,
    camera: null,
    renderer: null,
    lights: {},

    init() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 80);
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
        this.camera.position.set(0, 5, 12);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        this.setupLights();
        this.setupGround();
        this.setupRoad();

        window.addEventListener('resize', () => this.onResize());
    },

    setupLights() {
        this.lights.ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(this.lights.ambient);

        this.lights.dir = new THREE.DirectionalLight(0xffaa44, 0.8);
        this.lights.dir.position.set(10, 20, 10);
        this.lights.dir.castShadow = true;
        this.lights.dir.shadow.mapSize.set(2048, 2048);
        this.lights.dir.shadow.camera.near = 0.5;
        this.lights.dir.shadow.camera.far = 100;
        this.lights.dir.shadow.camera.left = -30;
        this.lights.dir.shadow.camera.right = 30;
        this.lights.dir.shadow.camera.top = 30;
        this.lights.dir.shadow.camera.bottom = -30;
        this.scene.add(this.lights.dir);

        this.lights.moon = new THREE.DirectionalLight(0x4466aa, 0.3);
        this.lights.moon.position.set(-10, 15, -10);
        this.scene.add(this.lights.moon);
    },

    setupGround() {
        const geo = new THREE.PlaneGeometry(200, 200);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2d4a1e, roughness: 0.9, metalness: 0.1 });
        this.ground = new THREE.Mesh(geo, mat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.1;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);
    },

    setupRoad() {
        const geo = new THREE.PlaneGeometry(12, 200);
        const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8, metalness: 0.2 });
        this.road = new THREE.Mesh(geo, mat);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.y = 0;
        this.road.receiveShadow = true;
        this.scene.add(this.road);

        // Center markings
        for (let i = -100; i < 100; i += 4) {
            const mark = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 2),
                new THREE.MeshBasicMaterial({ color: 0xffff00 })
            );
            mark.rotation.x = -Math.PI / 2;
            mark.position.set(0, 0.01, i);
            this.scene.add(mark);
        }

        // Lane dividers
        [-4, 4].forEach(x => {
            const line = new THREE.Mesh(
                new THREE.PlaneGeometry(0.1, 200),
                new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
            );
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.01, 0);
            this.scene.add(line);
        });
    },

    setMapColors(mapConfig) {
        this.scene.background = new THREE.Color(mapConfig.bg);
        this.scene.fog.color.setHex(mapConfig.fog);
        this.lights.ambient.color.setHex(mapConfig.ambient);
        this.lights.ambient.intensity = mapConfig.ambientInt;
        this.lights.dir.color.setHex(mapConfig.dir);
        this.lights.dir.intensity = mapConfig.dirInt;
        this.ground.material.color.setHex(mapConfig.ground);
        this.road.material.color.setHex(mapConfig.road);
    },

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    render() {
        this.renderer.render(this.scene, this.camera);
    }
};


// ===== particles.js =====
// ========== PARTICLES & EFFECTS ==========
const Particles = {
    list: [],

    explode(pos, color, count = 8, size = 0.1) {
        for (let i = 0; i < count; i++) {
            const p = new THREE.Mesh(
                new THREE.BoxGeometry(size, size, size),
                new THREE.MeshBasicMaterial({ color: color })
            );
            p.position.copy(pos);
            p.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 6,
                    Math.random() * 6,
                    (Math.random() - 0.5) * 6
                ),
                life: 0.5 + Math.random() * 0.5,
                rotSpeed: (Math.random() - 0.5) * 10
            };
            Scene3D.scene.add(p);
            this.list.push(p);
        }
    },

    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.position.add(p.userData.velocity.clone().multiplyScalar(dt));
            p.userData.velocity.y -= 12 * dt;
            p.rotation.x += p.userData.rotSpeed * dt;
            p.rotation.y += p.userData.rotSpeed * dt;
            p.userData.life -= dt;
            p.scale.setScalar(Math.max(0, p.userData.life));

            if (p.userData.life <= 0) {
                Scene3D.scene.remove(p);
                this.list.splice(i, 1);
            }
        }
    },

    clear() {
        this.list.forEach(p => Scene3D.scene.remove(p));
        this.list.length = 0;
    }
};


// ===== player.js =====
// ========== PLAYER ==========
const Player = {
    mesh: null,
    gun: null,
    muzzleFlash: null,
    lane: 0,
    targetX: 0,
    isJumping: false,
    jumpVel: 0,

    init() {
        this.mesh = new THREE.Group();

        // Body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 1.4, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x3366cc })
        );
        body.position.y = 1.4;
        body.castShadow = true;
        this.mesh.add(body);

        // Head
        const head = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ color: 0xffccaa })
        );
        head.position.y = 2.4;
        head.castShadow = true;
        this.mesh.add(head);

        // Gun group
        this.gun = new THREE.Group();
        const gunBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.15, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
        );
        this.gun.add(gunBody);
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 })
        );
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.4;
        this.gun.add(barrel);
        this.gun.position.set(0.5, 1.6, -0.3);
        this.mesh.add(this.gun);

        // Muzzle flash
        this.muzzleFlash = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        this.muzzleFlash.position.set(0, 0, -0.6);
        this.muzzleFlash.visible = false;
        this.gun.add(this.muzzleFlash);

        // Legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x224488 });
        this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.3), legMat);
        this.leftLeg.position.set(-0.25, 0.4, 0);
        this.leftLeg.castShadow = true;
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.3), legMat);
        this.rightLeg.position.set(0.25, 0.4, 0);
        this.rightLeg.castShadow = true;
        this.mesh.add(this.rightLeg);

        // Arms
        const armMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
        this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), armMat);
        this.leftArm.position.set(-0.55, 1.6, 0);
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.2), armMat);
        this.rightArm.position.set(0.55, 1.6, 0);
        this.mesh.add(this.rightArm);

        this.mesh.position.set(0, 0, 5);
        Scene3D.scene.add(this.mesh);
    },

    update(dt, keys, mobileLeft, mobileRight, mobileJump, tiltX, isMobile) {
        // Lane movement
        if (keys['a'] || keys['arrowleft'] || mobileLeft) {
            if (this.lane > -1) this.lane--;
        }
        if (keys['d'] || keys['arrowright'] || mobileRight) {
            if (this.lane < 1) this.lane++;
        }

        if (isMobile && Math.abs(tiltX) > 0.2) {
            if (tiltX < -0.3 && this.lane > -1) this.lane = -1;
            if (tiltX > 0.3 && this.lane < 1) this.lane = 1;
            if (Math.abs(tiltX) < 0.3) this.lane = 0;
        }

        this.targetX = this.lane * 4;
        const moveSpeed = GameState.currentMap === 'snow' ? CONFIG.playerSnowSpeed : CONFIG.playerSpeed;
        this.mesh.position.x += (this.targetX - this.mesh.position.x) * moveSpeed * dt;

        // Jump
        if ((keys[' '] || keys['w'] || keys['arrowup'] || mobileJump) && !this.isJumping) {
            this.isJumping = true;
            this.jumpVel = CONFIG.jumpVelocity;
        }

        if (this.isJumping) {
            this.mesh.position.y += this.jumpVel * dt;
            this.jumpVel -= CONFIG.gravity * dt;
            if (this.mesh.position.y <= 0) {
                this.mesh.position.y = 0;
                this.isJumping = false;
                this.jumpVel = 0;
            }
        }

        // Forward/back
        if (keys['s'] || keys['arrowdown']) this.mesh.position.z += 5 * dt;
        if (keys['w'] || keys['arrowup']) this.mesh.position.z -= 5 * dt;
        this.mesh.position.z = Math.max(2, Math.min(10, this.mesh.position.z));

        // Animation
        const runSpeed = 15;
        this.leftLeg.rotation.x = Math.sin(GameState.time * runSpeed) * 0.5;
        this.rightLeg.rotation.x = Math.sin(GameState.time * runSpeed + Math.PI) * 0.5;
        this.leftArm.rotation.x = Math.sin(GameState.time * runSpeed + Math.PI) * 0.3;
        this.rightArm.rotation.x = Math.sin(GameState.time * runSpeed) * 0.3;
        this.gun.rotation.z = Math.sin(GameState.time * 3) * 0.05;
    },

    flashMuzzle() {
        this.muzzleFlash.visible = true;
        setTimeout(() => this.muzzleFlash.visible = false, 50);
        this.gun.position.z += 0.1;
        setTimeout(() => this.gun.position.z -= 0.1, 50);
    },

    getPosition() {
        return this.mesh.position;
    },

    reset() {
        this.lane = 0;
        this.mesh.position.set(0, 0, 5);
        this.isJumping = false;
        this.jumpVel = 0;
    }
};


// ===== weapons.js =====
// ========== WEAPONS & BULLETS ==========
const Weapons = {
    bullets: [],
    autoInterval: null,
    lastShot: 0,

    shoot() {
        const now = Date.now();
        const w = CONFIG.weapons[GameState.currentWeapon];
        if (now - this.lastShot < w.fireRate) return;
        this.lastShot = now;

        const size = w.aoe ? 0.15 : 0.08;
        const speed = w.aoe ? 25 : 40;

        const bullet = new THREE.Mesh(
            new THREE.SphereGeometry(size, 8, 8),
            new THREE.MeshBasicMaterial({ color: w.color })
        );

        const pos = Player.getPosition();
        bullet.position.set(pos.x, 1.6, pos.z - 0.5);
        bullet.userData = {
            velocity: new THREE.Vector3(0, 0, -1).multiplyScalar(speed),
            life: 2,
            damage: w.damage,
            aoe: w.aoe,
            pierce: w.pierce
        };

        Scene3D.scene.add(bullet);
        this.bullets.push(bullet);
        Player.flashMuzzle();

        if (w.auto) this.startAutoFire();
    },

    startAutoFire() {
        if (this.autoInterval) return;
        const w = CONFIG.weapons[GameState.currentWeapon];
        this.autoInterval = setInterval(() => {
            if (GameState.running) this.shoot();
        }, w.fireRate);
    },

    stopAutoFire() {
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
    },

    update(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.position.add(b.userData.velocity.clone().multiplyScalar(dt));
            b.userData.life -= dt;

            if (b.userData.life <= 0) {
                Scene3D.scene.remove(b);
                this.bullets.splice(i, 1);
                continue;
            }

            this.checkHits(b, i);
        }
    },

    checkHits(bullet, bulletIndex) {
        let hit = false;

        for (let j = Zombies.list.length - 1; j >= 0; j--) {
            const z = Zombies.list[j];
            const dist = bullet.position.distanceTo(z.mesh.position);
            const hitRadius = z.data.isBoss ? 3 : 1.2;

            if (dist < hitRadius) {
                z.data.health -= bullet.userData.damage;
                Particles.explode(bullet.position, z.data.isBoss ? 0xff0000 : 0x55aa44, bullet.userData.aoe ? 10 : 5);

                // AOE damage
                if (bullet.userData.aoe) {
                    Zombies.list.forEach((oz, idx) => {
                        if (idx !== j && oz.mesh.position.distanceTo(z.mesh.position) < 4) {
                            oz.data.health -= 1;
                            if (oz.data.health <= 0) {
                                Zombies.kill(oz, idx);
                            }
                        }
                    });
                }

                if (!bullet.userData.pierce) {
                    Scene3D.scene.remove(bullet);
                    this.bullets.splice(bulletIndex, 1);
                    hit = true;
                }

                if (z.data.health <= 0) {
                    Zombies.kill(z, j);
                }
                break;
            }
        }
    },

    clear() {
        this.bullets.forEach(b => Scene3D.scene.remove(b));
        this.bullets.length = 0;
        this.stopAutoFire();
    }
};

// ========== SHOP ==========
const Shop = {
    show() {
        document.getElementById('shop-coins').textContent = GameState.coins;
        this.updateUI();
        UI.showScreen('shop-screen');
    },

    updateUI() {
        document.getElementById('shop-coins').textContent = GameState.coins;
        CONFIG.weapons.forEach((w, i) => {
            const el = document.getElementById('weapon-' + i);
            if (!el) return;

            if (w.owned) {
                el.classList.add('owned');
                el.innerHTML = `
                    <span class="wep-emoji">${w.emoji}</span>
                    <div class="wep-name">${w.name}</div>
                    <div class="wep-stat">Sát thương: ${w.damage}<br>${w.auto ? 'Tự động' : 'Bán tự động'}</div>
                    <div class="wep-owned">✅ Đã có</div>
                `;
                el.onclick = () => this.equip(i);
            }
        });
    },

    buyWeapon(index) {
        const w = CONFIG.weapons[index];
        if (w.owned) { this.equip(index); return; }
        if (GameState.coins >= w.price) {
            GameState.coins -= w.price;
            w.owned = true;
            saveCoins();
            this.equip(index);
            this.updateUI();
        } else {
            alert('Không đủ điểm! Cần ' + w.price + ' điểm');
        }
    },

    equip(index) {
        GameState.currentWeapon = index;
        Weapons.stopAutoFire();
        if (CONFIG.weapons[index].auto && GameState.running) {
            Weapons.startAutoFire();
        }
        UI.updateWeaponDisplay();
    },

    buyWater() {
        if (GameState.coins >= CONFIG.itemPrices.water) {
            GameState.coins -= CONFIG.itemPrices.water;
            saveCoins();
            GameState.thirst = 100;
            UI.updateThirstBar();
            this.updateUI();
        } else alert('Không đủ điểm!');
    },

    buyFire() {
        if (GameState.coins >= CONFIG.itemPrices.fire) {
            GameState.coins -= CONFIG.itemPrices.fire;
            saveCoins();
            GameState.cold = 100;
            UI.updateColdBar();
            this.updateUI();
        } else alert('Không đủ điểm!');
    }
};


// ===== zombies.js =====
// ========== ZOMBIES & BOSS ==========
const Zombies = {
    list: [],

    spawn(isBoss = false) {
        const scale = isBoss ? 2.5 : 1;
        const health = isBoss ? CONFIG.bossHealth : 2;
        const speed = 3 + Math.random() * 3 + GameState.speedMult * 2;

        const group = new THREE.Group();

        // Body
        const bodyColor = isBoss ? 0x880000 : 0x55aa44;
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: bodyColor,
            emissive: isBoss ? 0x330000 : 0x000000
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7 * scale, 1.6 * scale, 0.4 * scale), bodyMat);
        body.position.y = 1.3 * scale;
        body.castShadow = true;
        group.add(body);

        // Head
        const headMat = new THREE.MeshStandardMaterial({ color: isBoss ? 0xaa0000 : 0x66bb55 });
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4 * scale, 0.4 * scale, 0.4 * scale), headMat);
        head.position.y = 2.3 * scale;
        group.add(head);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.15 * scale, 0.6 * scale, 0.15 * scale);
        const leftArm = new THREE.Mesh(armGeo, bodyMat);
        leftArm.position.set(-0.45 * scale, 1.6 * scale, 0.2 * scale);
        leftArm.rotation.x = -0.5;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, bodyMat);
        rightArm.position.set(0.45 * scale, 1.6 * scale, 0.2 * scale);
        rightArm.rotation.x = -0.5;
        group.add(rightArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.2 * scale, 0.7 * scale, 0.2 * scale);
        const leftLeg = new THREE.Mesh(legGeo, bodyMat);
        leftLeg.position.set(-0.2 * scale, 0.35 * scale, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, bodyMat);
        rightLeg.position.set(0.2 * scale, 0.35 * scale, 0);
        group.add(rightLeg);

        // Boss crown
        if (isBoss) {
            const crown = new THREE.Mesh(
                new THREE.ConeGeometry(0.3, 0.4, 4),
                new THREE.MeshStandardMaterial({ color: 0xffdd00, metalness: 0.8 })
            );
            crown.position.y = 2.7 * scale;
            group.add(crown);

            // Boss glow
            const glow = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.1 })
            );
            glow.position.y = 1.5;
            group.add(glow);
        }

        const lanes = [-4, 0, 4];
        group.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0, -60 - Math.random() * 20);

        const data = {
            health: health,
            maxHealth: health,
            speed: speed,
            isBoss: isBoss,
            leftArm: leftArm,
            rightArm: rightArm,
            leftLeg: leftLeg,
            rightLeg: rightLeg,
            animOffset: Math.random() * 100
        };

        Scene3D.scene.add(group);
        this.list.push({ mesh: group, data: data });

        if (isBoss) {
            GameState.bossActive = true;
            UI.showBossWarning();
        }
    },

    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const z = this.list[i];
            z.mesh.position.z += (GameState.speed + z.data.speed) * dt;

            // Animation
            const anim = GameState.time * 8 + z.data.animOffset;
            z.data.leftArm.rotation.x = -0.5 + Math.sin(anim) * 0.3;
            z.data.rightArm.rotation.x = -0.5 + Math.sin(anim + Math.PI) * 0.3;
            z.data.leftLeg.rotation.x = Math.sin(anim) * 0.4;
            z.data.rightLeg.rotation.x = Math.sin(anim + Math.PI) * 0.4;

            // Face player
            const pPos = Player.getPosition();
            z.mesh.lookAt(pPos.x, z.mesh.position.y, pPos.z);

            // Collision with player
            const dist = Math.sqrt(
                Math.pow(z.mesh.position.x - pPos.x, 2) +
                Math.pow(z.mesh.position.z - pPos.z, 2)
            );

            const hitDist = z.data.isBoss ? 3 : 1.5;
            if (dist < hitDist) {
                const dmg = z.data.isBoss ? CONFIG.bossBiteDamage : CONFIG.zombieBiteDamage;
                Game.takeDamage(dmg);
                Particles.explode(z.mesh.position, 0xff0000, z.data.isBoss ? 20 : 10);
                this.remove(i);
                continue;
            }

            // Remove if behind camera
            if (z.mesh.position.z > 15) {
                this.remove(i);
            }
        }
    },

    kill(zombie, index) {
        const isBoss = zombie.data.isBoss;
        Particles.explode(zombie.mesh.position, isBoss ? 0xff0000 : 0x55aa44, isBoss ? 30 : 15, isBoss ? 0.3 : 0.1);
        Scene3D.scene.remove(zombie.mesh);
        this.list.splice(index, 1);

        GameState.zombiesKilled++;
        GameState.score += isBoss ? CONFIG.bossScore : CONFIG.zombieScore;
        GameState.coins += isBoss ? CONFIG.bossCoins : CONFIG.zombieCoins;

        // Combo
        GameState.combo++;
        GameState.comboTimer = 2;
        if (GameState.combo >= 3) {
            UI.showCombo(GameState.combo);
            GameState.score += GameState.combo * 10;
        }

        if (isBoss) {
            GameState.bossActive = false;
            GameState.bossThreshold += CONFIG.bossScoreThreshold;
            UI.hideBossWarning();
        }
    },

    remove(index) {
        Scene3D.scene.remove(this.list[index].mesh);
        this.list.splice(index, 1);
    },

    clear() {
        this.list.forEach(z => Scene3D.scene.remove(z.mesh));
        this.list.length = 0;
    }
};


// ===== obstacles.js =====
// ========== OBSTACLES ==========
const Obstacles = {
    list: [],

    spawn() {
        const type = Math.random();
        let obstacle;

        if (type < 0.25) {
            // Barrel
            obstacle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 1.2, 8),
                new THREE.MeshStandardMaterial({ color: 0xcc4400, roughness: 0.7 })
            );
            obstacle.position.y = 0.6;
        } else if (type < 0.5) {
            // Concrete barrier
            obstacle = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.8, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 })
            );
            obstacle.position.y = 0.4;
        } else if (type < 0.75) {
            // Spikes
            obstacle = new THREE.Group();
            for (let i = 0; i < 3; i++) {
                const spike = new THREE.Mesh(
                    new THREE.ConeGeometry(0.15, 0.6, 4),
                    new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.6 })
                );
                spike.position.set((i - 1) * 0.4, 0.3, 0);
                obstacle.add(spike);
            }
            obstacle.position.y = 0;
        } else {
            // Big rock
            obstacle = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.7),
                new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 })
            );
            obstacle.position.y = 0.6;
        }

        const lanes = [-4, 0, 4];
        obstacle.position.x = lanes[Math.floor(Math.random() * lanes.length)];
        obstacle.position.z = -80 - Math.random() * 30;
        obstacle.castShadow = true;
        obstacle.userData = { type: 'obstacle', hit: false };

        Scene3D.scene.add(obstacle);
        this.list.push(obstacle);
    },

    update(dt) {
        for (let i = this.list.length - 1; i >= 0; i--) {
            const o = this.list[i];
            o.position.z += GameState.speed * dt;

            const pPos = Player.getPosition();
            const dist = Math.sqrt(
                Math.pow(o.position.x - pPos.x, 2) +
                Math.pow(o.position.z - pPos.z, 2)
            );

            if (dist < 1.5 && !o.userData.hit && pPos.y < 1.5) {
                Game.takeDamage(CONFIG.obstacleDamage);
                o.userData.hit = true;
                Particles.explode(o.position, 0xff8800, 8);
            }

            if (o.position.z > 15) {
                Scene3D.scene.remove(o);
                this.list.splice(i, 1);
            }
        }
    },

    clear() {
        this.list.forEach(o => Scene3D.scene.remove(o));
        this.list.length = 0;
    }
};

// ========== ENVIRONMENT (Trees, etc) ==========
const Environment = {
    objects: [],

    generate() {
        this.clear();
        const map = GameState.currentMap;

        for (let i = 0; i < 40; i++) {
            const z = -60 + Math.random() * 120;
            const side = Math.random() > 0.5 ? 1 : -1;
            const x = side * (8 + Math.random() * 20);

            if (map === 'night') this.createTree(x, z);
            else if (map === 'desert') this.createCactus(x, z);
            else if (map === 'snow') this.createSnowTree(x, z);
        }
    },

    createTree(x, z) {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 2, 6),
            new THREE.MeshStandardMaterial({ color: 0x4a3728 })
        );
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 3, 6),
            new THREE.MeshStandardMaterial({ color: 0x2d5a1e })
        );
        leaves.position.y = 3;
        leaves.castShadow = true;
        group.add(leaves);

        group.position.set(x, 0, z);
        Scene3D.scene.add(group);
        this.objects.push(group);
    },

    createCactus(x, z) {
        const group = new THREE.Group();
        const main = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.5, 3, 8),
            new THREE.MeshStandardMaterial({ color: 0x44aa44 })
        );
        main.position.y = 1.5;
        main.castShadow = true;
        group.add(main);

        const arm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 1, 6),
            new THREE.MeshStandardMaterial({ color: 0x44aa44 })
        );
        arm.position.set(0.5, 2, 0);
        arm.rotation.z = -Math.PI / 4;
        group.add(arm);

        group.position.set(x, 0, z);
        Scene3D.scene.add(group);
        this.objects.push(group);
    },

    createSnowTree(x, z) {
        const group = new THREE.Group();
        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 2, 6),
            new THREE.MeshStandardMaterial({ color: 0x8b7355 })
        );
        trunk.position.y = 1;
        trunk.castShadow = true;
        group.add(trunk);

        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 3, 6),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        leaves.position.y = 3;
        leaves.castShadow = true;
        group.add(leaves);

        group.position.set(x, 0, z);
        Scene3D.scene.add(group);
        this.objects.push(group);
    },

    update(dt) {
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            obj.position.z += GameState.speed * dt;

            if (obj.position.z > 20) {
                obj.position.z = -80 - Math.random() * 20;
                const side = Math.random() > 0.5 ? 1 : -1;
                obj.position.x = side * (8 + Math.random() * 15);
            }
        }
    },

    clear() {
        this.objects.forEach(o => Scene3D.scene.remove(o));
        this.objects.length = 0;
    }
};


// ===== items.js =====
// ========== ITEMS: Health, Water, Fire ==========
const Items = {
    healthPacks: [],
    waterPacks: [],
    firePacks: [],

    // Health Pack
    spawnHealth() {
        const group = new THREE.Group();

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, 0.6, 0.6),
            new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 })
        );
        box.position.y = 0.5;
        box.castShadow = true;
        group.add(box);

        const crossV = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.5, 0.15),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        crossV.position.set(0, 0.5, 0.31);
        group.add(crossV);

        const crossH = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.15, 0.15),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        crossH.position.set(0, 0.5, 0.31);
        group.add(crossH);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.4, 0.5, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        group.add(ring);

        const lanes = [-4, 0, 4];
        group.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0, -100 - Math.random() * 50);
        group.userData = { type: 'health', ring: ring, collected: false };

        Scene3D.scene.add(group);
        this.healthPacks.push(group);
    },

    // Water Pack (Desert)
    spawnWater() {
        const group = new THREE.Group();

        const bottle = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshStandardMaterial({ 
                color: 0x4488ff, 
                emissive: 0x0044ff, 
                emissiveIntensity: 0.5,
                transparent: true, 
                opacity: 0.85 
            })
        );
        bottle.position.y = 0.5;
        group.add(bottle);

        const ring = new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.4, 16),
            new THREE.MeshBasicMaterial({ color: 0x4488ff, side: THREE.DoubleSide, transparent: true, opacity: 0.4 })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        group.add(ring);

        // Water drops particles
        for (let i = 0; i < 3; i++) {
            const drop = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 })
            );
            drop.position.set((Math.random() - 0.5) * 0.5, 0.8 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5);
            group.add(drop);
        }

        const lanes = [-4, 0, 4];
        group.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0, -80 - Math.random() * 40);
        group.userData = { type: 'water', ring: ring, collected: false };

        Scene3D.scene.add(group);
        this.waterPacks.push(group);
    },

    // Fire Pack (Snow)
    spawnFire() {
        const group = new THREE.Group();

        const torch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.12, 0.7, 6),
            new THREE.MeshStandardMaterial({ color: 0x8b4513 })
        );
        torch.position.y = 0.35;
        group.add(torch);

        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.18, 0.45, 6),
            new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0xff4400, emissiveIntensity: 0.8 })
        );
        flame.position.y = 0.8;
        group.add(flame);

        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.15 })
        );
        glow.position.y = 0.5;
        group.add(glow);

        // Floating sparks
        for (let i = 0; i < 4; i++) {
            const spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 4, 4),
                new THREE.MeshBasicMaterial({ color: 0xffaa00 })
            );
            spark.position.set((Math.random() - 0.5) * 0.4, 0.9 + Math.random() * 0.4, (Math.random() - 0.5) * 0.4);
            group.add(spark);
        }

        const lanes = [-4, 0, 4];
        group.position.set(lanes[Math.floor(Math.random() * lanes.length)], 0, -80 - Math.random() * 40);
        group.userData = { type: 'fire', flame: flame, collected: false };

        Scene3D.scene.add(group);
        this.firePacks.push(group);
    },

    update(dt) {
        this.updateHealth(dt);
        this.updateWater(dt);
        this.updateFire(dt);
    },

    updateHealth(dt) {
        for (let i = this.healthPacks.length - 1; i >= 0; i--) {
            const h = this.healthPacks[i];
            h.position.z += GameState.speed * dt;
            h.userData.ring.rotation.z += dt * 2;
            h.position.y = Math.sin(GameState.time * 3) * 0.1;

            const pPos = Player.getPosition();
            const dist = Math.sqrt(Math.pow(h.position.x - pPos.x, 2) + Math.pow(h.position.z - pPos.z, 2));

            if (dist < 1.5 && !h.userData.collected) {
                h.userData.collected = true;
                GameState.health = CONFIG.maxHealth;
                Particles.explode(h.position, 0xff0000, 12);
                Scene3D.scene.remove(h);
                this.healthPacks.splice(i, 1);
                UI.updateHealthBar();
            } else if (h.position.z > 15) {
                Scene3D.scene.remove(h);
                this.healthPacks.splice(i, 1);
            }
        }
    },

    updateWater(dt) {
        if (GameState.currentMap !== 'desert') return;
        for (let i = this.waterPacks.length - 1; i >= 0; i--) {
            const w = this.waterPacks[i];
            w.position.z += GameState.speed * dt;
            w.userData.ring.rotation.z += dt * 2;
            w.position.y = Math.sin(GameState.time * 3) * 0.1;

            const pPos = Player.getPosition();
            const dist = Math.sqrt(Math.pow(w.position.x - pPos.x, 2) + Math.pow(w.position.z - pPos.z, 2));

            if (dist < 1.5 && !w.userData.collected) {
                w.userData.collected = true;
                GameState.thirst = 100;
                Particles.explode(w.position, 0x4488ff, 10);
                Scene3D.scene.remove(w);
                this.waterPacks.splice(i, 1);
                UI.updateThirstBar();
            } else if (w.position.z > 15) {
                Scene3D.scene.remove(w);
                this.waterPacks.splice(i, 1);
            }
        }
    },

    updateFire(dt) {
        if (GameState.currentMap !== 'snow') return;
        for (let i = this.firePacks.length - 1; i >= 0; i--) {
            const f = this.firePacks[i];
            f.position.z += GameState.speed * dt;
            f.userData.flame.rotation.y += dt * 3;
            f.position.y = Math.sin(GameState.time * 4) * 0.05;

            const pPos = Player.getPosition();
            const dist = Math.sqrt(Math.pow(f.position.x - pPos.x, 2) + Math.pow(f.position.z - pPos.z, 2));

            if (dist < 1.5 && !f.userData.collected) {
                f.userData.collected = true;
                GameState.cold = 100;
                Particles.explode(f.position, 0xff4400, 10);
                Scene3D.scene.remove(f);
                this.firePacks.splice(i, 1);
                UI.updateColdBar();
            } else if (f.position.z > 15) {
                Scene3D.scene.remove(f);
                this.firePacks.splice(i, 1);
            }
        }
    },

    clear() {
        this.healthPacks.forEach(h => Scene3D.scene.remove(h));
        this.healthPacks.length = 0;
        this.waterPacks.forEach(w => Scene3D.scene.remove(w));
        this.waterPacks.length = 0;
        this.firePacks.forEach(f => Scene3D.scene.remove(f));
        this.firePacks.length = 0;
    }
};


// ===== ui.js =====
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


// ===== game.js =====
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

