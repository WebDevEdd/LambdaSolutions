import { saveJobToDB } from "../saveJobtoDB.js";

export class JobManager {
  constructor(componentManager) {
    this.componentManager = componentManager;
  }

  async createJob() {
    try {
      // Get form values
      const jobTitle = document.getElementById("jobTitle")?.value?.trim();
      const unit = document.getElementById("unit")?.value?.trim();
      const description = document.getElementById("description")?.value?.trim();

      // Validate required fields
      if (!jobTitle || jobTitle.length < 3) {
        throw new Error("Job Title must be at least 3 characters long");
      }
      if (!unit || unit.length < 1) {
        throw new Error("Unit is required");
      }
      if (!description || description.length < 10) {
        throw new Error("Description must be at least 10 characters long");
      }

      // Get model URLs from params
      const params = new URLSearchParams(window.location.search);
      const objUrl = params.get("objUrl");
      const mtlUrl = params.get("mtlUrl");

      if (!objUrl) {
        throw new Error("No 3D model URL found");
      }

      // Create job structure
      const job = {
        jobTitle,
        unit,
        description,
        model: {
          obj: objUrl,
          mtl: mtlUrl,
        },
        partsOfModel: {
          LRU: [],
          HRD: [],
          BKT: [],
          STR: [],
          WIR: [],
        },
        jobComponents: {},
        isComplete: false,
      };

      // Process components
      const components = this.componentManager.getAllComponents();
      if (!components || components.length === 0) {
        throw new Error("Please create at least one component before saving");
      }

      components.forEach((component) => {
        if (!component.name) {
          throw new Error("Each component must have a name");
        }

        job.jobComponents[component.name] = {
          parts: component.parts.map((partName) => ({
            name: partName,
            type: this.determinePartType(partName),
            quantity: 1,
          })),
          requiredMaterials: component.requiredMaterials.map((material) => ({
            name: material,
          })),
          steps: component.steps.map((step, index) => ({
            [`step${index + 1}`]: step,
            isComplete: false,
          })),
          specs: [],
        };

        // Categorize parts
        component.parts.forEach((partName) => {
          const prefix = partName.substring(0, 3).toUpperCase();
          if (job.partsOfModel[prefix]) {
            job.partsOfModel[prefix].push(partName);
          }
        });
      });

      console.log("Sending job data:", job);

      // Send to server
      const response = await fetch("/api/saveJob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || "Server Error: Failed to save job"
        );
      }

      // Show success message
      document.querySelector(".job-saved-layer").style.display = "flex";
      console.log("Job saved successfully:", responseData);
    } catch (error) {
      console.error("Error saving job:", error);
      alert(error.message || "Failed to save job. Please try again.");
    }
  }

  determinePartType(partName) {
    const prefix = partName.substring(0, 3).toLowerCase();
    switch (prefix) {
      case "hrd":
        return "fastener";
      case "bkt":
        return "bracket";
      case "wir":
        return "wire";
      case "str":
        return "structure";
      case "lru":
        return "equipment";
      default:
        return "other";
    }
  }
}
