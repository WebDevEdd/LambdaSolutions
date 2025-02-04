import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { saveJobToDB } from "./saveJobtoDB.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Global variables at the top
let selectedMeshes = new Set();
let selectedMeshNames = new Set();
const scene = new THREE.Scene();
const loader = new OBJLoader();
let components = [];
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / 2, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
let controls;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredMesh = null;
let meshes = new Set();

// Function to load 3D model
function loadModel(objUrl, mtlUrl) {
  if (mtlUrl) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(
      mtlUrl,
      (materials) => {
        materials.preload();
        const loader = new OBJLoader();
        loader.setMaterials(materials);
        loadOBJFile(loader, objUrl);
      },
      undefined,
      (error) => {
        console.error("Error loading MTL:", error);
        loadOBJFile(new OBJLoader(), objUrl);
      }
    );
  } else {
    loadOBJFile(new OBJLoader(), objUrl);
  }
}

function loadOBJFile(loader, objUrl) {
  loader.load(
    objUrl,
    (obj) => {
      console.log("Model loaded successfully.");

      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());

      obj.position.x = -center.x;
      obj.position.y = -center.y;
      obj.position.z = -center.z;

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 8 / maxDim;
      obj.scale.multiplyScalar(scale);

      obj.traverse((child) => {
        if (child.isMesh) {
          if (!child.material) {
            child.material = new THREE.MeshPhongMaterial({
              color: new THREE.Color(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5),
              shininess: 30
            });
          }

          if (Array.isArray(child.material)) {
            child.material = child.material.map(mat => mat.clone());
          } else {
            child.material = child.material.clone();
          }

          child.userData.originalMaterial = Array.isArray(child.material) ? 
            child.material.map(m => m.clone()) : 
            child.material.clone();

          meshes.add(child);
        }
      });

      scene.add(obj);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error("Error loading OBJ:", error);
      alert("Error loading 3D model. Please check console for details.");
    }
  );
}

function initScene() {
  const container = document.querySelector(".right-container");
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  renderer.setSize(containerWidth, containerHeight);
  container.appendChild(renderer.domElement);
  renderer.setClearColor(0x000000);

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  camera.position.set(-10, 10, 20);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(10, 10, 10);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-10, 10, -10);
  scene.add(directionalLight2);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Add mouse event listeners for drag detection and hover
  container.addEventListener('mousedown', onMouseDown);
  container.addEventListener('mousemove', handleMouseMovement);
  container.addEventListener('mousemove', onMouseMove);
  container.addEventListener('click', onModelClick);

  animate();
  window.addEventListener("resize", onWindowResize, false);
}

function onMouseMove(event) {
  // Check if we're hovering over the selection controls
  if (event.target.closest('.selection-controls')) {
    // If hovering over controls, reset any hover effect
    if (hoveredMesh && !selectedMeshes.has(hoveredMesh)) {
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
    return;
  }

  const container = document.querySelector(".right-container");
  const rect = container.getBoundingClientRect();
  
  mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...meshes], false);

  if (hoveredMesh && !selectedMeshes.has(hoveredMesh)) {
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

  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (!selectedMeshes.has(mesh)) {
      hoveredMesh = mesh;
      if (Array.isArray(hoveredMesh.material)) {
        hoveredMesh.material.forEach(mat => {
          const color = mat.color.clone();
          color.multiplyScalar(1.2);
          mat.color.copy(color);
        });
      } else {
        const color = hoveredMesh.material.color.clone();
        color.multiplyScalar(1.2);
        hoveredMesh.material.color.copy(color);
      }
    }
  }
}

let isDragging = false;

// Add these to track dragging state
function onMouseDown() {
  isDragging = false;
}

function handleMouseMovement() {
  isDragging = true;
}

