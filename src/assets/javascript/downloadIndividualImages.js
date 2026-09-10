import { dataURLtoBlob, triggerBlobDownload } from "./downloadUtils.js";

/**
 * Download individual images as separate JPEG files
 * Uses Blob URLs instead of data URLs for iOS Safari compatibility.
 * @param {Array} photos - Array of photo data URLs
 * @param {string} layout - Layout type (for filename prefix)
 */
export const downloadIndividualImages = (photos, layout) => {
  if (!photos || photos.length === 0) {
    console.error("No photos to download");
    return;
  }
  // Detect if user is on mobile (especially iOS)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // On mobile, let user download each photo manually
    downloadManuallyMobile(photos, layout);
  } else {
    // Desktop: can handle faster downloads
    downloadSimultaneously(photos, layout);
  }
};

/**
 * Download photos manually one by one for mobile devices
 */
const downloadManuallyMobile = (photos, layout) => {
  let currentIndex = 0;
  
  const downloadCurrentPhoto = () => {
    if (currentIndex >= photos.length) {
      // All photos downloaded - show completion message
      setTimeout(() => {
        alert(`🎉 All ${photos.length} photos downloaded successfully!`);
      }, 1000);
      return;
    }

    const photoDataUrl = photos[currentIndex];
    const blob = dataURLtoBlob(photoDataUrl);
    triggerBlobDownload(blob, `little-craft-photo-${layout}-${currentIndex + 1}.jpg`);
    
    currentIndex++;
    
    // If there are more photos, prompt for the next one
    if (currentIndex < photos.length) {
      // Use longer delay and try multiple times if needed
      setTimeout(() => {
        showNextPhotoPrompt();
      }, 1500); // Longer delay for mobile
    } else {
      // All photos downloaded
      setTimeout(() => {
        alert(`🎉 All ${photos.length} photos downloaded successfully!`);
      }, 1000);
    }
  };

  const showNextPhotoPrompt = () => {
    try {
      const downloadNext = confirm(
        `📸 Photo ${currentIndex}/${photos.length} downloaded!\n\n` +
        `Ready to download photo ${currentIndex + 1}?`
      );
      
      if (downloadNext) {
        // Small delay before next download
        setTimeout(() => {
          downloadCurrentPhoto();
        }, 300);
      } else {
        alert(`📱 Download paused.\n\nTap "Download Photos" again to continue from photo ${currentIndex + 1}.`);
      }    } catch {
      // If confirm fails, try again after a longer delay
      console.log('Retrying prompt for next photo...');
      setTimeout(() => {
        showNextPhotoPrompt();
      }, 1000);
    }
  };

  // Start the process
  if (photos.length === 1) {
    downloadCurrentPhoto();
  } else {
    const startDownload = confirm(
      `📱 Ready to download ${photos.length} photos.\n\n` +
      `You'll be prompted for each photo.\n\nDownload photo 1 now?`
    );
    
    if (startDownload) {
      downloadCurrentPhoto();
    } else {
      alert(`📱 Download cancelled. Tap "Download Photos" again when ready.`);
    }
  }
};

/**
 * Download photos simultaneously for desktop devices
 */
const downloadSimultaneously = (photos, layout) => {
  photos.forEach((photoDataUrl, index) => {
    setTimeout(() => {
      const blob = dataURLtoBlob(photoDataUrl);
      triggerBlobDownload(blob, `little-craft-photo-${layout}-${index + 1}.jpg`);
    }, index * 200); // 200ms delay between each download
  });

  console.log(`Downloaded ${photos.length} individual photos`);
};
