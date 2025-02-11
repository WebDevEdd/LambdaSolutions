import { saveJobToDB } from "../saveJobtoDB.js";

export class JobManager {
  constructor(componentManager) {
    this.componentManager = componentManager;
  }

  async createJob() {
    const jobTitle = document.getElementById("jobTitle").value;
    const jobUnit = document.getElementById("unit").value;
    const jobDescription = document.getElementById("description").value;

    const params = new URLSearchParams(window.location.search);
    const objUrl = params.get("objUrl");
    const mtlUrl = params.get("mtlUrl");

    if (!jobTitle || !jobUnit || !jobDescription || !objUrl) {
      alert("Please fill all the fields and upload a 3D file.");
      return;
    }

    const job = {
      jobTitle,
      unit: jobUnit,
      description: jobDescription,
      modelURL: `${objUrl}${mtlUrl ? `,${mtlUrl}` : ""}`,
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

    // Get all components from the UI
    const components = this.componentManager.getAllComponents();

    // Process each component
    components.forEach((component) => {
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
        specs: Array.from(component.specs || []).map((spec, index) => ({
          [`spec${index + 1}`]: spec,
        })),
      };

      // Categorize parts into partsOfModel arrays
      component.parts.forEach((partName) => {
        const prefix = partName.substring(0, 3).toUpperCase();
        if (job.partsOfModel[prefix]) {
          job.partsOfModel[prefix].push(partName);
        }
      });
    });

    try {
      const response = await fetch("/api/saveJob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      });

      if (!response.ok) throw new Error("Failed to save job");
      alert("Job saved successfully!");
    } catch (error) {
      console.error("Error saving job:", error);
      alert("Failed to save job. Please try again.");
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
