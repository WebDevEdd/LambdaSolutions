export class UIManager {
  static createDropdownSection(
    title,
    initialContent = null,
    addButtonConfig = null
  ) {
    const section = document.createElement("div");
    section.classList.add("parts-section");

    const header = document.createElement("div");
    header.classList.add("parts-header");
    header.innerHTML = `
            <span>${title}</span>
            <button class="toggle-btn">▼</button>
        `;

    const contentList = document.createElement("div");
    contentList.classList.add("parts-list");
    contentList.style.maxHeight = "0";
    contentList.style.overflow = "hidden";

    const ul = document.createElement("ul");

    if (initialContent) {
      initialContent.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
    }

    if (addButtonConfig) {
      const addBtn = document.createElement("button");
      addBtn.classList.add("add-spec-btn");
      addBtn.textContent = "+";
      addBtn.addEventListener("click", () => {
        const newInput = this.createInput(addButtonConfig.placeholder);
        ul.appendChild(newInput);
        newInput.focus();
      });
      contentList.appendChild(ul);
      contentList.appendChild(addBtn);
    } else {
      contentList.appendChild(ul);
    }

    header.addEventListener("click", () => {
      const isExpanded = contentList.style.maxHeight !== "0px";
      const toggleBtn = header.querySelector(".toggle-btn");

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

  static createInput(placeholder) {
    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.placeholder = placeholder;
    newInput.classList.add("new-input");

    newInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const nextInput = this.createInput(placeholder);
        newInput.parentNode.insertBefore(nextInput, newInput.nextSibling);
        nextInput.focus();
      }
    });

    return newInput;
  }

  static createButton(text, className) {
    const button = document.createElement("button");
    button.textContent = text;
    button.classList.add(className);
    return button;
  }

  static addInput(container, placeholder, initialValue = "") {
    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("new-input");
    input.placeholder = placeholder;
    input.value = initialValue;
    container.appendChild(input);
    return input;
  }

  // ... other UI utility methods ...
}
