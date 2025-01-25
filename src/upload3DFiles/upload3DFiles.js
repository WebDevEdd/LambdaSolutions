const uploadForm = document.getElementById("uploadForm");

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Prevent the form from submitting the default way

  const formData = new FormData(uploadForm); // Create a FormData object

  try {
    const response = await fetch("http://localhost:3000/upload3DFile", {
      method: "POST",
      body: formData, // Send the FormData object
    });

    const data = await response.json();

    if (response.ok) {
      alert("File uploaded successfully!");

      // Redirect to the new HTML file, passing the file URL as a query parameter
      window.location.href = `http://localhost:5173/createJob.html?fileUrl=${encodeURIComponent(
        data.fileUrl
      )}`;
    } else {
      alert("File upload failed: " + data.message); // Show error message
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error uploading file: " + error.message);
  }
});
