/**
 * Cloudinary connection helper configured to upload files (images & videos)
 * to Cloud Name: dy7avkqub using the upload preset ml_default.
 * Includes a robust offline-first fallback to Base64 Data URLs if 
 * the Cloudinary cloud/preset is not fully whitelisted or configured yet.
 */

// Helper to convert File/Blob to Base64 Data URL
function convertToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to Base64 string."));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Client-side lightweight image compression for LocalStorage persistence
function compressAndResizeImage(
  file: File | Blob,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio retaining constraints
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback if canvas context is not fully initialized
          convertToBase64(file).then(resolve).catch(reject);
          return;
        }

        // Check if the uploaded file is a format that supports transparency (PNG, WEBP, GIF, SVG)
        const isTransparentType = file.type === "image/png" || file.type === "image/gif" || file.type === "image/webp" || file.type === "image/svg+xml";

        if (!isTransparentType) {
          // Fill with white background (useful for non-transparent images to JPG conversion)
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export compression PNG/WEBP data stream for transparent files, or JPEG for others
        const exportMime = isTransparentType ? "image/png" : "image/jpeg";
        const compressedBase64 = canvas.toDataURL(exportMime, isTransparentType ? undefined : quality);
        console.log(`[Compression Engine]: Compressed image from ${file.size} bytes down to base64 size of ${compressedBase64.length} chars (approx ${Math.round(compressedBase64.length * 0.75)} bytes)`);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        // Fallback if not an image type of document
        convertToBase64(file).then(resolve).catch(reject);
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("File reader outcome was empty"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function uploadToCloudinary(
  file: File | Blob,
  resourceType: "image" | "video" = "image"
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dy7avkqub/${resourceType}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detailedMessage = errorData?.error?.message || `Cloudinary ${resourceType} upload returned status ${response.status}`;
      throw new Error(detailedMessage);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.warn(
      `[Cloudinary Fallback Active] The upload failed (${error.message || error}). ` +
      `Automatically falling back to a local high-fidelity Base64 Data URL so the application remains 100% active and editable.`
    );
    
    // Convert to local Base64 string with live compression if it is an image to fit with LocalStorage quotas
    if (resourceType === "image" && file.type && file.type.startsWith("image/")) {
      try {
        return await compressAndResizeImage(file, 600, 600, 0.7);
      } catch (compressionErr) {
        console.error("Compression engine failed:", compressionErr);
        return await convertToBase64(file);
      }
    }
    
    return await convertToBase64(file);
  }
}

// Stable session timestamp used to cache-bust Cloudinary resources on application reload/re-fetch.
// This prevents browser caching from serving stale versions, while avoiding a dynamic 
// Date.now() on every render frame which would cause performance bottlenecks and image flickering.
const SESSION_TIMESTAMP = Date.now();

/**
 * Appends a versioning query parameter (e.g., ?v=TIMESTAMP) to all product image URLs,
 * branding resources, and static assets loaded from Cloudinary.
 */
export function getVersionedCloudinaryUrl(url: string | undefined | null): string {
  if (!url) return "";
  
  const isCloudinary = url.includes("cloudinary.com");
  const isStaticAsset = url.startsWith("/") && !url.startsWith("data:");
  
  if (isCloudinary || isStaticAsset) {
    try {
      const separator = url.includes("?") ? "&" : "?";
      // Skip if it already contains a version query parameter
      if (url.includes("?v=") || url.includes("&v=")) {
        return url;
      }
      return `${url}${separator}v=${SESSION_TIMESTAMP}`;
    } catch {
      return url;
    }
  }
  
  return url;
}

