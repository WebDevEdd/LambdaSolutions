import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function load3DModel(modelUrl, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Container with selector '${containerSelector}' not found.`);
    return;
  }

  // Create name display overlay
  const nameDisplay = document.createElement('div');
  nameDisplay.style.position = 'absolute';
  nameDisplay.style.top = '10px';
  nameDisplay.style.left = '10px';
  nameDisplay.style.padding = '5px 10px';
  nameDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  nameDisplay.style.color = 'white';
  nameDisplay.style.fontFamily = 'Arial, sans-serif';
  nameDisplay.style.fontSize = '14px';
  nameDisplay.style.borderRadius = '4px';
  nameDisplay.style.display = 'none';
  container.style.position = 'relative';
  container.appendChild(nameDisplay);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.innerHTML = "";
  container.appendChild(renderer.domElement);
  container.appendChild(nameDisplay);  // Add nameDisplay after renderer

  // Lights setup (unchanged)
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 1.5);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight1.position.set(10, 10, 10);
  directionalLight1.target.position.set(0, 0, 0);
  scene.add(directionalLight1);
  scene.add(directionalLight1.target);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight2.position.set(-10, 10, -10);
  directionalLight2.target.position.set(0, 0, 0);
  scene.add(directionalLight2);
  scene.add(directionalLight2.target);

  const directionalLightBottom = new THREE.DirectionalLight(0xffffff, 2);
  directionalLightBottom.position.set(0, -10, 0);
  directionalLightBottom.target.position.set(0, 0, 0);
  scene.add(directionalLightBottom);
  scene.add(directionalLightBottom.target);

  // Orbit Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 50;

  // Raycaster setup
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredObject = null;
  let originalMaterials = new Map();
  let interactiveMeshes = [];

  // Helper function to get display name
  const getDisplayName = (object) => {
    // Try to get the most meaningful name
    return object.userData.name || object.name || 'Unnamed Component';
  };

  // Mouse move event listener
  container.addEventListener("mousemove", (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    scene.updateMatrixWorld();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(interactiveMeshes, false);

    if (intersects.length > 0) {
      const firstIntersectedObject = intersects[0].object;

      if (hoveredObject !== firstIntersectedObject) {
        // Revert previous hover state
        if (hoveredObject && originalMaterials.has(hoveredObject)) {
          hoveredObject.material = originalMaterials.get(hoveredObject).clone();
        }

        // Set new hover state
        hoveredObject = firstIntersectedObject;
        if (!originalMaterials.has(hoveredObject)) {
          originalMaterials.set(hoveredObject, hoveredObject.material.clone());
        }

        // Apply hover effect
        hoveredObject.material = originalMaterials.get(hoveredObject).clone();
        hoveredObject.material.color.set(0xff0000);

        // Update name display
        nameDisplay.textContent = getDisplayName(hoveredObject);
        nameDisplay.style.display = 'block';
      }
    } else {
      // Revert hover state when no intersection
      if (hoveredObject) {
        hoveredObject.material = originalMaterials.get(hoveredObject).clone();
        hoveredObject = null;
      }
      // Hide name display
      nameDisplay.style.display = 'none';
    }
  });

  // Load model
  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);

      // Collect interactive meshes
      model.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          interactiveMeshes.push(child);
          
          // Try to get name from parent if child has no name
          if (!child.name && child.parent) {
            child.name = child.parent.name;
          }
        }
      });

      // Animation loop
      const animate = function () {
        requestAnimationFrame(animate);
        controls.update();
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

  // Resize handler
  window.addEventListener("resize", () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
  });
}