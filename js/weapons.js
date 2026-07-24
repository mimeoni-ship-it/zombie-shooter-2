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
