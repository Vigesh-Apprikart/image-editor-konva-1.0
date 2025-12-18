"use client";

export const applyAIEdit = async (imageData, prompt) => {
  const apiUrl = 'https://prompthkit.apprikart.com/api/v1/ai/edit-image/upload';
  const token = localStorage.getItem("token");

  try {
    // Convert image data to Blob
    let imageBlob;
    if (typeof imageData === 'string') {
      if (imageData.startsWith('data:image')) {
        // Handle base64 string
        const response = await fetch(imageData);
        imageBlob = await response.blob();
      } else if (imageData.startsWith('http')) {
        // Handle URL
        const response = await fetch(imageData, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }
        imageBlob = await response.blob();
      } else {
        throw new Error('Invalid image data format: Not a valid base64 string or URL');
      }
    } else if (imageData instanceof File) {
      // Handle File object
      imageBlob = imageData;
    } else {
      throw new Error('Invalid image data format: Must be a base64 string, URL, or File');
    }

    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png'); // Ensure filename is included
    formData.append('prompt', prompt);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    //  chordify the response handling to ensure robustness
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid or expired token');
      }
      throw new Error(`API request failed: ${response.statusText} (${response.status})`);
    }

    if (!data.success || !data.data?.imageUrl?.url) {
      throw new Error('No edited image returned from API');
    }

    return data.data.imageUrl.url; // Return the image URL from the expected response structure
  } catch (error) {
    console.error('AI Edit API Error:', error);
    throw error;
  }
};