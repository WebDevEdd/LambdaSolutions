const uploadForm = document.getElementById("uploadForm");

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(uploadForm);

  try {
    const response = await fetch("/upload3DFile", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      alert("File uploaded successfully!");
      window.location.href = `/createJob.html?fileUrl=${encodeURIComponent(
        data.fileUrl
      )}`;
    } else {
      alert("File upload failed: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error uploading file: " + error.message);
  }
});
