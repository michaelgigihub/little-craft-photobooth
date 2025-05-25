import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import gifshot from "gifshot";
import { usePhotoContext } from "../context/PhotoContext";
import "../assets/css/photo-strip-preview.lazy.css";

export const Route = createLazyFileRoute("/photo-strip-preview")({
  component: PhotoStripPreviewComponent,
});

function PhotoStripPreviewComponent() {
  const navigate = useNavigate();
  const { photoSession, resetSession } = usePhotoContext();
  const { layout, photoCount, photos } = photoSession;
  const canvasRef = useRef(null);
  const [stripGenerated, setStripGenerated] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);

  // Redirect to home if no session is active
  useEffect(() => {
    if (!layout || !photoCount || !photos || photos.length === 0) {
      navigate({ to: "/" });
    }
  }, [layout, photoCount, photos, navigate]);
  // Photo strip dimensions - higher resolution for better quality
  const stripWidth = 1200; // Increased for even better quality
  const photoMargin = 30; // Increased proportionally
  // Padding to match CSS: top: 30px, right: 30px, bottom: 300px, left: 30px
  const canvasPadding = { top: 30, right: 30, bottom: 300, left: 30 };

  // Calculate height based on layout and 4:3 aspect ratio
  const getStripHeight = () => {
    const photoHeight = ((stripWidth - photoMargin * 2) * 3) / 4; // 4:3 aspect ratio
    switch (layout) {
      case "a": // 4 photos, 1 per row
        return (photoHeight + photoMargin) * 4 + photoMargin;
      case "b": // 3 photos, 1 per row
        return (photoHeight + photoMargin) * 3 + photoMargin;
      case "c": // 2 photos, 1 per row
        return (photoHeight + photoMargin) * 2 + photoMargin;
      case "d": // 6 photos, 2 per row (3 rows)
        return (photoHeight + photoMargin) * 3 + photoMargin;
      default:
        return (photoHeight + photoMargin) * 4 + photoMargin;
    }
  };
  const stripHeight = getStripHeight();

  // Canvas dimensions including padding
  const canvasWidth = stripWidth + canvasPadding.left + canvasPadding.right;
  const canvasHeight = stripHeight + canvasPadding.top + canvasPadding.bottom;

  // Generate the photo strip when component mounts
  useEffect(() => {
    if (photos && photos.length > 0) {
      generatePhotoStrip();
    }
  }, [photos]);

  // Function to load an image from base64 data
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Function to generate the photo strip on canvas
  const generatePhotoStrip = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !photos) return;

    const ctx = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Set white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    try {
      // Load all images
      const images = await Promise.all(photos.map(loadImage));

      // Calculate layout dimensions based on selected layout
      let photoWidth, photoHeight, cols, rows;

      switch (layout) {
        case "a": // 4 photos, 1 per row (vertical strip)
          cols = 1;
          rows = 4;
          photoWidth = stripWidth - photoMargin * 2;
          photoHeight = (photoWidth * 3) / 4; // 4:3 aspect ratio
          break;
        case "b": // 3 photos, 1 per row (vertical strip)
          cols = 1;
          rows = 3;
          photoWidth = stripWidth - photoMargin * 2;
          photoHeight = (photoWidth * 3) / 4; // 4:3 aspect ratio
          break;
        case "c": // 2 photos, 1 per row (vertical strip)
          cols = 1;
          rows = 2;
          photoWidth = stripWidth - photoMargin * 2;
          photoHeight = (photoWidth * 3) / 4; // 4:3 aspect ratio
          break;
        case "d": // 6 photos, 2 per row (3 rows)
          cols = 2;
          rows = 3;
          photoWidth = (stripWidth - photoMargin * 3) / 2;
          photoHeight = (photoWidth * 3) / 4; // 4:3 aspect ratio
          break;
        default:
          cols = 1;
          rows = 4;
          photoWidth = stripWidth - photoMargin * 2;
          photoHeight = (photoWidth * 3) / 4; // 4:3 aspect ratio
      }      // Draw photos in the grid
      images.forEach((img, index) => {
        if (index >= cols * rows) return; // Don't draw more photos than the layout supports

        const col = index % cols;
        const row = Math.floor(index / cols);

        const x =
          canvasPadding.left + photoMargin + col * (photoWidth + photoMargin);
        const y =
          canvasPadding.top + photoMargin + row * (photoHeight + photoMargin);

        // Since we already cropped the image to 4:3 during capture, we should maintain that ratio
        const imgAspect = img.width / img.height;
        const frameAspect = photoWidth / photoHeight;

        let drawWidth = photoWidth;
        let drawHeight = photoHeight;
        let offsetX = 0;
        let offsetY = 0;

        // The image should already be 4:3, but handle any slight variations
        if (Math.abs(imgAspect - frameAspect) > 0.01) {
          if (imgAspect > frameAspect) {
            // Image is slightly wider than frame - center crop
            drawHeight = photoHeight;
            drawWidth = photoHeight * imgAspect;
            offsetX = (photoWidth - drawWidth) / 2;
          } else {
            // Image is slightly taller than frame - center crop
            drawWidth = photoWidth;
            drawHeight = photoWidth / imgAspect;
            offsetY = (photoHeight - drawHeight) / 2;
          }
        }

        // Clip to photo area to prevent overflow
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, photoWidth, photoHeight);
        ctx.clip();

        // Draw the image (already flipped during capture, so no need to flip again)
        ctx.drawImage(
          img,
          x + offsetX,
          y + offsetY,
          drawWidth,
          drawHeight
        );
        ctx.restore();
      });

      setStripGenerated(true);
    } catch (error) {
      console.error("Error generating photo strip:", error);
    }
  };

  // Function to download as JPEG
  const downloadAsJPEG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `photo-strip-${layout}-${Date.now()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 1.0); // Maximum quality
    link.click();
  };  // Function to download as GIF
  const downloadAsGIF = async () => {
    if (!photos || photos.length === 0) return;

    setIsGeneratingGif(true);

    try {
      // Process photos to ensure consistent quality and format
      const processedImages = await Promise.all(
        photos.map(async (photo) => {
          return new Promise((resolve) => {
            // Create a temporary canvas for each image to ensure consistent sizing
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = 1200; // High resolution for GIF
            tempCanvas.height = 900; // 4:3 aspect ratio
            
            // Enable high-quality rendering
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            
            const img = new Image();
            img.onload = () => {
              // Draw the image to the canvas with consistent sizing
              tempCtx.drawImage(img, 0, 0, 1200, 900);
              resolve(tempCanvas.toDataURL('image/jpeg', 0.95)); // High quality JPEG for GIF frames
            };
            img.src = photo;
          });
        })
      );

      gifshot.createGIF(
        {
          images: processedImages,
          gifWidth: 1200, // Higher resolution
          gifHeight: 900, // 4:3 aspect ratio
          interval: 1.5, // 1.5 seconds per frame
          numFrames: photos.length,
          frameDuration: 1.5,
          fontWeight: "normal",
          fontSize: "24px", // Scaled up font
          fontFamily: "sans-serif",
          fontColor: "#ffffff",
          quality: 10, // Maximum quality (1-10 scale)
          sampleInterval: 10, // Lower sample interval for better quality
        },
        (obj) => {
          setIsGeneratingGif(false);

          if (!obj.error) {
            const link = document.createElement("a");
            link.download = `photo-strip-${layout}-${Date.now()}.gif`;
            link.href = obj.image;
            link.click();
          } else {
            console.error("Error creating GIF:", obj.error);
            alert("Error creating GIF. Please try again.");
          }
        }
      );
    } catch (error) {
      console.error("Error processing images for GIF:", error);
      setIsGeneratingGif(false);
      alert("Error processing images for GIF. Please try again.");
    }
  };

  // Function to go back and take new photos
  const takeNewPhotos = () => {
    resetSession();
    navigate({ to: "/" });
  };

  // Redirect to home if no photos are provided
  if (!photos || photos.length === 0) {
    return (
      <div className="photo-strip-container">
        <h2>No Photos Found</h2>
        <p>Please go back and take some photos first.</p>
        <button onClick={takeNewPhotos} className="action-btn primary">
          Take Photos
        </button>
      </div>
    );
  }

  return (
    <div className="photo-strip-container">
      <h2>Your Photo Strip</h2>
      <div className="strip-info">
        Layout: {layout.toUpperCase()} - {photoCount} photos
      </div>

      <div className="canvas-container">
        <canvas ref={canvasRef} className="photo-strip-canvas" />
      </div>

      {stripGenerated && (
        <div className="download-controls">
          <h3>Download Your Photo Strip</h3>
          <div className="download-buttons">
            <button onClick={downloadAsJPEG} className="action-btn download">
              Download as JPEG
            </button>
            <button
              onClick={downloadAsGIF}
              disabled={isGeneratingGif}
              className="action-btn download"
            >
              {isGeneratingGif ? "Creating GIF..." : "Download as GIF"}
            </button>
          </div>
        </div>
      )}

      <div className="navigation-controls">
        <button onClick={takeNewPhotos} className="action-btn primary">
          Take New Photos
        </button>
      </div>
    </div>
  );
}