function onModelClick(event) {
  if (isDragging || controls.enabled && controls.isOrbitAnimating) {
    return; // Don't select if we're dragging or orbiting
  }
  
  const container = document.querySelector(".right-container");
  const rect = container.getBoundingClientRect();
  
  mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([...meshes], false);

  if (intersects.length > 0) {
    const clickedMesh = intersects[0].object;
    
    if (selectedMeshes.has(clickedMesh)) {
      selectedMeshes.delete(clickedMesh);
      selectedMeshNames.delete(clickedMesh.name);
      if (Array.isArray(clickedMesh.material)) {
        clickedMesh.material.forEach((mat, index) => {
          mat.color.copy(clickedMesh.userData.originalMaterial[index].color);
        });
      } else {
        clickedMesh.material.color.copy(clickedMesh.userData.originalMaterial.color);
      }
    } else {
      selectedMeshes.add(clickedMesh);
      selectedMeshNames.add(clickedMesh.name);
      if (Array.isArray(clickedMesh.material)) {
        clickedMesh.material.forEach(mat => {
          mat.color.setRGB(1, 0.5, 0); // Orange color for selected
        });
      } else {
        clickedMesh.material.color.setRGB(1, 0.5, 0);
      }
    }
    
    updateSelectionCount();
  }
}

function createDropdownSection(title, initialContent = null, addButtonConfig = null) {
  const section = document.createElement("div");
  section.classList.add("parts-section");

  // Create header
  const header = document.createElement("div");
  header.classList.add("parts-header");
  header.innerHTML = `
    <span>${title}</span>
    <button class="toggle-btn">▼</button>
  `;

  // Create content container
  const contentList = document.createElement("div");
  contentList.classList.add("parts-list");
  contentList.style.maxHeight = "0";
  contentList.style.overflow = "hidden";

  const ul = document.createElement("ul");
  
  // Add initial content if provided
  if (initialContent) {
    initialContent.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
  }

  // Add button configuration if provided
  if (addButtonConfig) {
    const addBtn = document.createElement("button");
    addBtn.classList.add("add-spec-btn");
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => {
      const newInput = createInput(addButtonConfig.placeholder);
      ul.appendChild(newInput);
      newInput.focus();
    });
    contentList.appendChild(ul);
    contentList.appendChild(addBtn);
  } else {
    contentList.appendChild(ul);
  }

  // Toggle dropdown functionality
  header.addEventListener('click', () => {
    const isExpanded = contentList.style.maxHeight !== "0px";
    const toggleBtn = header.querySelector('.toggle-btn');
    
    if (isExpanded) {
      contentList.style.maxHeight = "0";
      toggleBtn.style.transform = "rotate(0deg)";
    } else {
      contentList.style.maxHeight = contentList.scrollHeight + "px";
      toggleBtn.style.transform = "rotate(180deg)";
    }
  });

  section.appendChild(header);
  section.appendChild(contentList);
  return section;
}

function createInput(placeholder) {
  const newInput = document.createElement("input");
  newInput.type = "text";
  newInput.placeholder = placeholder;
  newInput.classList.add("new-input");

  // Add enter key functionality
  newInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const nextInput = createInput(placeholder);
      newInput.parentNode.insertBefore(nextInput, newInput.nextSibling);
      nextInput.focus();
    }
  });

  return newInput;
}

function createComponentFromSelection() {
  if (selectedMeshes.size === 0) {
    alert('Please select at least one part first');
    return;
  }

  const componentName = prompt('Enter a name for this component:');
  if (!componentName) return;

  const boxContainer = document.querySelector(".components-container");
  const box = document.createElement("div");
  box.classList.add("component-box");

  // Create header
  const headerContainer = document.createElement("div");
  headerContainer.classList.add("component-header");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("component-checkbox");

  const componentNameElement = document.createElement("h3");
  componentNameElement.textContent = componentName;

  const removeBtn = document.createElement("button");
  removeBtn.classList.add("remove-component-btn");
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', () => removeComponent(box));

  headerContainer.appendChild(checkbox);
  headerContainer.appendChild(componentNameElement);
  headerContainer.appendChild(removeBtn);
  box.appendChild(headerContainer);

  // Create Parts dropdown
  const partsDropdown = createDropdownSection(
    "Parts", 
    Array.from(selectedMeshNames)
  );
  box.appendChild(partsDropdown);

  // Create Specs dropdown
  const specsDropdown = createDropdownSection(
    "Specs", 
    null,
    { placeholder: "Enter spec..." }
  );
  box.appendChild(specsDropdown);

  // Create Materials section
  const materialsContainer = document.createElement("div");
  materialsContainer.classList.add("materials-container");
  const materialsTitle = document.createElement("h4");
  materialsTitle.textContent = "Required Materials";
  const materialsAddBtn = createButton("Add Material", "add");
  
  box.appendChild(materialsTitle);
  box.appendChild(materialsContainer);
  box.appendChild(materialsAddBtn);

  // Create Steps section
  const stepsContainer = document.createElement("div");
  stepsContainer.classList.add("steps-container");
  const stepsTitle = document.createElement("h4");
  stepsTitle.textContent = "Steps";
  const stepsAddBtn = createButton("Add Step", "add");

  box.appendChild(stepsTitle);
  box.appendChild(stepsContainer);
  box.appendChild(stepsAddBtn);

  // Add event listeners for materials and steps
  materialsAddBtn.addEventListener("click", () =>
    addInput(materialsContainer, "Enter material...")
  );
  stepsAddBtn.addEventListener("click", () =>
    addInput(stepsContainer, `Step ${stepsContainer.childElementCount + 1}...`)
  );

  boxContainer.appendChild(box);
  clearSelections();
}


