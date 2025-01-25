import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function load3DModel(modelUrl, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Container with selector '${containerSelector}' not found.`);
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.innerHTML = ""; // Clear previous content
  container.appendChild(renderer.domElement);

  // Ambient Light: Uniform illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
  scene.add(ambientLight);

  // Hemisphere Light: Adds additional soft light from sky and ground
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 1.5);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  // Directional Light 1: Main directional light
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight1.position.set(10, 10, 10);
  directionalLight1.target.position.set(0, 0, 0);
  scene.add(directionalLight1);
  scene.add(directionalLight1.target);

  // Directional Light 2: Secondary light from the opposite direction
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight2.position.set(-10, 10, -10);
  directionalLight2.target.position.set(0, 0, 0);
  scene.add(directionalLight2);
  scene.add(directionalLight2.target);

  // Directional Light: Positioned below the model
  const directionalLightBottom = new THREE.DirectionalLight(0xffffff, 2);
  directionalLightBottom.position.set(0, -10, 0);
  directionalLightBottom.target.position.set(0, 0, 0);
  scene.add(directionalLightBottom);
  scene.add(directionalLightBottom.target);

  // Orbit Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // Smooth movement
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 50;

  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);

      const animate = function () {
        requestAnimationFrame(animate);
        controls.update(); // Update controls
        renderer.render(scene, camera);
      };
      animate();
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error("Error loading model:", error);
    }
  );

  camera.position.z = 8;

  // Resize Handler: Adjust camera and renderer on window resize
  window.addEventListener("resize", () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Update camera aspect ratio and projection matrix
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(width, height);
  });
}
