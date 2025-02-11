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

  // Create UI overlay
  const uiOverlay = document.createElement('div');
  uiOverlay.style.position = 'absolute';
  uiOverlay.style.top = '20px';
  uiOverlay.style.left = '20px';
  uiOverlay.style.zIndex = '1000';
  uiOverlay.style.color = 'white';
  uiOverlay.style.fontFamily = 'Arial, sans-serif';
  container.style.position = 'relative';
  container.appendChild(uiOverlay);

  // Create component name display
  const componentNameDisplay = document.createElement('div');
  componentNameDisplay.style.marginBottom = '10px';
  componentNameDisplay.style.fontSize = '16px';
  componentNameDisplay.style.fontWeight = 'bold';
  uiOverlay.appendChild(componentNameDisplay);

  // Create filter dropdown container
  const filterContainer = document.createElement('div');
  filterContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  filterContainer.style.padding = '10px';
  filterContainer.style.borderRadius = '5px';
  uiOverlay.appendChild(filterContainer);

  // Create filter select
  const filterSelect = document.createElement('select');
  filterSelect.style.width = '200px';
  filterSelect.style.padding = '5px';
  filterSelect.style.marginBottom = '10px';
  filterContainer.appendChild(filterSelect);

  // Three.js setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
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

  // Lighting setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
  backLight.position.set(-1, 1, -1);
  scene.add(backLight);

  // Raycasting setup
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredMesh = null;
  let meshes = new Set();
  let componentGroups = new Map(); // Store components by prefix

  function updateFilterDropdown() {
    // Clear existing options
    filterSelect.innerHTML = '<option value="">Show All Components</option>';
    
    // Get unique prefixes (first 3 characters)
    const prefixes = new Set();
    componentGroups.forEach((meshes, name) => {
      const prefix = name.slice(0, 3).toLowerCase();
      prefixes.add(prefix);
    });

    // Add options for each prefix
    [...prefixes].sort().forEach(prefix => {
      const option = document.createElement('option');
      option.value = prefix;
      option.textContent = prefix.toUpperCase();
      filterSelect.appendChild(option);
    });
  }

  filterSelect.addEventListener('change', (event) => {
    const selectedPrefix = event.target.value.toLowerCase();
    
    componentGroups.forEach((meshes, name) => {
      const prefix = name.slice(0, 3).toLowerCase();
      const visible = !selectedPrefix || prefix === selectedPrefix;
      
      meshes.forEach(mesh => {
        mesh.visible = visible;
      });
    });
  });

  function loadObj(materials = null) {
    const objLoader = new OBJLoader();
    if (materials) {
      objLoader.setMaterials(materials);
    }

    objLoader.load(
      modelUrls.objUrl,
      (object) => {
        console.log('OBJ loaded successfully');
        
        object.traverse((child) => {
          if (child.isMesh) {
            // Generate unique materials
            if (!child.material) {
              child.material = new THREE.MeshPhongMaterial({
                color: new THREE.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5),
                shininess: 30
              });
            }
            
            // Clone materials
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => mat.clone());
            } else {
              child.material = child.material.clone();
            }

            // Store original material
            child.userData.originalMaterial = Array.isArray(child.material) ? 
              child.material.map(m => m.clone()) : 
              child.material.clone();

            // Get component name from mesh name or parent name
            const componentName = child.parent.name || child.name || 'Unknown Component';
            child.userData.componentName = componentName;

            // Group components
            if (!componentGroups.has(componentName)) {
              componentGroups.set(componentName, new Set());
            }
            componentGroups.get(componentName).add(child);

            meshes.add(child);
            
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
        
        // Update filter dropdown after loading
        updateFilterDropdown();
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

  function highlightMesh(mesh, intensity = 1.2) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => {
        const newColor = mat.color.clone();
        newColor.multiplyScalar(intensity);
        mat.color.copy(newColor);
      });
    } else {
      const newColor = mesh.material.color.clone();
      newColor.multiplyScalar(intensity);
      mesh.material.color.copy(newColor);
    }
  }

  function resetMeshMaterial(mesh) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat, index) => {
        if (mesh.userData.originalMaterial) {
          const originalMat = Array.isArray(mesh.userData.originalMaterial)
            ? mesh.userData.originalMaterial[index]
            : mesh.userData.originalMaterial;
          mat.color.copy(originalMat.color);
        }
      });
    } else if (mesh.userData.originalMaterial) {
      mesh.material.color.copy(mesh.userData.originalMaterial.color);
    }
  }

  function onMouseMove(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([...meshes], false);

    // Reset previous hover
    if (hoveredMesh) {
      resetMeshMaterial(hoveredMesh);
      hoveredMesh = null;
      componentNameDisplay.textContent = '';
    }

    // Set new hover
    if (intersects.length > 0) {
      hoveredMesh = intersects[0].object;
      highlightMesh(hoveredMesh);
      componentNameDisplay.textContent = hoveredMesh.userData.componentName;
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

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  window.addEventListener('resize', onWindowResize);

  // Add this function to focus on specific parts
  function focusOnParts(partNames) {
    if (!partNames || partNames.length === 0) return;

    // Find all meshes that match the part names
    const targetMeshes = [...meshes].filter(mesh => 
      partNames.includes(mesh.userData.componentName)
    );

    if (targetMeshes.length === 0) return;

    // Calculate bounding box of all target meshes
    const boundingBox = new THREE.Box3();
    targetMeshes.forEach(mesh => {
      mesh.geometry.computeBoundingBox();
      const meshBox = mesh.geometry.boundingBox.clone();
      meshBox.applyMatrix4(mesh.matrixWorld);
      boundingBox.union(meshBox);
    });

    // Calculate center and size of bounding box
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    // Calculate camera position
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 3; // Reduced zoom-out distance
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const cameraPosition = center.clone().add(direction.multiplyScalar(distance));

    // Highlight the parts
    meshes.forEach(mesh => {
      if (partNames.includes(mesh.userData.componentName)) {
        highlightMesh(mesh, 1.5); // Brighter highlight for selected parts
      } else {
        // Optional: dim other parts
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => {
            mat.transparent = true;
            mat.opacity = 0.3;
          });
        } else {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.3;
        }
      }
    });

    // Animate camera movement
    const duration = 1000; // milliseconds
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = Date.now();

    function updateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Update camera position
      camera.position.lerpVectors(startPosition, cameraPosition, easeProgress);
      controls.target.lerpVectors(startTarget, center, easeProgress);
      
      if (progress < 1) {
        requestAnimationFrame(updateCamera);
      }
    }

    updateCamera();
  }

  // Export the focusOnParts function
  return {
    cleanup: () => {
      window.removeEventListener('resize', onWindowResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeChild(uiOverlay);
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
    },
    focusOnParts: focusOnParts
  };
}