function clearSelections() {
  selectedMeshes.forEach(mesh => {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat, index) => {
        mat.color.copy(mesh.userData.originalMaterial[index].color);
      });
    } else {
      mesh.material.color.copy(mesh.userData.originalMaterial.color);
    }
  });
  selectedMeshes.clear();
  selectedMeshNames.clear();
  updateSelectionCount();
}

function createButton(text, className) {
  let button = document.createElement("button");
  button.textContent = text;
  button.classList.add(className);
  return button;
}

function addInput(container, placeholder) {
  let newInput = document.createElement("input");
  newInput.type = "text";
  newInput.placeholder = placeholder;
  newInput.classList.add("new-input");

  newInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
          event.preventDefault();  // Prevent form submission or unexpected behavior
          
          let nextInput = addInput(container, placeholder);
          nextInput.focus();  // Move focus to the new input
      }
  });

  container.appendChild(newInput);
  return newInput;
}

// Add these functions to your createJob.js file

// Initialize bulk action buttons
document.getElementById('selectAll').addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('.component-checkbox');
  const isAllSelected = Array.from(checkboxes).every(checkbox => checkbox.checked);
  
  checkboxes.forEach(checkbox => {
      checkbox.checked = !isAllSelected;
  });
});

document.getElementById('addMaterialToSelected').addEventListener('click', async () => {
  const selectedComponents = document.querySelectorAll('.component-checkbox:checked');

  if (selectedComponents.length === 0) {
      alert('Please select at least one component first');
      return;
  }

  let materialCount;
  do {
      materialCount = prompt('How many materials would you like to add?');
      if (materialCount === null) return; // User cancelled
      materialCount = parseInt(materialCount, 10);
  } while (isNaN(materialCount) || materialCount <= 0);

  let materials = [];
  for (let i = 0; i < materialCount; i++) {
      let material;
      do {
          material = prompt(`Enter material ${i + 1}:`).trim();
      } while (!material);
      materials.push(material);
  }

  selectedComponents.forEach(checkbox => {
      const componentBox = checkbox.closest('.component-box');
      const materialsContainer = componentBox.querySelector('.materials-container');

      materials.forEach(material => {
          const newInput = document.createElement('input');
          newInput.type = 'text';
          newInput.className = 'new-input';
          newInput.value = material;
          materialsContainer.appendChild(newInput);
      });
  });

  alert(`${materialCount} materials added to selected components.`);
});

document.getElementById('addStepToSelected').addEventListener('click', async () => {
  const selectedComponents = document.querySelectorAll('.component-checkbox:checked');

  if (selectedComponents.length === 0) {
      alert('Please select at least one component first');
      return;
  }

  let stepCount;
  do {
      stepCount = prompt('How many steps would you like to add?');
      if (stepCount === null) return; // User cancelled
      stepCount = parseInt(stepCount, 10);
  } while (isNaN(stepCount) || stepCount <= 0);

  let steps = [];
  for (let i = 0; i < stepCount; i++) {
      let step;
      do {
          step = prompt(`Enter step ${i + 1}:`).trim();
      } while (!step);
      steps.push(step);
  }

  selectedComponents.forEach(checkbox => {
      const componentBox = checkbox.closest('.component-box');
      const stepsContainer = componentBox.querySelector('.steps-container');

      steps.forEach(step => {
          const newInput = document.createElement('input');
          newInput.type = 'text';
          newInput.className = 'new-input';
          newInput.value = step;
          stepsContainer.appendChild(newInput);
      });
  });

  alert(`${stepCount} steps added to selected components.`);
});


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  const container = document.querySelector(".right-container");
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(containerWidth, containerHeight);
}

