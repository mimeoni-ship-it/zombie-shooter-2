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
