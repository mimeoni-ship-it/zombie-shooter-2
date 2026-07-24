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
