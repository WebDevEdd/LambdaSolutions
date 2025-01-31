import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function load3DModel(modelUrls, containerSelector) {
  console.log('Starting model load with:', { modelUrls, containerSelector });
  
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Container not found: ${containerSelector}`);
    return;
  }

  if (!modelUrls || !modelUrls.objUrl) {
    console.error('Invalid model URLs:', modelUrls);
    return;
  }

  // Three.js setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(5, 5, 5);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Add controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.1;
  controls.maxDistance = 50;

  // Lights setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  function loadObj(materials = null) {
    const objLoader = new OBJLoader();
    if (materials) {
      objLoader.setMaterials(materials);
    }

    objLoader.load(
      modelUrls.objUrl,
      (object) => {
        console.log('OBJ loaded successfully');
        scene.add(object);
        
        // Center and scale object
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        object.position.sub(center);
        
        // Adjust camera based on object size
        const maxDim = Math.max(size.x, size.y, size.z);
        camera.position.set(maxDim * 2, maxDim * 2, maxDim * 2);
        camera.lookAt(0, 0, 0);
        
        controls.update();
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log('OBJ ' + Math.round(percentComplete) + '% loaded');
        }
      },
      (error) => {
        console.error('OBJ load error:', error);
      }
    );
  }

  // Start loading process
  if (modelUrls.mtlUrl) {
    console.log('Loading with MTL:', modelUrls.mtlUrl);
    const mtlLoader = new MTLLoader();
    
    // Don't set the base path for the MTL loader
    mtlLoader.load(
      modelUrls.mtlUrl,
      (materials) => {
        console.log('MTL loaded successfully');
        materials.preload();
        loadObj(materials);
      },
      (xhr) => {
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          console.log('MTL ' + Math.round(percentComplete) + '% loaded');
        }
      },
      (error) => {
        console.error('MTL load error:', error);
        // Fallback to loading without materials
        loadObj(null);
      }
    );
  } else {
    console.log('Loading without MTL');
    loadObj(null);
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Handle window resize
  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  window.addEventListener('resize', onWindowResize);

  // Cleanup function
  return () => {
    window.removeEventListener('resize', onWindowResize);
    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  };
}