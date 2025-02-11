import { SceneManager } from "./scene/SceneManager.js";
import { ModelLoader } from "./model/ModelLoader.js";
import { SelectionManager } from "./interaction/SelectionManager.js";
import { ComponentManager } from "./components/ComponentManager.js";
import { JobManager } from "./job/JobManager.js";

let sceneManager;
let modelLoader;
let selectionManager;
let componentManager;
let jobManager;

function initializeEventListeners() {
  const container = document.querySelector(".right-container");

  // Mouse events for 3D view
  container.addEventListener(
    "mousedown",
    () => (selectionManager.isDragging = false)
  );
  container.addEventListener("mousemove", (e) => {
    selectionManager.isDragging = true;
    selectionManager.onMouseMove(e);
  });
  container.addEventListener("click", (e) => selectionManager.onModelClick(e));

  // Component creation
  document
    .getElementById("createComponentBtn")
    ?.addEventListener("click", () => {
      if (selectionManager.selectedMeshes.size === 0) {
        alert("Please select at least one part first");
        return;
      }

      const componentName = prompt("Enter a name for this component:");
      if (!componentName) return;

      componentManager.createComponent(
        componentName,
        Array.from(selectionManager.selectedMeshNames)
      );
      selectionManager.clearSelections();
    });

  // Selection controls
  document
    .getElementById("hidePartsBtn")
    ?.addEventListener("click", () => selectionManager.hideSelectedParts());
  document
    .getElementById("showAllBtn")
    ?.addEventListener("click", () => selectionManager.showAllParts());
  document
    .getElementById("clearSelectionsBtn")
    ?.addEventListener("click", () => selectionManager.clearSelections());

  // Save button
  document
    .querySelector(".save-button")
    ?.addEventListener("click", () => jobManager.createJob());

  // Bulk action buttons
  document.getElementById("selectAll")?.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".component-checkbox");
    const isAllSelected = Array.from(checkboxes).every(
      (checkbox) => checkbox.checked
    );

    checkboxes.forEach((checkbox) => {
      checkbox.checked = !isAllSelected;
    });
  });

  // AI generation
  document
    .getElementById("generateComponents")
    ?.addEventListener("click", async () => {
      const generateButton = document.getElementById("generateComponents");
      const prompt = document.getElementById("aiPrompt").value.trim();

      if (!prompt) {
        alert("Please enter a prompt.");
        return;
      }

      if (modelLoader.meshes.size === 0) {
        alert("No 3D model loaded.");
        return;
      }

      generateButton.disabled = true;
      generateButton.textContent = "Generating...";
      generateButton.style.backgroundColor = "#ccc";

      try {
        const meshData = [...modelLoader.meshes].map((mesh) => ({
          name: mesh.name,
          position: mesh.position,
        }));

        const response = await fetch("/api/generate-components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, meshes: meshData }),
        });

        if (!response.ok) throw new Error("Failed to generate components");

        const structuredComponents = await response.json();
        console.log("Generated Components:", structuredComponents);

        for (const [assemblyName, parts] of Object.entries(
          structuredComponents
        )) {
          componentManager.createComponent(assemblyName, parts);
        }
      } catch (error) {
        console.error("Error generating AI components:", error);
        alert("Failed to generate AI components.");
      } finally {
        generateButton.disabled = false;
        generateButton.textContent = "Generate with AI";
        generateButton.style.backgroundColor = "";
      }
    });
}

function loadModelFromURL() {
  const params = new URLSearchParams(window.location.search);
  const objUrl = params.get("objUrl");
  const mtlUrl = params.get("mtlUrl");

  if (objUrl) {
    let fileInfo = `OBJ File: <a href="${objUrl}" target="_blank">${objUrl}</a>`;
    if (mtlUrl) {
      fileInfo += `<br>MTL File: <a href="${mtlUrl}" target="_blank">${mtlUrl}</a>`;
    }
    document.getElementById(
      "fileInfo"
    ).innerHTML = `Files uploaded successfully! <br>${fileInfo}`;

    modelLoader.loadModel(objUrl, mtlUrl);
  } else {
    document.getElementById("fileInfo").innerHTML = "No file uploaded.";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".right-container");

  sceneManager = new SceneManager(container);
  modelLoader = new ModelLoader(sceneManager.scene);
  selectionManager = new SelectionManager(
    sceneManager.scene,
    sceneManager.camera,
    modelLoader.meshes
  );
  componentManager = new ComponentManager();
  jobManager = new JobManager(componentManager);

  initializeEventListeners();
  loadModelFromURL();
});
