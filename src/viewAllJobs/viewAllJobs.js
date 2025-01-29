import "./viewAllJobs.css";

// Replace localhost with your public Ngrok URL
fetch(
  "https://4e6f-2603-8001-1b00-430d-3104-e4ed-45d8-479f.ngrok-free.app/api/jobs"
) // Replace this with your public server URL
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json(); // Convert the response to JSON
  })
  .then((data) => {
    console.log("Jobs:", data); // Handle the data (you can update the UI with this data)
    const table = document.querySelector(".table-body"); // Select the table body

    data.forEach((job) => {
      const jobElement = document.createElement("tr"); // Create a row for the job

      const jobName = document.createElement("td");
      jobName.textContent = job.title;
      jobElement.appendChild(jobName);

      const unit = document.createElement("td");
      unit.textContent = job.unit;
      jobElement.appendChild(unit);

      const description = document.createElement("td");
      description.textContent = job.description;
      jobElement.appendChild(description);

      const isComplete = document.createElement("td");
      isComplete.textContent = job.isComplete ? "Complete" : "Incomplete";
      jobElement.appendChild(isComplete);

      // Add click event listener for redirection
      jobElement.addEventListener("click", () => {
        // Redirect to jobWorkView.html with the job title as a query parameter
        window.location.href = `./src/jobWorkView/jobWorkView.html?title=${encodeURIComponent(
          job.title
        )}`;
      });

      table.appendChild(jobElement);
    });
  })
  .catch((error) => {
    console.error("Error fetching jobs:", error); // Handle errors
  });
