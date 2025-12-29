/**
 * Image cropping utilities using HTML5 Canvas
 * Used by ImageEditorDialog to generate cropped/rotated image files
 */

/**
 * Create an HTMLImageElement from a URL
 * @param {string} url - Image URL (data URL or blob URL)
 * @returns {Promise<HTMLImageElement>}
 */
export function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Avoid CORS issues
    image.src = url;
  });
}

/**
 * Get radians from degrees
 * @param {number} deg - Degrees
 * @returns {number} Radians
 */
function getRadianAngle(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate rotated image dimensions
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} rotation - Rotation in degrees
 * @returns {{ width: number, height: number }}
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * Generate cropped image from source image and crop data
 * @param {string} imageSrc - Image source URL
 * @param {Object} croppedAreaPixels - Crop area in pixels { x, y, width, height }
 * @param {number} rotation - Rotation angle in degrees (0-360)
 * @param {string} mimeType - Output MIME type (default: image/jpeg)
 * @param {number} quality - JPEG quality 0-1 (default: 0.9)
 * @returns {Promise<Blob>}
 */
export async function getCroppedBlob(
  imageSrc,
  croppedAreaPixels,
  rotation = 0,
  mimeType = 'image/jpeg',
  quality = 0.9
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const maxSize = 4096; // Max dimension to prevent huge canvases

  // Calculate rotated image size
  const rotRad = getRadianAngle(rotation);
  const { width: rotatedWidth, height: rotatedHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to crop area
  let canvasWidth = croppedAreaPixels.width;
  let canvasHeight = croppedAreaPixels.height;

  // Scale down if too large
  if (canvasWidth > maxSize || canvasHeight > maxSize) {
    const scale = Math.min(maxSize / canvasWidth, maxSize / canvasHeight);
    canvasWidth = Math.floor(canvasWidth * scale);
    canvasHeight = Math.floor(canvasHeight * scale);
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Fill with white background (for transparency)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Translate to center
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

  // Draw rotated image
  const drawWidth = canvasWidth * (rotatedWidth / croppedAreaPixels.width);
  const drawHeight = canvasHeight * (rotatedHeight / croppedAreaPixels.height);
  const offsetX = canvasWidth / 2 - (croppedAreaPixels.x + croppedAreaPixels.width / 2) * (drawWidth / rotatedWidth);
  const offsetY = canvasHeight / 2 - (croppedAreaPixels.y + croppedAreaPixels.height / 2) * (drawHeight / rotatedHeight);

  ctx.drawImage(
    image,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight
  );

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas to Blob conversion failed'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Convert Blob to File
 * @param {Blob} blob - Image blob
 * @param {string} filename - Desired filename
 * @returns {File}
 */
export function blobToFile(blob, filename) {
  return new File([blob], filename, {
    type: blob.type,
    lastModified: Date.now(),
  });
}

/**
 * Get appropriate MIME type from filename
 * @param {string} filename - Original filename
 * @returns {string} MIME type
 */
export function getMimeType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };
  return mimeTypes[ext] || 'image/jpeg';
}
