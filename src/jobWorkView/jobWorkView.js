import { load3DModel } from "./load3Dmodel.js";

let modelViewer = null; // Store the model viewer reference

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const jobTitle = params.get("title");

  if (!jobTitle) {
    console.error("No job title provided in URL");
    document.querySelector(".job-title-container h1").textContent =
      "Error: No Job Title Found";
    document.querySelector(".job-description").textContent =
      "Please provide a job title in the URL";
    return;
  }

  // API URLs
  const baseUrl = window.location.origin;
  const jobApiUrl = `${baseUrl}/api/job/title/${encodeURIComponent(jobTitle)}`;

  console.log("Fetching job data from:", jobApiUrl); // Debug log

  // Fetch job data
  fetch(jobApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Job fetch failed: ${response.status} ${response.statusText}`
        );
      }
      return response.json();
    })
    .then((job) => {
      console.log("Received job data:", job); // Debug log

      // Update UI with job data
      document.querySelector(".job-title-container h1").textContent =
        job.jobTitle;
      document.querySelector(".job-description").textContent =
        job.description || "No description available";

      // Render components if they exist
      if (job.jobComponents && Object.keys(job.jobComponents).length > 0) {
        renderOperations(job.jobComponents);
      } else {
        document.querySelector(".operations-section").innerHTML =
          "<p>No operations found</p>";
      }

      // Load 3D model if URLs exist
      if (job.model?.obj) {
        modelViewer = load3DModel(
          {
            objUrl: job.model.obj,
            mtlUrl: job.model.mtl,
          },
          ".right-screen"
        );
      } else {
        throw new Error("No model URL in response");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.querySelector(".job-title-container h1").textContent =
        "Error Loading Job";
      document.querySelector(".job-description").textContent =
        "Failed to load job data";
      document.querySelector(".operations-section").innerHTML = `
        <div class="error-message">
          Error loading job: ${error.message}
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    });
});

function renderOperations(jobComponents) {
  const operationsSection = document.querySelector(".operations-section");
  operationsSection.innerHTML = "";

  // Add "Operations" title
  const operationsTitle = document.createElement("h2");
  operationsTitle.textContent = "Operations";
  operationsTitle.className = "operations-title";
  operationsSection.appendChild(operationsTitle);

  // Render each component
  Object.entries(jobComponents).forEach(([componentName, component]) => {
    const operation = document.createElement("div");
    operation.className = "operation";

    // Make the operation clickable
    operation.style.cursor = "pointer";
    operation.addEventListener("click", () => {
      if (modelViewer) {
        // Focus on all parts in this component
        modelViewer.focusOnParts(component.parts.map((part) => part.name));

        // Add visual feedback for selected operation
        document
          .querySelectorAll(".operation")
          .forEach((op) => op.classList.remove("selected"));
        operation.classList.add("selected");
      }
    });

    // Component name
    const componentNameDiv = document.createElement("div");
    componentNameDiv.className = "operation-name";
    componentNameDiv.textContent = componentName;
    operation.appendChild(componentNameDiv);

    // Required Materials section
    if (component.requiredMaterials?.length > 0) {
      const materialsTitle = document.createElement("h4");
      materialsTitle.textContent = "Required Materials:";
      materialsTitle.className = "materials-title";
      operation.appendChild(materialsTitle);

      const materialsList = document.createElement("ul");
      materialsList.className = "materials-list";

      component.requiredMaterials.forEach((material) => {
        const materialItem = document.createElement("li");
        materialItem.textContent = material.name;
        materialItem.className = "material-item";
        materialsList.appendChild(materialItem);
      });

      operation.appendChild(materialsList);
    }

    // Steps section
    if (component.steps?.length > 0) {
      const dropDown = document.createElement("details");
      const summary = document.createElement("summary");
      summary.textContent = "Steps";
      dropDown.appendChild(summary);

      const stepList = document.createElement("ul");
      stepList.className = "steps-list";

      component.steps.forEach((step, index) => {
        const stepItem = document.createElement("li");
        stepItem.className = "operation-step";

        const stepText = document.createElement("span");
        stepText.textContent =
          step[`step${index + 1}`] || `Step ${index + 1}: No description`;

        const completeButton = document.createElement("button");
        completeButton.textContent = step.isComplete ? "Completed" : "Complete";
        completeButton.className = `complete-btn ${
          step.isComplete ? "completed" : ""
        }`;
        completeButton.disabled = step.isComplete;

        stepItem.appendChild(stepText);
        stepItem.appendChild(completeButton);
        stepList.appendChild(stepItem);
      });

      dropDown.appendChild(stepList);
      operation.appendChild(dropDown);
    }

    operationsSection.appendChild(operation);
  });
}

function highlightMesh(mesh, intensity = 1.2) {
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((mat) => {
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

// Update your hover handling
function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  // Reset previous hover
  if (hoveredMesh && !selectedMeshes.has(hoveredMesh)) {
    resetMeshMaterial(hoveredMesh);
  }
  hoveredMesh = null;

  // Handle new hover
  if (intersects.length > 0) {
    const mesh = intersects[0].object;
    if (!selectedMeshes.has(mesh)) {
      hoveredMesh = mesh;
      highlightMesh(hoveredMesh);
    }
  }
}
