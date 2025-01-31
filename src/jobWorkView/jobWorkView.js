import { load3DModel } from './load3Dmodel.js';

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const jobTitle = params.get('title');

  if (!jobTitle) {
    console.error("No job title provided");
    return;
  }

  // API URLs
  const baseUrl = window.location.origin;
  const jobApiUrl = `${baseUrl}/api/job/title/${encodeURIComponent(jobTitle)}`;
  const modelApiUrl = `${baseUrl}/api/job/${encodeURIComponent(jobTitle)}/model`;

  console.log('Fetching from URLs:', { jobApiUrl, modelApiUrl });

  // First fetch job data
  fetch(jobApiUrl)
    .then(response => {
      if (!response.ok) throw new Error(`Job fetch failed: ${response.statusText}`);
      return response.json();
    })
    .then(job => {
      // Update UI with job data
      document.querySelector(".job-title-container h1").textContent = job.title;
      document.querySelector(".job-description").textContent = job.description || 'No description available';
      
      if (job.allComponents?.length > 0) {
        renderOperations(job.allComponents);
      } else {
        document.querySelector(".operations-section").innerHTML = "<p>No operations found</p>";
      }

      // Now fetch model data
      return fetch(modelApiUrl);
    })
    .then(response => {
      if (!response.ok) throw new Error(`Model fetch failed: ${response.statusText}`);
      return response.json();
    })
    .then(data => {
      console.log('Model data received:', data);
      
      if (!data.modelUrl) {
        throw new Error('No model URL in response');
      }

      // Load the 3D model
      load3DModel(data.modelUrl, '.right-screen');
    })
    .catch(error => {
      console.error('Error:', error);
      document.querySelector(".right-screen").innerHTML = `
        <div class="error-message">
          Error loading model: ${error.message}
        </div>
      `;
    });
});
// Function to render operations
function renderOperations(components) {
  // Clear previous content
  const operationsSection = document.querySelector(".operations-section");
  operationsSection.innerHTML = "";

  // Add "Operations" title
  const operationsTitle = document.createElement("h2");
  operationsTitle.textContent = "Operations";
  operationsTitle.className = "operations-title";
  operationsSection.appendChild(operationsTitle);

  // Filter and render components with steps
  components
    .filter((component) => Array.isArray(component.steps) && component.steps.length > 0)
    .forEach((component) => {
      const operation = document.createElement("div");
      operation.className = "operation";

      // Component name
      const componentName = document.createElement("div");
      componentName.className = "operation-name";
      componentName.textContent = component.name || "Unnamed Component";
      operation.appendChild(componentName);

      // Required Materials section
      if (component.requiredMaterials && component.requiredMaterials.length > 0) {
        const materialsTitle = document.createElement("h4");
        materialsTitle.textContent = "Required Materials:";
        materialsTitle.className = "materials-title";
        operation.appendChild(materialsTitle);

        const materialsList = document.createElement("ul");
        materialsList.className = "materials-list";

        component.requiredMaterials.forEach((material) => {
          const materialItem = document.createElement("li");
          materialItem.textContent = material;
          materialItem.className = "material-item";
          materialsList.appendChild(materialItem);
        });

        operation.appendChild(materialsList);
      }

      // Steps section
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
        stepText.textContent = typeof step === "string" ? 
          step : 
          step.name || `Step ${index + 1}: No description`;

        const completeButton = document.createElement("button");
        completeButton.textContent = "Complete";
        completeButton.className = "complete-btn";

        stepItem.appendChild(stepText);
        stepItem.appendChild(completeButton);
        stepList.appendChild(stepItem);
      });

      dropDown.appendChild(stepList);
      operation.appendChild(dropDown);
      operationsSection.appendChild(operation);
    });
}