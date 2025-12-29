/**
 * Upload media file to backend
 * @param {File} file - The file to upload
 * @param {string} token - Clerk auth token
 * @returns {Promise<{url: string, type: string}>} - Upload result with URL and type
 */
export async function uploadMedia(file, token) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

  if (!file) {
    throw new Error('No file provided');
  }

  if (!token) {
    throw new Error('Authentication required');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${apiBaseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      type: data.type
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
}

/**
 * Upload multiple media files
 * @param {File[]} files - Array of files to upload
 * @param {string} token - Clerk auth token
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Array<{url: string, type: string}>>} - Array of upload results
 */
export async function uploadMultipleMedia(files, token, onProgress) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    const result = await uploadMedia(files[i], token);
    results.push(result);
  }

  return results;
}
