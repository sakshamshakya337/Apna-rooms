/**
 * Compresses an image file to be under a specific size limit (default 2MB)
 * @param {File} file The image file to compress
 * @param {number} maxSizeInMB The maximum size in MB
 * @returns {Promise<Blob>} A promise that resolves to the compressed image blob
 */
export const compressImage = async (file, maxSizeInMB = 2) => {
  return new Promise((resolve, reject) => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    
    if (file.size <= maxSizeInBytes) {
      // If already under the limit, return the original file
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maximum dimension for general use
        const MAX_SIZE = 1200;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Recursive compression
        const compress = (quality) => {
          canvas.toBlob((blob) => {
            if (blob.size > maxSizeInBytes && quality > 0.1) {
              // If still over limit, reduce quality further
              compress(quality - 0.1);
            } else {
              resolve(blob);
            }
          }, 'image/jpeg', quality);
        };

        compress(0.8); // Start with 0.8 quality
      };
    };
    reader.onerror = (error) => reject(error);
  });
};
