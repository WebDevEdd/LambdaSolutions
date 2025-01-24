import { load3DModel } from './load3Dmodel.js';

document.addEventListener("DOMContentLoaded", () => {
  // Get the job title from the URL query parameter
  const params = new URLSearchParams(window.location.search);
  const jobTitle = params.get('title'); // Extract "title" from the URL

  if (!jobTitle) {
    console.error("No job title provided in the URL query parameters");
    return;
  }

  // Select HTML elements for dynamic updates
  const jobTitleContainer = document.querySelector(".job-title-container h1");
  const jobDescriptionContainer = document.querySelector(".job-description");
  const operationsSection = document.querySelector(".operations-section");

  // API URLs
  const jobApiUrl = `http://localhost:3000/api/job/title/${jobTitle}`;
  const modelApiUrl = `http://localhost:3000/api/job/${jobTitle}/model`;

  // Fetch job data
  fetch(jobApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch job data: ${response.statusText}`);
      }
      return response.json();
    })
    .then((job) => {
      // Set job title and description dynamically
      jobTitleContainer.textContent = job.title;
      jobDescriptionContainer.textContent = job.description;

      // Render operations for components with steps
      if (job.allComponents && job.allComponents.length > 0) {
        renderOperations(job.allComponents);
      } else {
        operationsSection.innerHTML = "<p>No operations found for this job.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching job data:", error);
      operationsSection.innerHTML = `<p>Error: ${error.message}</p>`;
    });

  // Fetch the 3D model
  fetch(modelApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data.modelUrl) {
        console.log("Model URL fetched:", data.modelUrl);
        // Pass the model URL to the loader
        load3DModel(data.modelUrl, '.right-screen');
      } else {
        console.error("No model URL returned from API");
      }
    })
    .catch((error) => {
      console.error("Error fetching 3D model:", error);
    });

    function renderOperations(components) {
      // Clear previous content
      operationsSection.innerHTML = "";
    
      // Add "Operations" title
      const operationsTitle = document.createElement("h2");
      operationsTitle.textContent = "Operations";
      operationsTitle.className = "operations-title";
      operationsSection.appendChild(operationsTitle);
    
      // Filter and render components with steps
      components
        .filter((component) => Array.isArray(component.steps) && component.steps.length > 0) // Only components with steps
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
            stepText.textContent =
              typeof step === "string"
                ? step
                : step.name || `Step ${index + 1}: No description`;
    
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
    
    

    
});
