import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function load3DModel(modelUrls, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`Container not found: ${containerSelector}`);
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

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Improved lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-1, 1, -1);
  scene.add(backLight);

  // Improved raycasting setup
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;
  let meshes = new Set(); // Using Set to avoid duplicates

  function loadObj(materials = null) {
    const objLoader = new OBJLoader();
    if (materials) {
      objLoader.setMaterials(materials);
    }

    objLoader.load(
      modelUrls.objUrl,
      (object) => {
        console.log('OBJ loaded successfully');
        
        // Improved mesh processing
        object.traverse((child) => {
          if (child.isMesh) {
            // Generate unique materials for each mesh
            if (!child.material) {
              child.material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5),
                shininess: 30
              });
            }
            
            // Ensure each mesh has its own unique material instance
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => mat.clone());
            } else {
              child.material = child.material.clone();
            }

            // Store original material state
            child.userData.originalMaterial = Array.isArray(child.material) ? 
              child.material.map(m => m.clone()) : 
              child.material.clone();

            // Add to interactive meshes set
            meshes.add(child);
            
            // Ensure proper geometry attributes
            if (!child.geometry.getAttribute('normal')) {
              child.geometry.computeVertexNormals();
            }
          }
        });

        scene.add(object);
        
        // Center and scale object
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        object.position.sub(center);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scaleFactor = 5 / maxDim;
        object.scale.multiplyScalar(scaleFactor);
        
        camera.position.set(maxDim, maxDim, maxDim);
        camera.lookAt(0, 0, 0);
        
        controls.update();
      },
      (xhr) => {
        const percentComplete = xhr.loaded / xhr.total * 100;
        console.log(Math.round(percentComplete) + '% loaded');
      },
      (error) => {
        console.error('OBJ load error:', error);
      }
    );
  }

  // Improved mouse move handler
  function onMouseMove(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([...meshes], false);

    // Reset previous hover
    if (hoveredMesh) {
      if (Array.isArray(hoveredMesh.material)) {
        hoveredMesh.material.forEach((mat, index) => {
          const originalMat = hoveredMesh.userData.originalMaterial[index];
          mat.color.copy(originalMat.color);
        });
      } else {
        hoveredMesh.material.color.copy(hoveredMesh.userData.originalMaterial.color);
      }
      hoveredMesh = null;
    }

    // Set new hover with single mesh selection
    if (intersects.length > 0) {
      hoveredMesh = intersects[0].object;
      const highlightColor = new THREE.Color(0xff0000);
      
      if (Array.isArray(hoveredMesh.material)) {
        hoveredMesh.material.forEach(mat => {
          mat.color.copy(highlightColor);
        });
      } else {
        hoveredMesh.material.color.copy(highlightColor);
      }
    }
  }

  container.addEventListener('mousemove', onMouseMove);

  // Load materials if available
  if (modelUrls.mtlUrl) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      modelUrls.mtlUrl,
      (materials) => {
        materials.preload();
        loadObj(materials);
      },
      undefined,
      (error) => {
        console.error('MTL load error:', error);
        loadObj(null);
      }
    );
  } else {
    loadObj(null);
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
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
    container.removeEventListener('mousemove', onMouseMove);
    meshes.forEach(mesh => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    });
    renderer.dispose();
    container.removeChild(renderer.domElement);
  };
}