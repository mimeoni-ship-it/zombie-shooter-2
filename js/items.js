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
