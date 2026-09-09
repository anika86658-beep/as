/**
 * Compresses an image File or Data URL to optimized JPEG format (max width/height 800px, quality 0.75)
 * ensuring it takes <60KB instead of 5-10MB in local storage and Firestore.
 */
export async function compressImage(fileOrDataUrl: File | string, maxDimension = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    // If it's already an http/https URL, return directly
    if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
      resolve(fileOrDataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        console.warn('Canvas compression error:', err);
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };

    img.onerror = () => {
      if (typeof fileOrDataUrl === 'string') {
        resolve(fileOrDataUrl);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(fileOrDataUrl);
      }
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
