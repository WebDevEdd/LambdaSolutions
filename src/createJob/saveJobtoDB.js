// saveJobToDB.js
async function saveJobToDB(job) {
  try {
    // Ensure the model URLs are in the correct format
    if (job.model && typeof job.model === 'object') {
      // If model is already an object with objUrl and mtlUrl, keep it as is
      if (!job.model.objUrl || !job.model.mtlUrl) {
        throw new Error('Model data must include both objUrl and mtlUrl');
      }
    } else if (typeof job.model === 'string') {
      // If model is a string, try to parse it as JSON
      try {
        const modelUrls = JSON.parse(job.model);
        if (!modelUrls.objUrl || !modelUrls.mtlUrl) {
          throw new Error('Invalid model URL format');
        }
        job.model = modelUrls;
      } catch (e) {
        console.error('Error parsing model URLs:', e);
        throw new Error('Invalid model URL format');
      }
    } else {
      throw new Error('Invalid model data format');
    }

    // Get the current origin, fallback to localhost if needed
    const apiUrl = `${window.location.origin}/api/saveJob`;
    
    console.log('Saving job to:', apiUrl, 'Job data:', job);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(job),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Job saved successfully:', result);
    return result;
  } catch (error) {
    console.error('Error saving job:', error);
    throw error;
  }
}

export { saveJobToDB };