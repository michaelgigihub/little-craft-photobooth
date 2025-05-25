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
  const { photoSession, addPhoto, clearPhotos } = usePhotoContext();
  const { layout, photoCount } = photoSession;

  // Redirect to home if no session is active
  useEffect(() => {
    if (!layout || !photoCount) {
      navigate({ to: "/" });
    }
  }, [layout, photoCount, navigate]);

  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [countdownTime, setCountdownTime] = useState(3); // Default to 3 seconds
  const webcamRef = useRef(null);

  // Debug log
  console.log("Current state:", {
    layout,
    photoCount,
    capturedPhotos: photoSession.photos.length,
    capturing,
  });

  // Set up webcam constraints for better quality and mobile compatibility
  const videoConstraints = {
    width: { ideal: 1920, min: 640 }, // Increased from 1024
    height: { ideal: 1440, min: 480 }, // Increased from 768
    facingMode: "user",
    aspectRatio: { ideal: 4 / 3 },
  };

  // Function to capture a photo with maximum quality
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot({
        width: 1920, // High resolution
        height: 1440, // 4:3 aspect ratio
        quality: 1.0, // Maximum quality
      });
      addPhoto(imageSrc);
      console.log(
        `Captured photo ${photoSession.photos.length + 1} of ${photoCount}`
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
        <div className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={1.0} // Maximum quality
            videoConstraints={videoConstraints}
            className="webcam-video"
            style={{ transform: "scaleX(-1)" }}
          />
          {countdown !== null && countdown >= 0 && (
            <div className="counter">{countdown}</div>
          )}
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
