export const handleJobClick = async (event) => {
  // Prevent any default behavior immediately
  event.preventDefault();
  event.stopPropagation();

  console.log("Job clicked", event.target); // Debug log

  // Find the closest tr element from the clicked element
  const row = event.target.closest("tr");
  console.log("Found row:", row); // Debug log

  if (!row) {
    console.log("No row found");
    return;
  }

  // Get the job title from the data attribute
  const jobTitle = row.getAttribute("data-job-title");
  console.log("Job title from attribute:", jobTitle); // Debug log

  if (!jobTitle) {
    console.log("No job title found");
    return;
  }

  try {
    // First verify the job exists
    const checkResponse = await fetch(
      `/api/job/title/${encodeURIComponent(jobTitle)}`
    );
    if (!checkResponse.ok) {
      throw new Error(`Job not found: ${jobTitle}`);
    }

    // If job exists, navigate
    const url = `/jobWorkView.html?title=${encodeURIComponent(jobTitle)}`;
    console.log("Navigating to:", url);
    window.location.href = url;
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to find job. Please try again.");
  }
};
