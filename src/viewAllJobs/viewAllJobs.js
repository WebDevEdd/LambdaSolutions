import "./viewAllJobs.css";
import { handleJobClick } from "./openJob.js";

const API_URL = "http://localhost:4173";

async function fetchJobs() {
  try {
    console.log("Fetching jobs from:", `${API_URL}/api/jobs`);

    const response = await fetch(`${API_URL}/api/jobs`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include", // Add this if you're using sessions
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers));

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      console.log("Response content type:", contentType);

      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        console.log("Error data:", errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      } else {
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log("Received data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
}

async function renderJobs() {
  try {
    const table = document.querySelector(".table-body");
    table.innerHTML = ""; // Clear existing content

    const jobs = await fetchJobs();
    console.log("Jobs fetched:", jobs);

    if (!Array.isArray(jobs)) {
      console.error("Expected array of jobs, got:", jobs);
      throw new Error("Invalid data format received from server");
    }

    jobs.forEach((job) => {
      const jobElement = document.createElement("tr");
      jobElement.classList.add("job-row");

      // Make sure we're using the correct property name that matches the database
      jobElement.setAttribute("data-job-title", job.jobTitle);
      console.log("Setting job title attribute:", job.jobTitle); // Debug log

      const jobName = document.createElement("td");
      jobName.textContent = job.jobTitle || "Untitled";
      jobElement.appendChild(jobName);

      const unit = document.createElement("td");
      unit.textContent = job.unit || "N/A";
      jobElement.appendChild(unit);

      const description = document.createElement("td");
      description.textContent = job.description || "No description";
      jobElement.appendChild(description);

      const isComplete = document.createElement("td");
      isComplete.textContent = job.isComplete ? "Complete" : "Incomplete";
      isComplete.classList.add(job.isComplete ? "complete" : "incomplete");
      jobElement.appendChild(isComplete);

      // Single click handler for the entire row
      jobElement.addEventListener("click", handleJobClick, { capture: true });

      table.appendChild(jobElement);
    });
  } catch (error) {
    console.error("Error in renderJobs:", error);
    const table = document.querySelector(".table-body");
    table.innerHTML = `
      <tr>
        <td colspan="4" class="error-message">
          Error loading jobs: ${error.message}
          <button onclick="location.reload()">Retry</button>
        </td>
      </tr>
    `;
  }
}

// Initialize when the document is ready
document.addEventListener("DOMContentLoaded", renderJobs);
