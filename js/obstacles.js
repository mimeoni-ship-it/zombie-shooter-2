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
