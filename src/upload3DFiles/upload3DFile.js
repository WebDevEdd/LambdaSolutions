// upload3DFile.js
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
      // Pass URLs as separate parameters
      const redirectUrl = `/createJob.html?objUrl=${encodeURIComponent(data.objUrl)}` + 
        (data.mtlUrl ? `&mtlUrl=${encodeURIComponent(data.mtlUrl)}` : '');

      alert("Files uploaded successfully!");
      window.location.href = redirectUrl;
    } else {
      alert("File upload failed: " + data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error uploading file: " + error.message);
  }
});

// Add drag and drop support
const fileInputs = document.querySelectorAll('input[type="file"]');
const fileUploadContainer = document.querySelector('.file-upload-container');

fileUploadContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  fileUploadContainer.classList.add('dragover');
});

fileUploadContainer.addEventListener('dragleave', () => {
  fileUploadContainer.classList.remove('dragover');
});

fileUploadContainer.addEventListener('drop', (e) => {
  e.preventDefault();
  fileUploadContainer.classList.remove('dragover');
  
  const files = Array.from(e.dataTransfer.files);
  
  files.forEach(file => {
    if (file.name.toLowerCase().endsWith('.obj')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('objFile').files = dt.files;
    } else if (file.name.toLowerCase().endsWith('.mtl')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      document.getElementById('mtlFile').files = dt.files;
    }
  });
});

// Add file validation
document.getElementById('objFile').addEventListener('change', validateFiles);
document.getElementById('mtlFile').addEventListener('change', validateFiles);

function validateFiles() {
  const objFile = document.getElementById('objFile').files[0];
  const mtlFile = document.getElementById('mtlFile').files[0];
  const submitButton = document.querySelector('input[type="submit"]');

  if (!objFile) {
    submitButton.disabled = true;
    return;
  }

  if (objFile.size > 50 * 1024 * 1024) { // 50MB limit
    alert('OBJ file size must be less than 50MB');
    document.getElementById('objFile').value = '';
    submitButton.disabled = true;
    return;
  }

  if (mtlFile && mtlFile.size > 10 * 1024 * 1024) { // 10MB limit for MTL
    alert('MTL file size must be less than 10MB');
    document.getElementById('mtlFile').value = '';
    submitButton.disabled = true;
    return;
  }

  submitButton.disabled = false;
}