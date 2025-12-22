import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomPart}`;
};

/**
 * Convert base64 data URL to Blob
 */
const dataURLtoBlob = (dataURL) => {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Upload photos to Supabase Storage and create a shareable session
 * @param {string[]} photos - Array of base64 photo data URLs
 * @param {string} layout - Layout type (a, b, c, d)
 * @returns {Promise<{sessionId: string, success: boolean, error?: string}>}
 */
export const uploadPhotosToSupabase = async (photos, layout) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    const sessionId = generateSessionId();

    // Upload each photo
    const uploadPromises = photos.map(async (photo, index) => {
      const blob = dataURLtoBlob(photo);
      const fileName = `${sessionId}/photo-${index + 1}.jpg`;

      const { error } = await supabase.storage
        .from("photos")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) throw error;
      return fileName;
    });

    await Promise.all(uploadPromises);

    // Store session metadata
    const metadataFileName = `${sessionId}/metadata.json`;
    const metadata = {
      layout,
      photoCount: photos.length,
      createdAt: new Date().toISOString(),
    };

    const { error: metaError } = await supabase.storage
      .from("photos")
      .upload(metadataFileName, JSON.stringify(metadata), {
        contentType: "application/json",
        upsert: true,
      });

    if (metaError) throw metaError;

    return { sessionId, success: true };
  } catch (error) {
    console.error("Error uploading photos:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Fetch photos from Supabase Storage by session ID
 * @param {string} sessionId - The session ID to fetch
 * @returns {Promise<{photos: string[], layout: string, success: boolean, error?: string}>}
 */
export const fetchPhotosFromSupabase = async (sessionId) => {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase not configured" };
  }

  try {
    // Fetch metadata first
    const { data: metadataBlob, error: metaError } = await supabase.storage
      .from("photos")
      .download(`${sessionId}/metadata.json`);

    if (metaError) throw metaError;

    const metadataText = await metadataBlob.text();
    const metadata = JSON.parse(metadataText);

    // Fetch all photos
    const photos = [];
    for (let i = 1; i <= metadata.photoCount; i++) {
      const { data: photoBlob, error: photoError } = await supabase.storage
        .from("photos")
        .download(`${sessionId}/photo-${i}.jpg`);

      if (photoError) throw photoError;

      // Convert blob to base64 data URL
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(photoBlob);
      });

      photos.push(base64);
    }

    return {
      photos,
      layout: metadata.layout,
      photoCount: metadata.photoCount,
      success: true,
    };
  } catch (error) {
    console.error("Error fetching photos:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate shareable URL for a session
 * @param {string} sessionId - The session ID
 * @returns {string} Full URL to the photo strip preview
 */
export const generateShareableUrl = (sessionId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/photo-strip-preview?session=${sessionId}`;
};

/**
 * Check if Supabase is available for sharing
 */
export { isSupabaseConfigured };
