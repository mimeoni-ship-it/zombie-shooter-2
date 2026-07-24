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
