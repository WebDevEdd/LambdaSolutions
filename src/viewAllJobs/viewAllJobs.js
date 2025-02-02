import "./viewAllJobs.css";

const API_URL = "http://localhost:3000";

async function fetchJobs() {
  try {
    const response = await fetch(`${API_URL}/api/jobs`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.headers.get("content-type")?.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      } else {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

async function renderJobs() {
  try {
    const table = document.querySelector(".table-body");
    table.innerHTML = ''; // Clear existing content
    
    const jobs = await fetchJobs();
    console.log("Jobs fetched:", jobs);

    if (!Array.isArray(jobs)) {
      console.error('Expected array of jobs, got:', jobs);
      throw new Error('Invalid data format received from server');
    }

    jobs.forEach(job => {
      const jobElement = document.createElement("tr");
      
      // Add hover effect class
      jobElement.classList.add('job-row');

      const jobName = document.createElement("td");
      jobName.textContent = job.title || 'Untitled';
      jobElement.appendChild(jobName);

      const unit = document.createElement("td");
      unit.textContent = job.unit || 'N/A';
      jobElement.appendChild(unit);

      const description = document.createElement("td");
      description.textContent = job.description || 'No description';
      jobElement.appendChild(description);

      const isComplete = document.createElement("td");
      isComplete.textContent = job.isComplete ? "Complete" : "Incomplete";
      isComplete.classList.add(job.isComplete ? 'complete' : 'incomplete');
      jobElement.appendChild(isComplete);

      jobElement.addEventListener("click", () => {
        window.location.href = `./src/jobWorkView/jobWorkView.html?title=${encodeURIComponent(job.title)}`;
      });

      table.appendChild(jobElement);
    });
  } catch (error) {
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
document.addEventListener('DOMContentLoaded', renderJobs);