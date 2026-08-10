// The API's nginx rejects request bodies over 1MB (client_max_body_size 1m),
// and the CORS-less 413 surfaces as an opaque "Load failed" in the browser.
// Kept slightly under 1MiB to leave room for the metadata part and multipart framing.
export const MAX_UPLOAD_BYTES = 1_000_000;

export async function compressImage(
  file: File,
  maxDimension = 1024,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not available"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          const name = file.name
            ? `${file.name.replace(/\.[^.]+$/, "")}.jpg`
            : "image.jpg";
          resolve(new File([blob], name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
