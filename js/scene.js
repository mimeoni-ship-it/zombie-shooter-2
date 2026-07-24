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
