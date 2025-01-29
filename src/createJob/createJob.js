import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { saveJobToDB } from "./saveJobtoDB.js"; // Keep this import only once

const scene = new THREE.Scene();
const loader = new GLTFLoader();
let components = [];
let filters = new Set();

// Function to load 3D model
function loadModel(fileUrl) {
  loader.load(
    fileUrl,
    (gltf) => {
      console.log("Model loaded successfully.");
      const model = gltf.scene;
      scene.add(model);

      model.children.forEach((child) => {
        let name = child.name;
        createComponentBox(name);
        filters.add(name.slice(0, 3));
      });
      grayOutIsStatic();
      createFilterButtons();
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    (error) => {
      console.error("An error happened", error);
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

  // Assuming fileUrl is available in the URL parameters after upload
  const fileUrl = new URLSearchParams(window.location.search).get("fileUrl");

  if (!jobTitle || !jobUnit || !jobDescription || !fileUrl) {
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
    model: fileUrl,
  };

  console.log("Job created:", job);

  //Save job to the database
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
  const fileUrl = new URLSearchParams(window.location.search).get("fileUrl");
  if (fileUrl) {
    document.getElementById(
      "fileInfo"
    ).innerHTML = `File uploaded successfully! <br> File URL: <a href="${fileUrl}" target="_blank">${fileUrl}</a>`;
    loadModel(fileUrl);
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
