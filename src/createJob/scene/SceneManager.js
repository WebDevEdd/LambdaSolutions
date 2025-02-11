import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class SceneManager {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(25, window.innerWidth / 2, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.container = container;
        
        this.init();
    }

    init() {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;

        this.renderer.setSize(containerWidth, containerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.renderer.setClearColor(0x000000);

        this.setupCamera(containerWidth, containerHeight);
        this.setupLights();
        this.setupControls();

        window.addEventListener("resize", () => this.onWindowResize(), false);
        this.animate();
    }

    setupCamera(containerWidth, containerHeight) {
        this.camera.aspect = containerWidth / containerHeight;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(-10, 10, 20);
        this.camera.lookAt(0, 0, 0);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(10, 10, 10);
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-10, 10, -10);
        this.scene.add(directionalLight2);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    onWindowResize() {
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight;

        this.camera.aspect = containerWidth / containerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(containerWidth, containerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    addToScene(object) {
        this.scene.add(object);
    }
} 