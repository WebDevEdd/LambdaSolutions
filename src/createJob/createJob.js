import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { MTLLoader } from "three/addons/loaders/MTLLoader.js";
import { saveJobToDB } from "./saveJobtoDB.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
const loader = new OBJLoader();
let components = [];
let filters = new Set();
const camera = new THREE.PerspectiveCamera(25, window.innerWidth / 2, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
let controls;

// Function to load 3D model
function loadModel(objUrl, mtlUrl) {
  if (mtlUrl) {
    // If MTL file exists, load it first
    const mtlLoader = new MTLLoader();
    mtlLoader.load(mtlUrl, (materials) => {
      materials.preload();
      
      const loader = new OBJLoader();
      loader.setMaterials(materials);
      
      loadOBJFile(loader, objUrl);
    }, undefined, (error) => {
      console.error('Error loading MTL:', error);
      // Fallback to loading without materials
      loadOBJFile(new OBJLoader(), objUrl);
    });
  } else {
    // Load OBJ without materials
    loadOBJFile(new OBJLoader(), objUrl);
  }
}
// Initialize the 3D scene setup
function initScene() {
  // Get initial container size
  const container = document.querySelector('.right-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // Setup renderer with correct initial size
  renderer.setSize(containerWidth, containerHeight);
  container.appendChild(renderer.domElement);
  renderer.setClearColor(0x000000);

  // Setup camera with correct aspect ratio
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  camera.position.set(-10, 10, 20);
  camera.lookAt(0, 0, 0);

  // Add lights to the scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Add directional lights from multiple angles
  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight1.position.set(10, 10, 10);
  scene.add(directionalLight1);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-10, 10, -10);
  scene.add(directionalLight2);

  // Setup orbit controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Start animation loop
  animate();

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
  const container = document.querySelector('.right-container');
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  camera.aspect = containerWidth / containerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(containerWidth, containerHeight);
}

// Modify your existing loadOBJFile function to center and scale the model
function loadOBJFile(loader, objUrl) {
  loader.load(
    objUrl,
    (obj) => {
      console.log("Model loaded successfully.");
      
      // Center the object
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      
      // Reset object position
      obj.position.x = -center.x;
      obj.position.y = -center.y;
      obj.position.z = -center.z;
      
      // Scale object to fit view
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 8 / maxDim;
      obj.scale.multiplyScalar(scale);
      
      scene.add(obj);

      obj.traverse((child) => {
        if (child.isMesh && child.name) {
          createComponentBox(child.name);
          filters.add(child.name.slice(0, 3));
        }
      });
      grayOutIsStatic();
      createFilterButtons();
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
function grayOutIsStatic() {
  const allBoxes = document.querySelectorAll(".component-box");

  allBoxes.forEach((e) => {
    e.addEventListener("click", () => {
      if (e.querySelector("label").querySelector("input").checked) {
        e.classList.add("grey-out");
      }
      if (e.querySelector("label").querySelector("input").checked === false) {
        e.classList.remove("grey-out");
      }
    });
  });
}
// Function to create component box
function createComponentBox(com) {
  let boxContainer = document.querySelector(".components-container");

  let box = document.createElement("div");
  box.classList.add("component-box");

  let checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.classList.add("component-checkbox");
  checkbox.dataset.component = com;

  let componentNameElement = document.createElement("h3");
  componentNameElement.textContent = com;

  box.appendChild(checkbox);
  box.appendChild(componentNameElement);

  // Static input
  let staticLabel = createLabeledCheckbox(" Is Static", "form-input");
  box.appendChild(staticLabel);

  // Installed input
  //let installedLabel = createLabeledCheckbox(" Is Installed", "form-input");
  //box.appendChild(installedLabel);

  // Required materials section
  let materialsTitle = document.createElement("h4");
  materialsTitle.textContent = "Required Materials";
  let materialsContainer = document.createElement("div");
  materialsContainer.classList.add("materials-container");
  let materialsAddBtn = createButton("Add Material", "add");
  box.appendChild(materialsTitle);
  box.appendChild(materialsContainer);
  box.appendChild(materialsAddBtn);

  // Steps section
  let stepsTitle = document.createElement("h4");
  stepsTitle.textContent = "Steps";
  let stepsContainer = document.createElement("div");
  stepsContainer.classList.add("steps-container");
  let stepsAddBtn = createButton("Add Step", "add");
  box.appendChild(stepsTitle);
  box.appendChild(stepsContainer);
  box.appendChild(stepsAddBtn);

  // Add event listeners
  materialsAddBtn.addEventListener("click", () =>
    addInput(materialsContainer, "enter material...")
  );
  stepsAddBtn.addEventListener("click", () =>
    addInput(stepsContainer, `Step ${stepsContainer.childElementCount + 1}...`)
  );

  boxContainer.appendChild(box);
  box.dataset.filter = com.slice(0, 3);
}

function createLabeledCheckbox(labelText, inputClass) {
  let label = document.createElement("label");
  let input = document.createElement("input");
  input.type = "checkbox";
  input.classList.add(inputClass);
  label.appendChild(input);
  label.appendChild(document.createTextNode(labelText));
  return label;
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
  newInput.placeholder = placeholder; // Use placeholder instead of value
  newInput.classList.add("new-input");

  // Add event listener to detect Enter key
  newInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevent form submission if inside a form
      const nextInput = addInput(container, placeholder); // Add a new input
      nextInput.focus(); // Move the cursor to the new input
    }
  });

  container.appendChild(newInput);

  return newInput; // Return the newly created input for focusing
}

// Function to create filter buttons
function createFilterButtons() {
  const filterContainer = document.getElementById("filterButtons");
  filters.forEach((filter) => {
    const button = createButton(filter, "filter-button");
    button.addEventListener("click", () => filterComponents(filter));
    filterContainer.appendChild(button);
  });
}

// Function to filter components
function filterComponents(filter) {
  const components = document.querySelectorAll(".component-box");
  const filterButtons = document.querySelectorAll(".filter-button");

  let isActive = false;
  filterButtons.forEach((button) => {
    if (button.textContent === filter) {
      button.classList.toggle("active");
      isActive = button.classList.contains("active");
    } else {
      button.classList.remove("active");
    }
  });

  components.forEach((component) => {
    if (isActive) {
      component.classList.toggle("hidden", component.dataset.filter !== filter);
    } else {
      component.classList.remove("hidden");
    }
  });
}

// Function to clear filter
function clearFilter() {
  const components = document.querySelectorAll(".component-box");
  const filterButtons = document.querySelectorAll(".filter-button");

  components.forEach((component) => component.classList.remove("hidden"));
  filterButtons.forEach((button) => button.classList.remove("active"));
}

// Function to add materials to selected components
function addMaterialsToSelected() {
  const selectedComponents = document.querySelectorAll(
    ".component-checkbox:checked"
  );
  if (selectedComponents.length === 0) {
    alert("Please select at least one component.");
    return;
  }

  const count = prompt("How many materials do you want to add?");
  const materialCount = parseInt(count);

  if (isNaN(materialCount) || materialCount <= 0) {
    alert("Please enter a valid number greater than 0.");
    return;
  }

  for (let i = 0; i < materialCount; i++) {
    const material = prompt(`Enter material #${i + 1}:`);
    if (material) {
      selectedComponents.forEach((checkbox) => {
        const componentBox = checkbox.closest(".component-box");
        const materialsContainer = componentBox.querySelector(
          ".materials-container"
        );
        addInput(materialsContainer, material);
      });
    }
  }
}

// Function to add steps to selected components
function addStepsToSelected() {
  const selectedComponents = document.querySelectorAll(
    ".component-checkbox:checked"
  );
  if (selectedComponents.length === 0) {
    alert("Please select at least one component.");
    return;
  }

  const count = prompt("How many steps do you want to add?");
  const stepCount = parseInt(count);

  if (isNaN(stepCount) || stepCount <= 0) {
    alert("Please enter a valid number greater than 0.");
    return;
  }

  for (let i = 0; i < stepCount; i++) {
    const step = prompt(`Enter step #${i + 1}:`);
    if (step) {
      selectedComponents.forEach((checkbox) => {
        const componentBox = checkbox.closest(".component-box");
        const stepsContainer = componentBox.querySelector(".steps-container");
        addInput(stepsContainer, step);
      });
    }
  }
}

// Function to toggle select all component
function toggleSelectAll() {
  const allCheckboxes = document.querySelectorAll(".component-checkbox");
  const selectAllButton = document.getElementById("selectAll");
  const isSelectAll = selectAllButton.textContent === "Select All";

  allCheckboxes.forEach((checkbox) => {
    checkbox.checked = isSelectAll;
  });

  selectAllButton.textContent = isSelectAll ? "Deselect All" : "Select All";
}

// Function to create job
function createJob() {
  const jobTitle = document.getElementById("jobTitle").value;
  const jobUnit = document.getElementById("unit").value;
  const jobDescription = document.getElementById("description").value;
  const allBoxes = document.querySelectorAll(".component-box");

  // Get both OBJ and MTL URLs from parameters
  const params = new URLSearchParams(window.location.search);
  const objUrl = params.get("objUrl");
  const mtlUrl = params.get("mtlUrl");

  if (!jobTitle || !jobUnit || !jobDescription || !objUrl) {
    alert("Please fill all the fields and upload a 3D file.");
    return;
  }

  allBoxes.forEach((e) => {
    let stepsContainer = e.querySelector(".steps-container");
    let materialsContainer = e.querySelector(".materials-container");

    let allMaterials = materialsContainer.querySelectorAll(".new-input");
    let allSteps = stepsContainer.querySelectorAll(".new-input");

    let isStatic = e.querySelector("label").querySelector("input").checked;

    let componentName = e.querySelector("h3").textContent;
    let step = [];
    let material = [];

    allSteps.forEach((el) => {
      if (el.value != "") {
        step.push(el.value);
      }
    });

    allMaterials.forEach((el) => {
      if (el.value != "") {
        material.push(el.value);
      }
    });

    let component = {
      name: componentName,
      static: isStatic,
      isInstalled: false,
      requiredMaterials: material,
      steps: step,
    };
    components.push(component);
    console.log(components);
  });

  const job = {
    title: jobTitle,
    unit: jobUnit,
    description: jobDescription,
    allComponents: components,
    isComplete: false,
    model: {
      objUrl: objUrl,
      mtlUrl: mtlUrl || null
    }
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

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const objUrl = params.get("objUrl");
  const mtlUrl = params.get("mtlUrl");

  if (objUrl) {
    let fileInfo = `OBJ File: <a href="${objUrl}" target="_blank">${objUrl}</a>`;
    if (mtlUrl) {
      fileInfo += `<br>MTL File: <a href="${mtlUrl}" target="_blank">${mtlUrl}</a>`;
    }
    document.getElementById("fileInfo").innerHTML = `Files uploaded successfully! <br>${fileInfo}`;

    // Add this right before loadModel is called
console.log("Attempting to load model from URL:", objUrl);
if (mtlUrl) {
    console.log("With materials from URL:", mtlUrl);
}
    
    loadModel(objUrl, mtlUrl);
  } else {
    document.getElementById("fileInfo").innerHTML = "No file uploaded.";
  }

  document
    .getElementById("selectAll")
    .addEventListener("click", toggleSelectAll);
  document
    .getElementById("addMaterialToSelected")
    .addEventListener("click", addMaterialsToSelected);
  document
    .getElementById("addStepToSelected")
    .addEventListener("click", addStepsToSelected);
  document.getElementById("clearFilter").addEventListener("click", clearFilter);
});

console.log(components);
initScene();