// Function to create job
function createJob() {
  const jobTitle = document.getElementById("jobTitle").value;
  const jobUnit = document.getElementById("unit").value;
  const jobDescription = document.getElementById("description").value;
  const allBoxes = document.querySelectorAll(".component-box");
  
  const params = new URLSearchParams(window.location.search);
  const objUrl = params.get("objUrl");
  const mtlUrl = params.get("mtlUrl");

  if (!jobTitle || !jobUnit || !jobDescription || !objUrl) {
    alert("Please fill all the fields and upload a 3D file.");
    return;
  }

  let components = [];
  
  allBoxes.forEach((box) => {
    let stepsContainer = box.querySelector(".steps-container");
    let materialsContainer = box.querySelector(".materials-container");
    let selectedParts = Array.from(box.querySelectorAll('.selected-parts-list li')).map(li => li.textContent);


    let componentName = box.querySelector("h3").textContent;
    
    let steps = Array.from(stepsContainer.querySelectorAll(".new-input"))
      .map(input => input.value)
      .filter(value => value !== "");
      
    let materials = Array.from(materialsContainer.querySelectorAll(".new-input"))
      .map(input => input.value)
      .filter(value => value !== "");

    let component = {
      name: componentName,
      parts: selectedParts,
      static: isStatic,
      isInstalled: false,
      requiredMaterials: materials,
      steps: steps,
    };
    components.push(component);
  });

  const job = {
    title: jobTitle,
    unit: jobUnit,
    description: jobDescription,
    allComponents: components,
    isComplete: false,
    model: {
      objUrl: objUrl,
      mtlUrl: mtlUrl || null,
    },
  };

  console.log("Job created:", job);

  saveJobToDB(job)
    .then(() => {
      document.querySelector(".job-saved-layer").style.display = "flex";
    })
    .catch((error) => {
      console.error("Error saving job:", error);
      alert("Failed to save job.");
    });
}

// Event listener for the save button
document.querySelector(".save-button").addEventListener("click", createJob);

// Make functions available globally
window.createComponentFromSelection = createComponentFromSelection;
window.clearSelections = clearSelections;

// Add set to track hidden meshes
let hiddenMeshes = new Set();

// Function to hide selected parts
function hideSelectedParts() {
  if (selectedMeshes.size === 0) {
    alert('Please select parts to hide');
    return;
  }

  selectedMeshes.forEach(mesh => {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => {
        mat.transparent = true;
        mat.opacity = 0.1;
        mat.needsUpdate = true;
      });
    } else {
      mesh.material.transparent = true;
      mesh.material.opacity = 0.1;
      mesh.material.needsUpdate = true;
    }
    hiddenMeshes.add(mesh);
  });

  // Clear selection after hiding
  clearSelections();
}

// Function to show all hidden parts
function showAllParts() {
  hiddenMeshes.forEach(mesh => {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => {
        mat.transparent = false;
        mat.opacity = 1.0;
        mat.needsUpdate = true;
      });
    } else {
      mesh.material.transparent = false;
      mesh.material.opacity = 1.0;
      mesh.material.needsUpdate = true;
    }
  });
  hiddenMeshes.clear();
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Add event listeners for selection controls
  document.getElementById('createComponentBtn')?.addEventListener('click', createComponentFromSelection);
  document.getElementById('hidePartsBtn')?.addEventListener('click', hideSelectedParts);
  document.getElementById('showAllBtn')?.addEventListener('click', showAllParts);
  document.getElementById('clearSelectionsBtn')?.addEventListener('click', clearSelections);
  const params = new URLSearchParams(window.location.search);
  const objUrl = params.get("objUrl");
  const mtlUrl = params.get("mtlUrl");

  if (objUrl) {
    let fileInfo = `OBJ File: <a href="${objUrl}" target="_blank">${objUrl}</a>`;
    if (mtlUrl) {
      fileInfo += `<br>MTL File: <a href="${mtlUrl}" target="_blank">${mtlUrl}</a>`;
    }
    document.getElementById("fileInfo").innerHTML = `Files uploaded successfully! <br>${fileInfo}`;

    console.log("Attempting to load model from URL:", objUrl);
    if (mtlUrl) {
      console.log("With materials from URL:", mtlUrl);
    }

    loadModel(objUrl, mtlUrl);
  } else {
    document.getElementById("fileInfo").innerHTML = "No file uploaded.";
  }
});

initScene();