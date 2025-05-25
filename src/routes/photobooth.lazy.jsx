import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { usePhotoContext } from "../context/PhotoContext";
import "../assets/css/photobooth.lazy.css";

export const Route = createLazyFileRoute("/photobooth")({
  component: PhotoboothComponent,
});

function PhotoboothComponent() {
  const navigate = useNavigate();
  const { photoSession, addPhoto, clearPhotos, hasActiveSession } =
    usePhotoContext();
  const { layout, photoCount } = photoSession;

  // Redirect to home if no session is active
  useEffect(() => {
    if (!hasActiveSession()) {
      navigate({ to: "/" });
    }
  }, [hasActiveSession, navigate]);

  // Early return if no valid session to prevent errors during redirect
  if (!hasActiveSession()) {
    return (
      <div className="photobooth-container">
        <h2>Redirecting...</h2>
        <p>Setting up photo booth session...</p>
      </div>
    );
  }
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [countdownTime, setCountdownTime] = useState(3);
  const [webcamError, setWebcamError] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const webcamRef = useRef(null);

  // Debug log
  console.log("Current state:", {
    layout,
    photoCount,
    capturedPhotos: photoSession.photos.length,
    capturing,
  }); // Set up webcam constraints for better quality and mobile compatibility
  const getVideoConstraints = () => {
    // Detect if we're on a mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (isMobile) {
      return {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 960, min: 480 },
        facingMode: "user",
        aspectRatio: { ideal: 4 / 3 },
        frameRate: { ideal: 30, min: 15 },
        // Mobile-specific optimizations
        advanced: [
          { width: { min: 640, ideal: 1280, max: 1920 } },
          { height: { min: 480, ideal: 960, max: 1440 } },
          { aspectRatio: { ideal: 4 / 3 } },
          { frameRate: { ideal: 30 } },
        ],
      };
    } else {
      return {
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1440, min: 480 },
        facingMode: "user",
        aspectRatio: { ideal: 4 / 3 },
        frameRate: { ideal: 30, min: 15 },
        advanced: [
          { width: { min: 1280 } },
          { height: { min: 960 } },
          { aspectRatio: { exact: 4 / 3 } },
        ],
      };
    }
  };

  const videoConstraints = getVideoConstraints();

  // Handle webcam errors
  const handleWebcamError = useCallback((error) => {
    console.error("Webcam error:", error);
    setWebcamError(
      "Unable to access camera. Please check your camera permissions and try again."
    );
  }, []);
  // Handle webcam ready (called when user media is accessed successfully)
  const handleWebcamReady = useCallback(() => {
    console.log("Webcam is ready");
    setWebcamReady(true);
    setWebcamError(null);
  }, []);

  // Function to capture a photo with maximum quality and proper 4:3 cropping
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      // Get the webcam video element to check its actual dimensions
      const video = webcamRef.current.video;
      if (!video) return;

      console.log("Video dimensions:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      });

      // Create a canvas to properly crop the image to 4:3 aspect ratio
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set high resolution for the canvas (4:3 aspect ratio)
      const targetWidth = 1920;
      const targetHeight = 1440; // 4:3 ratio
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate the crop area to maintain 4:3 aspect ratio from the video
      const videoAspect = video.videoWidth / video.videoHeight;
      const targetAspect = 4 / 3;

      let sourceX = 0,
        sourceY = 0,
        sourceWidth = video.videoWidth,
        sourceHeight = video.videoHeight;

      if (videoAspect > targetAspect) {
        // Video is wider than 4:3, crop the sides
        sourceWidth = video.videoHeight * targetAspect;
        sourceX = (video.videoWidth - sourceWidth) / 2;
      } else {
        // Video is taller than 4:3, crop top and bottom
        sourceHeight = video.videoWidth / targetAspect;
        sourceY = (video.videoHeight - sourceHeight) / 2;
      }

      console.log("Crop area:", {
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        cropAspect: sourceWidth / sourceHeight,
      });

      // Draw the cropped video frame to match what's shown in the preview
      // Flip horizontally to match the mirrored webcam display
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        -targetWidth,
        0,
        targetWidth,
        targetHeight
      );

      // Convert to high-quality JPEG
      const imageSrc = canvas.toDataURL("image/jpeg", 1.0);
      addPhoto(imageSrc);

      console.log(
        `Captured photo ${photoSession.photos.length + 1} of ${photoCount} - Size: ${targetWidth}x${targetHeight}`
      );
    }
  }, [webcamRef, addPhoto, photoSession.photos.length, photoCount]);

  // Function to handle single countdown and photo capture
  const handleCountdown = useCallback(() => {
    return new Promise((resolve) => {
      setCountdown(countdownTime);

      let count = countdownTime;
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);

        if (count <= 0) {
          clearInterval(timer);
          capturePhoto();
          setTimeout(resolve, 500); // Short delay after capture
        }
      }, 1000);
    });
  }, [capturePhoto, countdownTime]);

  // Start the capturing process
  const startCapturing = useCallback(async () => {
    if (photoSession.photos.length >= photoCount) {
      clearPhotos(); // Reset if we already have photos
    }

    setCapturing(true);

    try {
      // First photo
      await handleCountdown();

      // Wait between photos
      const totalPhotosNeeded = photoCount;
      let photosTaken = 1; // We just took one photo

      while (photosTaken < totalPhotosNeeded) {
        await new Promise((resolve) => setTimeout(resolve, 300)); // Pause between photos
        await handleCountdown();
        photosTaken++;
      }
    } finally {
      setCapturing(false);
      setCountdown(null);
    }
  }, [handleCountdown, photoCount, photoSession.photos.length, clearPhotos]);

  // Redirect to photo-strip-preview when all photos are captured
  useEffect(() => {
    if (
      photoSession.photos.length === photoCount &&
      photoSession.photos.length > 0
    ) {
      // Navigate to photo-strip-preview
      navigate({ to: "/photo-strip-preview" });
    }
  }, [photoSession.photos, photoCount, navigate]);

  // Reset the captures
  const resetCaptures = () => {
    clearPhotos();
    setCapturing(false);
    setCountdown(null);
  };

  // Determine layout class for the grid
  const getLayoutClass = () => {
    switch (layout) {
      case "a":
        return "layout-a";
      case "b":
        return "layout-b";
      case "c":
        return "layout-c";
      case "d":
        return "layout-d";
      default:
        return "layout-a";
    }
  };
  return (
    <div className="photobooth-container">
      <h2>Photo Booth</h2>
      <div className="photo-count-info">
        Layout: {layout.toUpperCase()} - {photoCount} photos
      </div>

      {photoSession.photos.length < photoCount && (
        <div className="webcam-preview-container">
          <div className="webcam-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={1.0} // Maximum quality
              videoConstraints={videoConstraints}
              className="webcam-video"
              style={{ transform: "scaleX(-1)" }}
              onUserMedia={handleWebcamReady}
              onUserMediaError={handleWebcamError}
            />
            {countdown !== null && countdown >= 0 && (
              <div className="counter">{countdown}</div>
            )}
          </div>

          {/* Preview of the latest captured photo */}
          {photoSession.photos.length > 0 && (
            <div className="preview-container">
              <img
                src={photoSession.photos[photoSession.photos.length - 1]}
                alt="Last captured photo"
                className="preview-image"
              />
              <div className="preview-label">
                Photo {photoSession.photos.length}/{photoCount}
              </div>
            </div>
          )}
        </div>
      )}

      {webcamError && (
        <div className="webcam-error">
          <p>{webcamError}</p>
          <button onClick={() => setWebcamError(null)}>Retry</button>
        </div>
      )}

      {photoSession.photos.length < photoCount && !capturing && (
        <div className="countdown-selector">
          <p>Select Countdown Time</p>
          <div className="countdown-options">
            <button
              className="countdown-option"
              onClick={() => setCountdownTime(3)}
              data-selected={countdownTime === 3}
            >
              3 sec
            </button>
            <button
              className="countdown-option"
              onClick={() => setCountdownTime(5)}
              data-selected={countdownTime === 5}
            >
              5 sec
            </button>
            <button
              className="countdown-option"
              onClick={() => setCountdownTime(10)}
              data-selected={countdownTime === 10}
            >
              10 sec
            </button>
          </div>
        </div>
      )}

      <div className="controls">
        {photoSession.photos.length < photoCount ? (
          <button
            className="capture-btn"
            onClick={startCapturing}
            disabled={capturing}
          >
            {photoSession.photos.length === 0
              ? "Start Taking Photos"
              : capturing
                ? `Capturing in progress...`
                : `Continue Photo Session (${photoSession.photos.length}/${photoCount} taken)`}
          </button>
        ) : (
          <button className="finish-btn" onClick={resetCaptures}>
            Reset & Take New Photos
          </button>
        )}

        {capturing && (
          <p className="capturing-status">
            Taking photo {photoSession.photos.length + 1} of {photoCount}
            {countdown !== null && countdown > 0 && ` in ${countdown}...`}
          </p>
        )}
      </div>
    </div>
  );
}
