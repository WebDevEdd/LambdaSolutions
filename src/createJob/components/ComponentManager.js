import { UIManager } from "../ui/UIManager.js";

export class ComponentManager {
  constructor() {
    this.components = [];
    this.container = document.querySelector(".components-container");
    this.initializeBulkActions();
  }

  createComponent(name, selectedParts) {
    const box = document.createElement("div");
    box.classList.add("component-box");

    // Header
    const headerContainer = document.createElement("div");
    headerContainer.classList.add("component-header");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("component-checkbox");

    const componentNameElement = document.createElement("h3");
    componentNameElement.textContent = name;

    const removeBtn = document.createElement("button");
    removeBtn.classList.add("remove-component-btn");
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", () => this.removeComponent(box));

    headerContainer.appendChild(checkbox);
    headerContainer.appendChild(componentNameElement);
    headerContainer.appendChild(removeBtn);
    box.appendChild(headerContainer);

    // Parts List
    const partsDropdown = UIManager.createDropdownSection(
      "Parts",
      selectedParts
    );
    box.appendChild(partsDropdown);

    // Specs
    const specsDropdown = UIManager.createDropdownSection("Specs", null, {
      placeholder: "Enter spec...",
    });
    box.appendChild(specsDropdown);

    // Materials
    const materialsContainer = document.createElement("div");
    materialsContainer.classList.add("materials-container");
    const materialsTitle = document.createElement("h4");
    materialsTitle.textContent = "Required Materials";
    const materialsAddBtn = UIManager.createButton("Add Material", "add");

    box.appendChild(materialsTitle);
    box.appendChild(materialsContainer);
    box.appendChild(materialsAddBtn);

    // Steps
    const stepsContainer = document.createElement("div");
    stepsContainer.classList.add("steps-container");
    const stepsTitle = document.createElement("h4");
    stepsTitle.textContent = "Steps";
    const stepsAddBtn = UIManager.createButton("Add Step", "add");

    box.appendChild(stepsTitle);
    box.appendChild(stepsContainer);
    box.appendChild(stepsAddBtn);

    // Add event listeners
    materialsAddBtn.addEventListener("click", () =>
      UIManager.addInput(materialsContainer, "Enter material...")
    );
    stepsAddBtn.addEventListener("click", () =>
      UIManager.addInput(
        stepsContainer,
        `Step ${stepsContainer.childElementCount + 1}...`
      )
    );

    this.container.appendChild(box);
    return box;
  }

  removeComponent(box) {
    if (confirm("Are you sure you want to remove this component?")) {
      box.remove();
    }
  }

  getAllComponents() {
    const allBoxes = document.querySelectorAll(".component-box");
    return Array.from(allBoxes).map((box) => {
      const stepsContainer = box.querySelector(".steps-container");
      const materialsContainer = box.querySelector(".materials-container");
      const selectedParts = Array.from(
        box.querySelectorAll(".parts-list li")
      ).map((li) => li.textContent);

      return {
        name: box.querySelector("h3").textContent,
        parts: selectedParts,
        static: false,
        isInstalled: false,
        requiredMaterials: Array.from(
          materialsContainer.querySelectorAll(".new-input")
        )
          .map((input) => input.value)
          .filter((value) => value !== ""),
        steps: Array.from(stepsContainer.querySelectorAll(".new-input"))
          .map((input) => input.value)
          .filter((value) => value !== ""),
      };
    });
  }

  initializeBulkActions() {
    // Add Material to Selected button
    const addMaterialBtn = document.getElementById("addMaterialToSelected");
    if (addMaterialBtn) {
      addMaterialBtn.addEventListener("click", () =>
        this.addMaterialToSelected()
      );
    }

    // Add Step to Selected button
    const addStepBtn = document.getElementById("addStepToSelected");
    if (addStepBtn) {
      addStepBtn.addEventListener("click", () => this.addStepToSelected());
    }
  }

  getSelectedComponents() {
    return Array.from(document.querySelectorAll(".component-box")).filter(
      (box) => box.querySelector(".component-checkbox").checked
    );
  }

  async addMaterialToSelected() {
    const selectedComponents = this.getSelectedComponents();

    if (selectedComponents.length === 0) {
      alert("Please select at least one component");
      return;
    }

    this.showBulkActionModal("Add Materials", async (count) => {
      const inputs = document.querySelectorAll(".item-input");
      inputs.forEach((input) => {
        const material = input.value.trim();
        if (material) {
          selectedComponents.forEach((component) => {
            const materialsContainer = component.querySelector(
              ".materials-container"
            );
            UIManager.addInput(
              materialsContainer,
              "Enter material...",
              material
            );
          });
        }
      });
    });
  }

  async addStepToSelected() {
    const selectedComponents = this.getSelectedComponents();

    if (selectedComponents.length === 0) {
      alert("Please select at least one component");
      return;
    }

    this.showBulkActionModal("Add Steps", async (count) => {
      const inputs = document.querySelectorAll(".item-input");
      inputs.forEach((input, index) => {
        const step = input.value.trim();
        if (step) {
          selectedComponents.forEach((component) => {
            const stepsContainer = component.querySelector(".steps-container");
            const stepNumber = stepsContainer.childElementCount + 1;
            UIManager.addInput(stepsContainer, `Step ${stepNumber}...`, step);
          });
        }
      });
    });
  }

  showBulkActionModal(title, callback) {
    const modal = document.getElementById("bulkActionModal");
    const modalTitle = document.getElementById("modalTitle");
    const itemCount = document.getElementById("itemCount");
    const itemInputs = document.getElementById("itemInputs");
    const submitBtn = document.getElementById("modalSubmit");
    const cancelBtn = document.getElementById("modalCancel");
    const closeBtn = document.querySelector(".close-modal");

    modalTitle.textContent = title;
    modal.style.display = "block";

    const updateInputs = () => {
      const count = parseInt(itemCount.value) || 0;
      itemInputs.innerHTML = "";
      for (let i = 0; i < count; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("item-input");
        input.placeholder = `${title.includes("Step") ? "Step" : "Material"} #${
          i + 1
        }`;
        itemInputs.appendChild(input);
      }
    };

    itemCount.addEventListener("change", updateInputs);
    updateInputs();

    const closeModal = () => {
      modal.style.display = "none";
      itemCount.value = "1";
      itemInputs.innerHTML = "";
    };

    submitBtn.onclick = () => {
      callback(parseInt(itemCount.value));
      closeModal();
    };

    cancelBtn.onclick = closeModal;
    closeBtn.onclick = closeModal;

    window.onclick = (event) => {
      if (event.target === modal) {
        closeModal();
      }
    };
  }

  // ... other component management methods ...
}
