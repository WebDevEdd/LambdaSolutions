async function saveJobToDB(job) {
      try {
        const response = await fetch('http://localhost:3000/api/saveJob', { // Use the correct port here
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(job),
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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
    